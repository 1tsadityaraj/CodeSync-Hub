import * as Y from 'yjs';
import jwt from 'jsonwebtoken';
import * as cookieModule from 'cookie';
import User from '../models/User.js';
import Room, { SUPPORTED_LANGUAGES } from '../models/Room.js';
import { roomManager } from './roomManager.js';

function parseCookies(header = '') {
  if (!header) return {};
  if (typeof cookieModule.parseCookie === 'function') {
    return cookieModule.parseCookie(header);
  }
  if (typeof cookieModule.parse === 'function') {
    return cookieModule.parse(header);
  }
  return Object.fromEntries(
    header
      .split(';')
      .map((v) => v.trim().split('='))
      .filter((parts) => parts.length === 2)
  );
}

/**
 * Configure and initialize Socket.IO server with authentication and collaborative Yjs events.
 */
export function initSocketServer(io) {
  // ---------------------------------------------------------------------------
  // Socket.IO Authentication Middleware
  // ---------------------------------------------------------------------------
  io.use(async (socket, next) => {
    try {
      let token = null;

      // 1. Check handshake auth token (preferred client-provided bearer token)
      if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }
      // 2. Check Authorization header
      else if (
        socket.handshake.headers.authorization &&
        socket.handshake.headers.authorization.startsWith('Bearer ')
      ) {
        token = socket.handshake.headers.authorization.split(' ')[1];
      }
      // 3. Check HTTP-only cookie
      else if (socket.handshake.headers.cookie) {
        const parsedCookies = parseCookies(socket.handshake.headers.cookie);
        if (parsedCookies.token) {
          token = parsedCookies.token;
        }
      }

      if (!token) {
        return next(new Error('Authentication required. Missing token.'));
      }

      const secret = process.env.JWT_SECRET || 'dev_secret_change_in_production_32char';
      const decoded = jwt.verify(token, secret);

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication failed. User no longer exists.'));
      }

      // Attach authenticated user to socket
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication failed. Invalid or expired token.'));
    }
  });

  // ---------------------------------------------------------------------------
  // Connection Handler
  // ---------------------------------------------------------------------------
  io.on('connection', (socket) => {
    // ── 1. Room Join & Handshake ─────────────────────────────
    socket.on('room:join', async ({ roomId }) => {
      try {
        if (!roomId || typeof roomId !== 'string') {
          return socket.emit('room:error', { message: 'Valid Room ID is required' });
        }

        const cleanRoomId = roomId.trim();

        // Verify room in MongoDB
        const dbRoom = await Room.findOne({ roomId: cleanRoomId })
          .populate('creator', 'name email')
          .populate('participants.user', 'name email');

        if (!dbRoom) {
          return socket.emit('room:error', {
            code: 'ROOM_NOT_FOUND',
            message: `Room '${cleanRoomId}' not found. Please check your room link.`,
          });
        }

        if (dbRoom.status === 'ended') {
          return socket.emit('room:error', {
            code: 'ROOM_ENDED',
            message: 'This interview session has ended and is read-only.',
            room: dbRoom.toSafeObject(socket.user._id),
          });
        }

        // Ensure user is in room's participant membership list
        if (!dbRoom.hasParticipant(socket.user._id)) {
          dbRoom.participants.push({
            user: socket.user._id,
            role: dbRoom.isCreator(socket.user._id) ? 'creator' : 'participant',
            joinedAt: new Date(),
          });
          await dbRoom.save();
        }

        // Leave any previous room
        if (socket.currentRoomId && socket.currentRoomId !== cleanRoomId) {
          socket.leave(socket.currentRoomId);
          const oldPresence = roomManager.removeParticipant(socket.currentRoomId, socket.id);
          io.to(socket.currentRoomId).emit('room:presence', { participants: oldPresence });
        }

        socket.currentRoomId = cleanRoomId;
        socket.join(cleanRoomId);

        // Get or initialize in-memory Yjs document
        const roomState = await roomManager.getOrCreateRoom(cleanRoomId, dbRoom.code);

        // Add to active presence
        const presence = roomManager.addParticipant(
          cleanRoomId,
          socket.id,
          socket.user,
          dbRoom.isCreator(socket.user._id) ? 'creator' : 'participant'
        );

        // Broadcast updated presence to all sockets in this room
        io.to(cleanRoomId).emit('room:presence', { participants: presence });

        // Send full initial state update to the newly joined client
        const fullDocUpdate = Y.encodeStateAsUpdate(roomState.doc);
        socket.emit('yjs:initial-state', {
          update: Array.from(fullDocUpdate),
          language: dbRoom.language,
          title: dbRoom.title,
          isOwner: dbRoom.isCreator(socket.user._id),
        });

        // Notify client of successful room join
        socket.emit('room:ready', {
          room: dbRoom.toSafeObject(socket.user._id),
          participants: presence,
        });
      } catch (err) {
        console.error('Error on room:join:', err.message);
        socket.emit('room:error', { message: 'Failed to join interview room' });
      }
    });

    // ── 2. Yjs State Vector Synchronization (Sync step 1 & 2) ─
    socket.on('yjs:sync-step-1', async ({ roomId, stateVector }) => {
      try {
        if (!socket.currentRoomId || socket.currentRoomId !== roomId) return;

        const roomState = await roomManager.getOrCreateRoom(roomId);
        const sv = stateVector ? new Uint8Array(stateVector) : new Uint8Array();
        const missingUpdates = Y.encodeStateAsUpdate(roomState.doc, sv);

        socket.emit('yjs:sync-step-2', {
          update: Array.from(missingUpdates),
        });
      } catch (err) {
        console.error('Error on yjs:sync-step-1:', err.message);
      }
    });

    // ── 3. Real-Time Collaborative Yjs Updates ───────────────
    socket.on('yjs:update', async ({ roomId, update }) => {
      try {
        if (!socket.currentRoomId || socket.currentRoomId !== roomId) {
          return;
        }

        if (!update || !Array.isArray(update)) {
          return;
        }

        // Limit payload size to 256KB per update to prevent denial-of-service
        if (update.length > 256 * 1024) {
          return socket.emit('room:error', { message: 'Payload size exceeded' });
        }

        const roomState = await roomManager.getOrCreateRoom(roomId);
        const uint8Update = new Uint8Array(update);

        // Apply update to server Yjs document
        Y.applyUpdate(roomState.doc, uint8Update, socket.id);

        // Broadcast to ALL OTHER clients in the room (prevent update echo loop!)
        socket.to(roomId).emit('yjs:update', {
          update: Array.from(uint8Update),
        });

        // Schedule debounced snapshot persistence to MongoDB
        roomManager.scheduleSave(roomId, io);
      } catch (err) {
        console.error('Error on yjs:update:', err.message);
      }
    });

    // ── 4. Synchronize Programming Language ──────────────────
    socket.on('room:language-change', async ({ roomId, language }) => {
      try {
        if (!socket.currentRoomId || socket.currentRoomId !== roomId) return;

        const cleanLang = (language || '').toLowerCase().trim();
        if (!SUPPORTED_LANGUAGES.includes(cleanLang)) {
          return socket.emit('room:error', { message: `Language '${cleanLang}' is not supported.` });
        }

        // Persist in MongoDB
        await Room.findOneAndUpdate({ roomId }, { language: cleanLang });

        // Broadcast to all participants in room (including sender to confirm)
        io.to(roomId).emit('room:language-change', { language: cleanLang });
      } catch (err) {
        console.error('Error on room:language-change:', err.message);
      }
    });

    // ── 5. Room Leave ─────────────────────────────────────────
    socket.on('room:leave', ({ roomId }) => {
      if (socket.currentRoomId === roomId) {
        socket.leave(roomId);
        const presence = roomManager.removeParticipant(roomId, socket.id);
        io.to(roomId).emit('room:presence', { participants: presence });
        socket.currentRoomId = null;
      }
    });

    // ── 6. Disconnect Handler ─────────────────────────────────
    socket.on('disconnect', () => {
      if (socket.currentRoomId) {
        const presence = roomManager.removeParticipant(socket.currentRoomId, socket.id);
        io.to(socket.currentRoomId).emit('room:presence', { participants: presence });
      }
    });
  });
}
