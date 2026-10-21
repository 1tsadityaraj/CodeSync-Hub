import assert from 'assert';
import http from 'http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { io as ClientIO } from 'socket.io-client';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Room from '../src/models/Room.js';
import { Server as SocketIOServer } from 'socket.io';
import { initSocketServer } from '../src/socket/index.js';
import { roomManager } from '../src/socket/roomManager.js';

let mongod;
let httpServer;
let socketServer;
let port;
let serverUrl;

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_super_secure_key_12345';
process.env.JWT_SECRET = JWT_SECRET;

async function setup() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  httpServer = http.createServer(app);
  socketServer = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
  });
  initSocketServer(socketServer);

  await new Promise((resolve) => {
    httpServer.listen(0, () => {
      port = httpServer.address().port;
      serverUrl = `http://localhost:${port}`;
      resolve();
    });
  });
}

async function teardown() {
  socketServer.close();
  await new Promise((resolve) => httpServer.close(resolve));
  await mongoose.disconnect();
  await mongod.stop();
}

function createToken(userId, email) {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '1h' });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('\n🧪 Starting CodeSync Hub WebRTC Audio/Video Signaling Test Suite...');

  let aliceUser, bobUser, charlieUser;
  let aliceToken, bobToken, charlieToken;
  let testRoom, otherRoom;

  try {
    await setup();
    console.log(`  ✅ Test HTTP & Socket.IO server running on port ${port}`);

    // Create test users
    aliceUser = await User.create({
      name: 'Alice Host',
      email: 'alice.video@test.com',
      password: 'password123',
    });
    aliceToken = createToken(aliceUser._id, aliceUser.email);

    bobUser = await User.create({
      name: 'Bob Peer',
      email: 'bob.video@test.com',
      password: 'password123',
    });
    bobToken = createToken(bobUser._id, bobUser.email);

    charlieUser = await User.create({
      name: 'Charlie Other',
      email: 'charlie.video@test.com',
      password: 'password123',
    });
    charlieToken = createToken(charlieUser._id, charlieUser.email);

    // Create test rooms
    testRoom = await Room.create({
      roomId: 'video-call-room',
      title: 'System Design Video Call',
      creator: aliceUser._id,
      language: 'javascript',
      status: 'active',
      participants: [{ user: aliceUser._id, role: 'creator' }],
    });

    otherRoom = await Room.create({
      roomId: 'other-call-room',
      title: 'Isolated Call Room',
      creator: charlieUser._id,
      language: 'python',
      status: 'active',
      participants: [{ user: charlieUser._id, role: 'creator' }],
    });

    // -------------------------------------------------------------------------
    // Test 1: Unauthenticated socket cannot establish signaling connection
    // -------------------------------------------------------------------------
    console.log('  Testing 1: Unauthenticated socket connection is rejected...');
    const unauthSocket = ClientIO(serverUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: false,
    });

    const unauthError = await new Promise((resolve) => {
      unauthSocket.on('connect_error', (err) => resolve(err.message));
    });
    assert(
      unauthError.includes('Authentication required') || unauthError.includes('Missing token'),
      `Expected unauth rejection, got: ${unauthError}`
    );
    unauthSocket.close();
    console.log('  ✅ 1. Unauthenticated socket connection correctly rejected');

    // -------------------------------------------------------------------------
    // Test 2: Alice and Bob connect with authenticated tokens
    // -------------------------------------------------------------------------
    console.log('  Testing 2: Alice and Bob connect with authenticated tokens...');
    const aliceSocket = ClientIO(serverUrl, {
      transports: ['websocket'],
      auth: { token: aliceToken },
    });
    const bobSocket = ClientIO(serverUrl, {
      transports: ['websocket'],
      auth: { token: bobToken },
    });

    await Promise.all([
      new Promise((resolve) => aliceSocket.on('connect', resolve)),
      new Promise((resolve) => bobSocket.on('connect', resolve)),
    ]);
    console.log('  ✅ 2. Alice and Bob authenticated sockets connected');

    // -------------------------------------------------------------------------
    // Test 3: Joining call without joining room first is rejected
    // -------------------------------------------------------------------------
    console.log('  Testing 3: Joining call without joining room first is rejected...');
    aliceSocket.emit('call:join', { roomId: testRoom.roomId });
    const callErr = await new Promise((resolve) => {
      aliceSocket.once('call:error', (err) => resolve(err.message));
    });
    assert(
      callErr.includes('Must join room before joining call'),
      `Expected room join requirement, got: ${callErr}`
    );
    console.log('  ✅ 3. Call join requires active room membership');

    // -------------------------------------------------------------------------
    // Test 4: Alice joins room and then joins call as first participant
    // -------------------------------------------------------------------------
    console.log('  Testing 4: Alice joins room and call...');
    aliceSocket.emit('room:join', { roomId: testRoom.roomId });
    await new Promise((resolve) => aliceSocket.once('room:ready', resolve));

    aliceSocket.emit('call:join', {
      roomId: testRoom.roomId,
      mediaState: { audio: true, video: true },
    });

    const aliceActivePeers = await new Promise((resolve) => {
      aliceSocket.once('call:active-peers', (data) => resolve(data.peers));
    });
    assert.strictEqual(aliceActivePeers.length, 0, 'Alice is first in call, peers list must be empty');
    console.log('  ✅ 4. Alice joined call and received empty active-peers list');

    // -------------------------------------------------------------------------
    // Test 5: Bob joins room and call -> Peer discovery
    // -------------------------------------------------------------------------
    console.log('  Testing 5: Bob joins call; Alice receives peer-joined and Bob receives active-peers...');
    bobSocket.emit('room:join', { roomId: testRoom.roomId });
    await new Promise((resolve) => bobSocket.once('room:ready', resolve));

    const peerJoinedPromise = new Promise((resolve) => {
      aliceSocket.once('call:peer-joined', (data) => resolve(data.peer));
    });

    bobSocket.emit('call:join', {
      roomId: testRoom.roomId,
      mediaState: { audio: true, video: false },
    });

    const [bobActivePeers, peerJoinedData] = await Promise.all([
      new Promise((resolve) => bobSocket.once('call:active-peers', (data) => resolve(data.peers))),
      peerJoinedPromise,
    ]);

    assert.strictEqual(bobActivePeers.length, 1, 'Bob should see 1 existing peer (Alice)');
    assert.strictEqual(bobActivePeers[0].socketId, aliceSocket.id);
    assert.strictEqual(bobActivePeers[0].userName, 'Alice Host');
    assert.strictEqual(peerJoinedData.socketId, bobSocket.id);
    assert.strictEqual(peerJoinedData.userName, 'Bob Peer');
    assert.strictEqual(peerJoinedData.video, false);
    console.log('  ✅ 5. Real-time peer discovery and active-peers handshake verified');

    // -------------------------------------------------------------------------
    // Test 6: WebRTC Signaling Relay (Offer, Answer, ICE Candidate)
    // -------------------------------------------------------------------------
    console.log('  Testing 6: WebRTC Offer, Answer, and ICE Candidate signaling between peers...');
    
    // 6a: Bob (initiator) sends Offer to Alice
    const aliceSignalPromise = new Promise((resolve) => {
      aliceSocket.once('call:signal', (data) => resolve(data));
    });

    bobSocket.emit('call:signal', {
      roomId: testRoom.roomId,
      targetSocketId: aliceSocket.id,
      signal: {
        type: 'offer',
        sdp: 'v=0\r\no=bob 12345 2 IN IP4 127.0.0.1\r\ns=test-offer',
      },
    });

    const offerSignalReceived = await aliceSignalPromise;
    assert.strictEqual(offerSignalReceived.fromSocketId, bobSocket.id);
    assert.strictEqual(offerSignalReceived.fromUser.name, 'Bob Peer');
    assert.strictEqual(offerSignalReceived.signal.type, 'offer');
    assert(offerSignalReceived.signal.sdp.includes('test-offer'));

    // 6b: Alice replies with Answer to Bob
    const bobSignalPromise = new Promise((resolve) => {
      bobSocket.once('call:signal', (data) => resolve(data));
    });

    aliceSocket.emit('call:signal', {
      roomId: testRoom.roomId,
      targetSocketId: bobSocket.id,
      signal: {
        type: 'answer',
        sdp: 'v=0\r\no=alice 67890 2 IN IP4 127.0.0.1\r\ns=test-answer',
      },
    });

    const answerSignalReceived = await bobSignalPromise;
    assert.strictEqual(answerSignalReceived.fromSocketId, aliceSocket.id);
    assert.strictEqual(answerSignalReceived.signal.type, 'answer');
    assert(answerSignalReceived.signal.sdp.includes('test-answer'));

    // 6c: Alice sends ICE candidate to Bob
    const bobIcePromise = new Promise((resolve) => {
      bobSocket.once('call:signal', (data) => resolve(data));
    });

    aliceSocket.emit('call:signal', {
      roomId: testRoom.roomId,
      targetSocketId: bobSocket.id,
      signal: {
        type: 'ice-candidate',
        candidate: {
          candidate: 'candidate:1 1 UDP 2130706431 127.0.0.1 50000 typ host',
          sdpMid: '0',
          sdpMLineIndex: 0,
        },
      },
    });

    const iceSignalReceived = await bobIcePromise;
    assert.strictEqual(iceSignalReceived.signal.type, 'ice-candidate');
    assert(iceSignalReceived.signal.candidate.candidate.includes('typ host'));
    console.log('  ✅ 6. P2P Offer, Answer, and ICE Candidate signaling verified');

    // -------------------------------------------------------------------------
    // Test 7: Media state toggle (Mute / Unmute, Camera On / Off)
    // -------------------------------------------------------------------------
    console.log('  Testing 7: Media state toggles synchronized across peers...');
    const bobMediaTogglePromise = new Promise((resolve) => {
      bobSocket.once('call:peer-media-toggle', (data) => resolve(data));
    });

    aliceSocket.emit('call:media-toggle', {
      roomId: testRoom.roomId,
      audio: false,
      video: true,
    });

    const mediaToggleEvent = await bobMediaTogglePromise;
    assert.strictEqual(mediaToggleEvent.peerId, aliceSocket.id);
    assert.strictEqual(mediaToggleEvent.audio, false);
    assert.strictEqual(mediaToggleEvent.video, true);
    console.log('  ✅ 7. Audio mute and video toggle synchronized');

    // -------------------------------------------------------------------------
    // Test 8: Cross-room signaling isolation
    // -------------------------------------------------------------------------
    console.log('  Testing 8: Cross-room signaling is strictly blocked...');
    const charlieSocket = ClientIO(serverUrl, {
      transports: ['websocket'],
      auth: { token: charlieToken },
    });
    await new Promise((resolve) => charlieSocket.on('connect', resolve));
    charlieSocket.emit('room:join', { roomId: otherRoom.roomId });
    await new Promise((resolve) => charlieSocket.once('room:ready', resolve));
    charlieSocket.emit('call:join', { roomId: otherRoom.roomId, mediaState: {} });
    await new Promise((resolve) => charlieSocket.once('call:active-peers', resolve));

    let charlieReceivedLeak = false;
    charlieSocket.on('call:signal', () => {
      charlieReceivedLeak = true;
    });

    // Alice attempts to target Charlie in other room
    aliceSocket.emit('call:signal', {
      roomId: testRoom.roomId,
      targetSocketId: charlieSocket.id,
      signal: { type: 'offer', sdp: 'malicious-cross-room-offer' },
    });

    await wait(100);
    assert.strictEqual(charlieReceivedLeak, false, 'Charlie must NOT receive signaling from another room');
    console.log('  ✅ 8. Cross-room signaling strictly isolated');

    // -------------------------------------------------------------------------
    // Test 9: Oversized signaling payload (>64KB) is safely rejected
    // -------------------------------------------------------------------------
    console.log('  Testing 9: Oversized signaling payload is discarded...');
    let bobReceivedOversized = false;
    bobSocket.on('call:signal', (data) => {
      if (data.signal?.oversized) bobReceivedOversized = true;
    });

    aliceSocket.emit('call:signal', {
      roomId: testRoom.roomId,
      targetSocketId: bobSocket.id,
      signal: {
        type: 'offer',
        oversized: 'X'.repeat(70000), // > 64KB
      },
    });

    await wait(100);
    assert.strictEqual(bobReceivedOversized, false, 'Oversized signal payload must be dropped');
    console.log('  ✅ 9. Payload size limit enforced (>64KB rejected)');

    // -------------------------------------------------------------------------
    // Test 10: Participant leaves call gracefully without leaving room
    // -------------------------------------------------------------------------
    console.log('  Testing 10: Leaving call notifies peers while preserving room presence...');
    const alicePeerLeftPromise = new Promise((resolve) => {
      aliceSocket.once('call:peer-left', (data) => resolve(data));
    });

    bobSocket.emit('call:leave', { roomId: testRoom.roomId });

    const leftData = await alicePeerLeftPromise;
    assert.strictEqual(leftData.peerId, bobSocket.id);
    assert.strictEqual(leftData.userName, 'Bob Peer');

    // Verify Bob is still connected in room presence
    const presenceInRoom = roomManager.getPresence(testRoom.roomId);
    assert(
      presenceInRoom.some((p) => p.name === 'Bob Peer'),
      'Bob must still be in room presence after leaving video call'
    );
    console.log('  ✅ 10. Call leave cleanly handled without disrupting editor presence');

    // -------------------------------------------------------------------------
    // Test 11: Ended rooms reject call joins
    // -------------------------------------------------------------------------
    console.log('  Testing 11: Ended rooms reject call participation...');
    await Room.updateOne({ roomId: testRoom.roomId }, { status: 'ended' });

    bobSocket.emit('call:join', { roomId: testRoom.roomId });
    const endedCallErr = await new Promise((resolve) => {
      bobSocket.once('call:error', (data) => resolve(data.message));
    });
    assert(
      endedCallErr.includes('ended room'),
      `Expected ended room rejection, got: ${endedCallErr}`
    );
    console.log('  ✅ 11. Ended rooms correctly reject video call joins');

    // Close sockets
    aliceSocket.close();
    bobSocket.close();
    charlieSocket.close();

    console.log('\n🎉 ALL 11 WEBRTC VIDEO SIGNALING TESTS PASSED PERFECTLY!\n');
  } finally {
    await teardown();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Video Signaling Test Failed:', err);
  process.exit(1);
});
