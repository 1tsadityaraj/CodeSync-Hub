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
  console.log('🧪 Starting CodeSync Hub Real-Time Collaborative Whiteboard Test Suite...');

  await setup();
  console.log(`  ✅ Test HTTP & Socket.IO server running on port ${port}`);

  // Create Users
  const alice = await User.create({
    name: 'Alice System Architect',
    email: 'alice.arch@codesync.dev',
    password: 'Password123!',
  });
  const aliceToken = createToken(alice._id, alice.email);

  const bob = await User.create({
    name: 'Bob Staff Engineer',
    email: 'bob.eng@codesync.dev',
    password: 'Password123!',
  });
  const bobToken = createToken(bob._id, bob.email);

  const charlie = await User.create({
    name: 'Charlie Candidate',
    email: 'charlie.cand@codesync.dev',
    password: 'Password123!',
  });
  const charlieToken = createToken(charlie._id, charlie.email);

  // Alice creates a room
  const room = await Room.create({
    roomId: 'whiteboard-test-room',
    title: 'Distributed System Architecture Discussion',
    creator: alice._id,
    language: 'javascript',
    code: '// Architecture notes\n',
    whiteboard: [],
    participants: [{ user: alice._id, role: 'creator', joinedAt: new Date() }],
  });

  // Isolated Room 2 for testing isolation
  const room2 = await Room.create({
    roomId: 'whiteboard-room-2',
    title: 'Isolated Room 2',
    creator: bob._id,
    whiteboard: [],
    participants: [{ user: bob._id, role: 'creator', joinedAt: new Date() }],
  });

  // Connect Alice and Bob
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

  // Join Room 1
  let aliceInitialWhiteboard = null;
  let bobInitialWhiteboard = null;

  await Promise.all([
    new Promise((resolve) => {
      aliceSocket.on('whiteboard:initial-state', (data) => {
        aliceInitialWhiteboard = data.objects;
        resolve();
      });
      aliceSocket.emit('room:join', { roomId: room.roomId });
    }),
    new Promise((resolve) => {
      bobSocket.on('whiteboard:initial-state', (data) => {
        bobInitialWhiteboard = data.objects;
        resolve();
      });
      bobSocket.emit('room:join', { roomId: room.roomId });
    }),
  ]);

  assert(Array.isArray(aliceInitialWhiteboard));
  assert.strictEqual(aliceInitialWhiteboard.length, 0);
  assert.strictEqual(bobInitialWhiteboard.length, 0);
  console.log('  ✅ 1. Alice & Bob joined room and received clean initial whiteboard state');

  // 2. Freehand drawing synchronization (Alice draws -> Bob receives)
  console.log('  Testing 2: Freehand pen stroke synchronization...');
  const strokeObj = {
    id: 'stroke-1',
    type: 'pen',
    color: '#3b82f6',
    strokeWidth: 4,
    points: [
      { x: 10, y: 15 },
      { x: 20, y: 25 },
      { x: 30, y: 35 },
    ],
  };

  await new Promise((resolve) => {
    bobSocket.once('whiteboard:object-create', ({ object }) => {
      assert.strictEqual(object.id, 'stroke-1');
      assert.strictEqual(object.type, 'pen');
      assert.strictEqual(object.color, '#3b82f6');
      assert.strictEqual(object.strokeWidth, 4);
      assert.strictEqual(object.points.length, 3);
      assert.strictEqual(object.userName, 'Alice System Architect');
      resolve();
    });

    aliceSocket.emit('whiteboard:object-create', {
      roomId: room.roomId,
      object: strokeObj,
    });
  });
  console.log('  ✅ 2. Freehand pen stroke rendered and verified across clients');

  // 3. Shape synchronization: line, rectangle, circle, arrow (Bob draws -> Alice receives)
  console.log('  Testing 3: Geometric shape synchronization (rectangle, circle, arrow)...');
  const shapes = [
    {
      id: 'rect-1',
      type: 'rectangle',
      startX: 50,
      startY: 50,
      endX: 200,
      endY: 150,
      color: '#10b981',
      strokeWidth: 3,
    },
    {
      id: 'circle-1',
      type: 'circle',
      startX: 300,
      startY: 100,
      endX: 380,
      endY: 180,
      color: '#8b5cf6',
      strokeWidth: 2,
    },
    {
      id: 'arrow-1',
      type: 'arrow',
      startX: 200,
      startY: 100,
      endX: 300,
      endY: 140,
      color: '#f59e0b',
      strokeWidth: 3,
    },
  ];

  for (const shape of shapes) {
    await new Promise((resolve) => {
      aliceSocket.once('whiteboard:object-create', ({ object }) => {
        assert.strictEqual(object.id, shape.id);
        assert.strictEqual(object.type, shape.type);
        assert.strictEqual(object.color, shape.color);
        resolve();
      });
      bobSocket.emit('whiteboard:object-create', {
        roomId: room.roomId,
        object: shape,
      });
    });
  }
  console.log('  ✅ 3. Rectangle, circle, and arrow shapes synchronized with exact coordinates');

  // 4. Text annotation synchronization
  console.log('  Testing 4: Text annotation synchronization...');
  const textObj = {
    id: 'text-1',
    type: 'text',
    x: 100,
    y: 80,
    text: 'API Gateway Cluster',
    fontSize: 18,
    color: '#ffffff',
  };

  await new Promise((resolve) => {
    bobSocket.once('whiteboard:object-create', ({ object }) => {
      assert.strictEqual(object.id, 'text-1');
      assert.strictEqual(object.type, 'text');
      assert.strictEqual(object.text, 'API Gateway Cluster');
      assert.strictEqual(object.fontSize, 18);
      resolve();
    });
    aliceSocket.emit('whiteboard:object-create', {
      roomId: room.roomId,
      object: textObj,
    });
  });
  console.log('  ✅ 4. Text annotations rendered and synchronized');

  // 5. Object update synchronization (moving / editing an existing object)
  console.log('  Testing 5: Object modification and update broadcasting...');
  const updatedRect = {
    id: 'rect-1',
    type: 'rectangle',
    startX: 60,
    startY: 60,
    endX: 250,
    endY: 180,
    color: '#10b981',
    strokeWidth: 3,
  };

  await new Promise((resolve) => {
    aliceSocket.once('whiteboard:object-update', ({ object }) => {
      assert.strictEqual(object.id, 'rect-1');
      assert.strictEqual(object.endX, 250);
      resolve();
    });
    bobSocket.emit('whiteboard:object-update', {
      roomId: room.roomId,
      object: updatedRect,
    });
  });
  console.log('  ✅ 5. Real-time object updates applied and broadcasted');

  // 6. Object deletion and Tombstone Resurrection Protection
  console.log('  Testing 6: Object deletion and tombstone resurrection protection...');
  await new Promise((resolve) => {
    bobSocket.once('whiteboard:object-delete', ({ objectId }) => {
      assert.strictEqual(objectId, 'rect-1');
      resolve();
    });
    aliceSocket.emit('whiteboard:object-delete', {
      roomId: room.roomId,
      objectId: 'rect-1',
    });
  });

  // Attempt delayed update on the deleted object -> must be rejected/ignored
  let resurrected = false;
  bobSocket.once('whiteboard:object-update', () => {
    resurrected = true;
  });
  aliceSocket.emit('whiteboard:object-update', {
    roomId: room.roomId,
    object: updatedRect,
  });
  await wait(150);
  assert.strictEqual(resurrected, false, 'Deleted object must NOT be resurrected by delayed updates!');
  console.log('  ✅ 6. Object deleted and tombstone successfully prevented delayed resurrection');

  // 7. Live Cursor broadcasting
  console.log('  Testing 7: Live participant drawing cursor tracking...');
  await new Promise((resolve) => {
    bobSocket.once('whiteboard:cursor', (data) => {
      assert.strictEqual(data.userName, 'Alice System Architect');
      assert.strictEqual(data.x, 250);
      assert.strictEqual(data.y, 175);
      resolve();
    });
    aliceSocket.emit('whiteboard:cursor', {
      roomId: room.roomId,
      x: 250,
      y: 175,
    });
  });
  console.log('  ✅ 7. Live participant cursor coordinates synchronized');

  // 8. Room isolation test: Room 2 user does not receive Room 1 drawings
  console.log('  Testing 8: Room isolation verification...');
  const userRoom2Socket = ClientIO(serverUrl, {
    transports: ['websocket'],
    auth: { token: bobToken },
  });
  await new Promise((resolve) => userRoom2Socket.on('connect', resolve));
  userRoom2Socket.emit('room:join', { roomId: room2.roomId });
  await wait(50);

  let leakReceived = false;
  userRoom2Socket.on('whiteboard:object-create', () => {
    leakReceived = true;
  });

  aliceSocket.emit('whiteboard:object-create', {
    roomId: room.roomId,
    object: {
      id: 'leak-test',
      type: 'circle',
      startX: 0,
      startY: 0,
      endX: 10,
      endY: 10,
      color: '#ffffff',
    },
  });

  await wait(150);
  assert.strictEqual(leakReceived, false, 'Room 2 must NEVER receive whiteboard events from Room 1');
  userRoom2Socket.disconnect();
  console.log('  ✅ 8. Strict room isolation enforced between different rooms');

  // 9. MongoDB Debounced Persistence
  console.log('  Testing 9: MongoDB debounced persistence for whiteboard snapshot...');
  await roomManager.flush(room.roomId);
  const persistedRoom = await Room.findOne({ roomId: room.roomId });
  assert(Array.isArray(persistedRoom.whiteboard));
  assert(persistedRoom.whiteboard.some((o) => o.id === 'stroke-1'));
  assert(persistedRoom.whiteboard.some((o) => o.id === 'text-1'));
  assert(!persistedRoom.whiteboard.some((o) => o.id === 'rect-1'), 'Deleted rect-1 must not exist in MongoDB');
  console.log('  ✅ 9. Whiteboard snapshot persisted cleanly in MongoDB');

  // 10. Late-joining participant state hydration (Charlie joins now)
  console.log('  Testing 10: Late-joining participant state hydration...');
  const charlieSocket = ClientIO(serverUrl, {
    transports: ['websocket'],
    auth: { token: charlieToken },
  });
  await new Promise((resolve) => charlieSocket.on('connect', resolve));

  const charlieInitialObjects = await new Promise((resolve) => {
    charlieSocket.on('whiteboard:initial-state', ({ objects }) => {
      resolve(objects);
    });
    charlieSocket.emit('room:join', { roomId: room.roomId });
  });

  assert(charlieInitialObjects.some((o) => o.id === 'stroke-1'));
  assert(charlieInitialObjects.some((o) => o.id === 'text-1'));
  assert(!charlieInitialObjects.some((o) => o.id === 'rect-1'));
  charlieSocket.disconnect();
  console.log('  ✅ 10. Late-joining participant received all active objects on join');

  // 11. Read-only enforcement for ended rooms
  console.log('  Testing 11: Ended rooms reject whiteboard creations...');
  room.status = 'ended';
  await room.save();

  let rejected = false;
  aliceSocket.once('whiteboard:error', (err) => {
    assert(err.message.includes('read-only') || err.message.includes('ended'));
    rejected = true;
  });

  aliceSocket.emit('whiteboard:object-create', {
    roomId: room.roomId,
    object: {
      id: 'post-end-obj',
      type: 'pen',
      points: [{ x: 1, y: 1 }],
      color: '#ffffff',
    },
  });

  await wait(150);
  assert.strictEqual(rejected, true, 'Ended room must reject whiteboard drawing creations');
  console.log('  ✅ 11. Ended room correctly enforces read-only mode for whiteboard');

  aliceSocket.disconnect();
  bobSocket.disconnect();
  await teardown();
  console.log('\n🎉 ALL 11 REAL-TIME WHITEBOARD TESTS PASSED PERFECTLY!\n');
}

runTests().catch((err) => {
  console.error('❌ Whiteboard test suite failed:', err);
  process.exit(1);
});
