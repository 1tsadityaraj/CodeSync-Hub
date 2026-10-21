import assert from 'assert';
import http from 'http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { io as ClientIO } from 'socket.io-client';
import * as Y from 'yjs';
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
  console.log('🧪 Starting CodeSync Hub Real-Time Collaboration & Yjs Test Suite...');

  await setup();
  console.log(`  ✅ Test HTTP & Socket.IO server running on port ${port}`);

  // Create Users
  const alice = await User.create({
    name: 'Alice Host',
    email: 'alice@codesync.dev',
    password: 'Password123!',
  });
  const aliceToken = createToken(alice._id, alice.email);

  const bob = await User.create({
    name: 'Bob Candidate',
    email: 'bob@codesync.dev',
    password: 'Password123!',
  });
  const bobToken = createToken(bob._id, bob.email);

  // Alice creates a room
  const room = await Room.create({
    roomId: 'collab-test-room',
    title: 'Real-Time Pair Programming Session',
    creator: alice._id,
    language: 'javascript',
    code: '// Welcome to CodeSync Hub\n',
    participants: [
      { user: alice._id, role: 'creator', joinedAt: new Date() },
    ],
  });

  // 1. Unauthenticated socket connection should be rejected
  console.log('  Testing 1: Unauthenticated socket connection is rejected...');
  await new Promise((resolve, reject) => {
    const unauthSocket = ClientIO(serverUrl, {
      transports: ['websocket'],
      auth: {},
    });
    unauthSocket.on('connect_error', (err) => {
      assert(err.message.includes('Authentication required') || err.message.includes('Missing token'));
      unauthSocket.disconnect();
      console.log('  ✅ 1. Unauthenticated socket connection correctly rejected');
      resolve();
    });
    unauthSocket.on('connect', () => {
      unauthSocket.disconnect();
      reject(new Error('Unauthenticated socket should NOT connect'));
    });
  });

  // 2. Authenticated connection for Alice and Bob
  console.log('  Testing 2: Authenticated socket connections for Alice and Bob...');
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
  console.log('  ✅ 2. Alice and Bob connected successfully with JWT auth');

  // 3. Alice joins room and receives initial state from DB
  console.log('  Testing 3: Alice joins room and receives room:ready and yjs:initial-state...');
  const aliceDoc = new Y.Doc();
  let aliceReadyReceived = false;
  let aliceInitialReceived = false;

  await new Promise((resolve) => {
    aliceSocket.on('room:ready', (data) => {
      assert.strictEqual(data.room.roomId, room.roomId);
      aliceReadyReceived = true;
      if (aliceInitialReceived) resolve();
    });

    aliceSocket.on('yjs:initial-state', ({ update, language, title }) => {
      assert.strictEqual(language, 'javascript');
      assert.strictEqual(title, 'Real-Time Pair Programming Session');
      Y.applyUpdate(aliceDoc, new Uint8Array(update), 'server');
      assert(aliceDoc.getText('monaco').toString().includes('// Welcome to CodeSync Hub'));
      aliceInitialReceived = true;
      if (aliceReadyReceived) resolve();
    });

    aliceSocket.emit('room:join', { roomId: room.roomId });
  });
  console.log('  ✅ 3. Alice joined room and hydrated Yjs document with persisted DB code');

  // 4. Bob joins room and presence is updated for both
  console.log('  Testing 4: Bob joins room; both receive updated presence roster...');
  const bobDoc = new Y.Doc();
  let bobReceivedPresence = false;
  let aliceReceivedBobPresence = false;

  await new Promise((resolve) => {
    aliceSocket.on('room:presence', ({ participants }) => {
      if (participants.some((p) => p.name === 'Bob Candidate')) {
        aliceReceivedBobPresence = true;
        if (bobReceivedPresence) resolve();
      }
    });

    bobSocket.on('room:presence', ({ participants }) => {
      if (participants.length === 2) {
        bobReceivedPresence = true;
        if (aliceReceivedBobPresence) resolve();
      }
    });

    bobSocket.on('yjs:initial-state', ({ update }) => {
      Y.applyUpdate(bobDoc, new Uint8Array(update), 'server');
    });

    bobSocket.emit('room:join', { roomId: room.roomId });
  });

  assert.strictEqual(bobDoc.getText('monaco').toString(), aliceDoc.getText('monaco').toString());
  console.log('  ✅ 4. Bob joined; presence shows 2 active participants and documents match');

  // 5. Real-Time Collaborative Editing via Yjs updates
  console.log('  Testing 5: Real-time conflict-free collaborative editing between Alice and Bob...');

  // Setup client update listeners
  aliceDoc.on('update', (update, origin) => {
    if (origin === 'server') return;
    aliceSocket.emit('yjs:update', { roomId: room.roomId, update: Array.from(update) });
  });

  bobDoc.on('update', (update, origin) => {
    if (origin === 'server') return;
    bobSocket.emit('yjs:update', { roomId: room.roomId, update: Array.from(update) });
  });

  aliceSocket.on('yjs:update', ({ update }) => {
    Y.applyUpdate(aliceDoc, new Uint8Array(update), 'server');
  });

  bobSocket.on('yjs:update', ({ update }) => {
    Y.applyUpdate(bobDoc, new Uint8Array(update), 'server');
  });

  // Alice inserts text
  aliceDoc.transact(() => {
    aliceDoc.getText('monaco').insert(aliceDoc.getText('monaco').length, 'function solution() {\n  return 42;\n}\n');
  });

  // Wait for propagation
  await wait(100);
  assert.strictEqual(bobDoc.getText('monaco').toString(), aliceDoc.getText('monaco').toString());

  // Concurrent edits: Alice inserts at start, Bob inserts at end simultaneously
  aliceDoc.transact(() => {
    aliceDoc.getText('monaco').insert(0, '// Author: Alice & Bob\n');
  });
  bobDoc.transact(() => {
    bobDoc.getText('monaco').insert(bobDoc.getText('monaco').length, '// End of file\n');
  });

  // Wait for propagation
  await wait(150);
  assert.strictEqual(aliceDoc.getText('monaco').toString(), bobDoc.getText('monaco').toString());
  const finalEditorText = aliceDoc.getText('monaco').toString();
  assert(finalEditorText.startsWith('// Author: Alice & Bob\n'));
  assert(finalEditorText.includes('function solution()'));
  assert(finalEditorText.endsWith('// End of file\n'));
  console.log('  ✅ 5. Concurrent edits merged without conflicts; documents are bit-for-bit identical');

  // 6. Language Synchronization
  console.log('  Testing 6: Language synchronization across clients...');
  await new Promise((resolve) => {
    bobSocket.on('room:language-change', ({ language }) => {
      assert.strictEqual(language, 'python');
      resolve();
    });
    aliceSocket.emit('room:language-change', { roomId: room.roomId, language: 'python' });
  });

  const updatedRoom = await Room.findOne({ roomId: room.roomId });
  assert.strictEqual(updatedRoom.language, 'python');
  console.log('  ✅ 6. Language changed to Python and synchronized to both clients and MongoDB');

  // 7. Debounced Autosave Snapshot Persistence
  console.log('  Testing 7: Code snapshot persistence in MongoDB...');
  // Force a flush to test persistence
  await roomManager.flush(room.roomId);
  const roomInDb = await Room.findOne({ roomId: room.roomId });
  assert.strictEqual(roomInDb.code, finalEditorText);
  console.log('  ✅ 7. Yjs code buffer successfully persisted directly to MongoDB');

  // 8. Disconnect and Presence Cleanup
  console.log('  Testing 8: Bob disconnects; Alice receives updated presence with Bob removed...');
  await new Promise((resolve) => {
    aliceSocket.on('room:presence', ({ participants }) => {
      if (participants.length === 1 && participants[0].name === 'Alice Host') {
        resolve();
      }
    });
    bobSocket.disconnect();
  });
  console.log('  ✅ 8. Bob disconnect detected; presence cleanly updated for remaining users');

  aliceSocket.disconnect();
  await teardown();
  console.log('\n🎉 ALL 8 REAL-TIME COLLABORATION TESTS PASSED PERFECTLY!\n');
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
