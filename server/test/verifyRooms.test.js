import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/app.js';

process.env.JWT_SECRET = 'test_room_secret_key_1234567890_abcdef';
process.env.NODE_ENV = 'test';

async function runRoomVerification() {
  console.log('🧪 Starting CodeSync Hub Room API Test Suite...');
  let mongod;
  let server;
  const testPort = 5098;

  try {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    console.log('  ✅ In-Memory MongoDB connected');

    await new Promise((resolve) => {
      server = app.listen(testPort, resolve);
    });
    const baseUrl = `http://localhost:${testPort}`;
    const jsonHeaders = { 'Content-Type': 'application/json' };

    // ── Setup: Register 2 users (Alice & Bob) ────────────────
    let aliceToken = '';
    let bobToken = '';

    {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          name: 'Alice Creator',
          email: 'alice@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        }),
      });
      const data = await res.json();
      aliceToken = data.token;
    }

    {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          name: 'Bob Participant',
          email: 'bob@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        }),
      });
      const data = await res.json();
      bobToken = data.token;
    }
    console.log('  ✅ Users Alice (Host) and Bob (Candidate) registered');

    // ── Test 1: Unauthenticated request rejected ─────────────
    {
      const res = await fetch(`${baseUrl}/api/rooms`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ title: 'Algorithmic Interview' }),
      });
      if (res.status !== 401) {
        throw new Error(`Unauthenticated request was not rejected with 401: status=${res.status}`);
      }
      console.log('  ✅ 1. Unauthenticated room creation rejected (401)');
    }

    // ── Test 2: Alice creates a room ─────────────────────────
    let createdRoomId = '';
    {
      const res = await fetch(`${baseUrl}/api/rooms`, {
        method: 'POST',
        headers: {
          ...jsonHeaders,
          Authorization: `Bearer ${aliceToken}`,
        },
        body: JSON.stringify({
          title: 'Senior Systems Design Interview',
          language: 'python',
        }),
      });
      const data = await res.json();
      if (res.status !== 201 || !data.success || !data.room) {
        throw new Error(`Failed to create room: ${JSON.stringify(data)}`);
      }

      createdRoomId = data.room.roomId;
      if (!createdRoomId.startsWith('cs-')) {
        throw new Error(`Room ID format incorrect: ${createdRoomId}`);
      }
      if (data.room.language !== 'python') {
        throw new Error(`Expected language python, got: ${data.room.language}`);
      }
      if (data.room.creator.email !== 'alice@example.com') {
        throw new Error(`Creator mismatch: ${JSON.stringify(data.room.creator)}`);
      }
      if (data.room.participants.length !== 1 || data.room.participants[0].role !== 'creator') {
        throw new Error(`Participants not initialized properly: ${JSON.stringify(data.room.participants)}`);
      }
      console.log(`  ✅ 2. Room created successfully with unique ID (${createdRoomId}) & creator as first participant`);
    }

    // ── Test 3: Reject unsupported language ──────────────────
    {
      const res = await fetch(`${baseUrl}/api/rooms`, {
        method: 'POST',
        headers: {
          ...jsonHeaders,
          Authorization: `Bearer ${aliceToken}`,
        },
        body: JSON.stringify({
          title: 'Test Room',
          language: 'unsupported_lang_xyz',
        }),
      });
      const data = await res.json();
      if (res.status !== 400 || !data.message.includes('not supported')) {
        throw new Error(`Unsupported language was not rejected: ${JSON.stringify(data)}`);
      }
      console.log('  ✅ 3. Unsupported language rejected with 400');
    }

    // ── Test 4: Alice views her rooms list (GET /api/rooms) ──
    {
      const res = await fetch(`${baseUrl}/api/rooms`, {
        headers: {
          Authorization: `Bearer ${aliceToken}`,
        },
      });
      const data = await res.json();
      if (res.status !== 200 || data.rooms.length !== 1) {
        throw new Error(`Failed to retrieve Alice rooms: ${JSON.stringify(data)}`);
      }
      if (data.rooms[0].roomId !== createdRoomId) {
        throw new Error(`Room list did not match created room`);
      }
      console.log('  ✅ 4. GET /api/rooms returned list of user rooms');
    }

    // ── Test 5: Get room by ID (GET /api/rooms/:roomId) ───────
    {
      const res = await fetch(`${baseUrl}/api/rooms/${createdRoomId}`, {
        headers: {
          Authorization: `Bearer ${aliceToken}`,
        },
      });
      const data = await res.json();
      if (res.status !== 200 || data.room.roomId !== createdRoomId) {
        throw new Error(`Failed to fetch room by ID: ${JSON.stringify(data)}`);
      }
      console.log('  ✅ 5. GET /api/rooms/:roomId returned full safe room details');
    }

    // ── Test 6: Invalid room ID returns 404 ──────────────────
    {
      const res = await fetch(`${baseUrl}/api/rooms/cs-nonexistent-999`, {
        headers: {
          Authorization: `Bearer ${bobToken}`,
        },
      });
      const data = await res.json();
      if (res.status !== 404) {
        throw new Error(`Expected 404 for non-existent room, got: ${res.status}`);
      }
      console.log('  ✅ 6. Non-existent room ID properly rejected with 404');
    }

    // ── Test 7: Bob joins the room (POST /api/rooms/:roomId/join) ──
    {
      const res = await fetch(`${baseUrl}/api/rooms/${createdRoomId}/join`, {
        method: 'POST',
        headers: {
          ...jsonHeaders,
          Authorization: `Bearer ${bobToken}`,
        },
      });
      const data = await res.json();
      if (res.status !== 200 || !data.success) {
        throw new Error(`Bob failed to join room: ${JSON.stringify(data)}`);
      }
      if (data.room.participantCount !== 2) {
        throw new Error(`Expected 2 participants, got: ${data.room.participantCount}`);
      }
      const hasBob = data.room.participants.some((p) => p.email === 'bob@example.com');
      if (!hasBob) {
        throw new Error(`Bob not found in participants: ${JSON.stringify(data.room.participants)}`);
      }
      console.log('  ✅ 7. Bob joined room as participant; participant count updated to 2');
    }

    // ── Test 8: Duplicate join is idempotent (no duplicates) ─
    {
      const res = await fetch(`${baseUrl}/api/rooms/${createdRoomId}/join`, {
        method: 'POST',
        headers: {
          ...jsonHeaders,
          Authorization: `Bearer ${bobToken}`,
        },
      });
      const data = await res.json();
      if (res.status !== 200 || data.room.participantCount !== 2) {
        throw new Error(`Duplicate join created multiple entries: ${data.room.participantCount}`);
      }
      console.log('  ✅ 8. Duplicate join is idempotent; prevented multiple participant records');
    }

    // ── Test 9: Bob cannot end Alice's room (403 Forbidden) ──
    {
      const res = await fetch(`${baseUrl}/api/rooms/${createdRoomId}/end`, {
        method: 'POST',
        headers: {
          ...jsonHeaders,
          Authorization: `Bearer ${bobToken}`,
        },
      });
      const data = await res.json();
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden when non-creator ends room, got: ${res.status}`);
      }
      console.log('  ✅ 9. Non-creator cannot end room (403 Forbidden enforced)');
    }

    // ── Test 10: Alice (creator) ends the room ───────────────
    {
      const res = await fetch(`${baseUrl}/api/rooms/${createdRoomId}/end`, {
        method: 'POST',
        headers: {
          ...jsonHeaders,
          Authorization: `Bearer ${aliceToken}`,
        },
      });
      const data = await res.json();
      if (res.status !== 200 || data.room.status !== 'ended') {
        throw new Error(`Creator failed to end room: ${JSON.stringify(data)}`);
      }
      console.log('  ✅ 10. Room creator successfully ended the room (status = ended)');
    }

    // ── Test 11: Attempt to join ended room is rejected ──────
    {
      // Register Charlie
      const charlieRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          name: 'Charlie Candidate',
          email: 'charlie@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        }),
      });
      const { token: charlieToken } = await charlieRes.json();

      const res = await fetch(`${baseUrl}/api/rooms/${createdRoomId}/join`, {
        method: 'POST',
        headers: {
          ...jsonHeaders,
          Authorization: `Bearer ${charlieToken}`,
        },
      });
      const data = await res.json();
      if (res.status !== 400 || !data.message.includes('ended')) {
        throw new Error(`Expected 400 rejection joining ended room, got: ${JSON.stringify(data)}`);
      }
      console.log('  ✅ 11. Joining an ended room is properly rejected (400)');
    }

    console.log('\n🎉 ALL 11 ROOM BACKEND API TESTS PASSED PERFECTLY!\n');
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  }
}

runRoomVerification().catch((err) => {
  console.error('\n❌ Room API Verification Failed:', err);
  process.exit(1);
});
