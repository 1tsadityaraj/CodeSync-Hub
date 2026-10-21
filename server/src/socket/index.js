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

const VALID_OBJECT_TYPES = ['pen', 'line', 'rectangle', 'circle', 'arrow', 'text'];

/**
 * Validate and sanitize incoming whiteboard drawing objects
 */
function sanitizeWhiteboardObject(rawObj, user) {
  if (!rawObj || typeof rawObj !== 'object') return null;

  const id = typeof rawObj.id === 'string' && rawObj.id.trim() ? rawObj.id.trim().slice(0, 64) : null;
  if (!id) return null;

  const type = VALID_OBJECT_TYPES.includes(rawObj.type) ? rawObj.type : null;
  if (!type) return null;

  // Validate color (hex, rgb, hsl, or css color string)
  let color = typeof rawObj.color === 'string' ? rawObj.color.trim().slice(0, 32) : '#ffffff';
  if (!/^#([0-9a-fA-F]{3,8})$|^rgb\(|^rgba\(|^hsl\(/i.test(color) && !/^[a-zA-Z]+$/.test(color)) {
    color = '#ffffff';
  }

  // Validate stroke width
  const strokeWidth =
    Number.isFinite(rawObj.strokeWidth) && rawObj.strokeWidth > 0 && rawObj.strokeWidth <= 50
      ? Number(rawObj.strokeWidth)
      : 2;

  const sanitized = {
    id,
    type,
    color,
    strokeWidth,
    userId: user._id.toString(),
    userName: user.name,
    createdAt: Number(rawObj.createdAt) || Date.now(),
    updatedAt: Date.now(),
  };

  if (type === 'pen') {
    if (!Array.isArray(rawObj.points) || rawObj.points.length === 0) return null;
    // Cap points array at 5000 points to prevent DoS
    sanitized.points = rawObj.points.slice(0, 5000).map((pt) => ({
      x: Number.isFinite(pt.x) ? Math.round(pt.x * 100) / 100 : 0,
      y: Number.isFinite(pt.y) ? Math.round(pt.y * 100) / 100 : 0,
    }));
  } else if (['line', 'rectangle', 'circle', 'arrow'].includes(type)) {
    sanitized.startX = Number.isFinite(rawObj.startX) ? Math.round(rawObj.startX * 100) / 100 : 0;
    sanitized.startY = Number.isFinite(rawObj.startY) ? Math.round(rawObj.startY * 100) / 100 : 0;
    sanitized.endX = Number.isFinite(rawObj.endX) ? Math.round(rawObj.endX * 100) / 100 : 0;
    sanitized.endY = Number.isFinite(rawObj.endY) ? Math.round(rawObj.endY * 100) / 100 : 0;
  } else if (type === 'text') {
    sanitized.x = Number.isFinite(rawObj.x) ? Math.round(rawObj.x * 100) / 100 : 0;
    sanitized.y = Number.isFinite(rawObj.y) ? Math.round(rawObj.y * 100) / 100 : 0;
    sanitized.text = typeof rawObj.text === 'string' ? rawObj.text.slice(0, 500) : '';
    sanitized.fontSize =
      Number.isFinite(rawObj.fontSize) && rawObj.fontSize >= 8 && rawObj.fontSize <= 96
        ? Number(rawObj.fontSize)
        : 16;
  }

  return sanitized;
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

        // Send initial whiteboard state to newly joined client
        const initialWhiteboard = roomManager.getWhiteboardObjects(cleanRoomId);
        socket.emit('whiteboard:initial-state', {
          objects: initialWhiteboard,
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

    // ── 5. Real-Time Collaborative Whiteboard ────────────────
    const handleWhiteboardCreate = async ({ roomId, object }) => {
      try {
        if (!socket.currentRoomId || socket.currentRoomId !== roomId) return;

        const dbRoom = await Room.findOne({ roomId }).select('status');
        if (!dbRoom) return;

        if (dbRoom.status === 'ended') {
          return socket.emit('whiteboard:error', {
            message: 'This session has ended. Whiteboard is in read-only mode.',
          });
        }

        const sanitized = sanitizeWhiteboardObject(object, socket.user);
        if (!sanitized) return;

        const added = roomManager.addOrUpdateWhiteboardObject(roomId, sanitized);
        if (added) {
          // Broadcast to all OTHER clients in the room (prevent echo)
          socket.to(roomId).emit('whiteboard:object-create', { object: sanitized });
          roomManager.scheduleWhiteboardSave(roomId, io);
        }
      } catch (err) {
        console.error('Error on whiteboard:object-create:', err.message);
      }
    };

    socket.on('whiteboard:object-create', handleWhiteboardCreate);
    socket.on('whiteboard:draw', handleWhiteboardCreate);

    socket.on('whiteboard:object-update', async ({ roomId, object }) => {
      try {
        if (!socket.currentRoomId || socket.currentRoomId !== roomId) return;

        const dbRoom = await Room.findOne({ roomId }).select('status');
        if (!dbRoom || dbRoom.status === 'ended') return;

        const sanitized = sanitizeWhiteboardObject(object, socket.user);
        if (!sanitized) return;

        const updated = roomManager.addOrUpdateWhiteboardObject(roomId, sanitized);
        if (updated) {
          socket.to(roomId).emit('whiteboard:object-update', { object: sanitized });
          roomManager.scheduleWhiteboardSave(roomId, io);
        }
      } catch (err) {
        console.error('Error on whiteboard:object-update:', err.message);
      }
    });

    socket.on('whiteboard:object-delete', async ({ roomId, objectId }) => {
      try {
        if (!socket.currentRoomId || socket.currentRoomId !== roomId) return;
        if (!objectId || typeof objectId !== 'string') return;

        const dbRoom = await Room.findOne({ roomId }).select('status');
        if (!dbRoom || dbRoom.status === 'ended') return;

        roomManager.deleteWhiteboardObject(roomId, objectId);
        socket.to(roomId).emit('whiteboard:object-delete', { objectId });
        roomManager.scheduleWhiteboardSave(roomId, io);
      } catch (err) {
        console.error('Error on whiteboard:object-delete:', err.message);
      }
    });

    socket.on('whiteboard:clear', async ({ roomId }) => {
      try {
        if (!socket.currentRoomId || socket.currentRoomId !== roomId) return;

        const dbRoom = await Room.findOne({ roomId }).select('status');
        if (!dbRoom || dbRoom.status === 'ended') return;

        roomManager.clearWhiteboard(roomId);
        socket.to(roomId).emit('whiteboard:clear', { clearedBy: socket.user.name });
        roomManager.scheduleWhiteboardSave(roomId, io);
      } catch (err) {
        console.error('Error on whiteboard:clear:', err.message);
      }
    });

    socket.on('whiteboard:cursor', ({ roomId, x, y }) => {
      if (!socket.currentRoomId || socket.currentRoomId !== roomId) return;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;

      socket.to(roomId).emit('whiteboard:cursor', {
        userId: socket.user._id.toString(),
        userName: socket.user.name,
        x,
        y,
      });
    });

    // ── 6. WebRTC Audio & Video Signaling ────────────────────
    /**
     * User joins active call in the current room
     */
    socket.on('call:join', async ({ roomId, mediaState = {} }) => {
      try {
        if (!socket.currentRoomId || socket.currentRoomId !== roomId) {
          return socket.emit('call:error', { message: 'Must join room before joining call' });
        }

        const dbRoom = await Room.findOne({ roomId }).select('status participants');
        if (!dbRoom || dbRoom.status === 'ended') {
          return socket.emit('call:error', { message: 'Cannot join call in ended room' });
        }

        const audio = mediaState?.audio !== false;
        const video = mediaState?.video !== false;

        // Add to call participants
        const newCallParticipant = roomManager.addCallParticipant(
          roomId,
          socket.id,
          socket.user,
          { audio, video }
        );

        // Get existing peers in the call (excluding current user)
        const allCallPeers = roomManager.getCallParticipants(roomId);
        const existingPeers = allCallPeers.filter((p) => p.socketId !== socket.id);

        // Return list of active call peers to the joining socket
        socket.emit('call:active-peers', {
          peers: existingPeers,
        });

        // Notify existing peers that a new participant joined the call
        socket.to(roomId).emit('call:peer-joined', {
          peer: newCallParticipant,
        });
      } catch (err) {
        console.error('Error on call:join:', err.message);
        socket.emit('call:error', { message: 'Failed to join video call' });
      }
    });

    /**
     * WebRTC P2P Signaling Relay: Offer, Answer, ICE Candidate
     */
    socket.on('call:signal', ({ roomId, targetSocketId, signal }) => {
      try {
        if (!socket.currentRoomId || socket.currentRoomId !== roomId) {
          return;
        }

        if (!targetSocketId || typeof targetSocketId !== 'string') {
          return;
        }

        if (!signal || typeof signal !== 'object') {
          return;
        }

        const { type } = signal;
        if (!['offer', 'answer', 'ice-candidate'].includes(type)) {
          return;
        }

        // Limit payload size (< 64KB)
        const jsonStr = JSON.stringify(signal);
        if (jsonStr.length > 65536) {
          return;
        }

        // Verify targetSocketId is in the same room's call participants
        const callPeers = roomManager.getCallParticipants(roomId);
        const targetInCall = callPeers.some((p) => p.socketId === targetSocketId);
        if (!targetInCall) {
          return;
        }

        // Forward signaling packet directly to recipient
        io.to(targetSocketId).emit('call:signal', {
          fromSocketId: socket.id,
          fromUser: {
            id: socket.user._id.toString(),
            name: socket.user.name,
          },
          signal,
        });
      } catch (err) {
        console.error('Error on call:signal:', err.message);
      }
    });

    /**
     * Audio/Video Media State Toggle (Mute/Unmute Mic, Enable/Disable Camera)
     */
    socket.on('call:media-toggle', ({ roomId, audio, video }) => {
      try {
        if (!socket.currentRoomId || socket.currentRoomId !== roomId) {
          return;
        }

        const updated = roomManager.updateCallMediaState(roomId, socket.id, { audio, video });
        if (updated) {
          socket.to(roomId).emit('call:peer-media-toggle', {
            peerId: socket.id,
            audio: updated.audio,
            video: updated.video,
          });
        }
      } catch (err) {
        console.error('Error on call:media-toggle:', err.message);
      }
    });

    /**
     * User leaves the call without leaving the room or disconnecting editor
     */
    socket.on('call:leave', ({ roomId }) => {
      try {
        if (!socket.currentRoomId || socket.currentRoomId !== roomId) {
          return;
        }

        const removed = roomManager.removeCallParticipant(roomId, socket.id);
        if (removed) {
          socket.to(roomId).emit('call:peer-left', {
            peerId: socket.id,
            userName: socket.user.name,
          });
        }
      } catch (err) {
        console.error('Error on call:leave:', err.message);
      }
    });

    // ── 7. Room Leave ─────────────────────────────────────────
    socket.on('room:leave', ({ roomId }) => {
      if (socket.currentRoomId === roomId) {
        const removedCallPeer = roomManager.removeCallParticipant(roomId, socket.id);
        if (removedCallPeer) {
          socket.to(roomId).emit('call:peer-left', {
            peerId: socket.id,
            userName: socket.user.name,
          });
        }
        socket.leave(roomId);
        const presence = roomManager.removeParticipant(roomId, socket.id);
        io.to(roomId).emit('room:presence', { participants: presence });
        socket.currentRoomId = null;
      }
    });

    // ── 8. Disconnect Handler ─────────────────────────────────
    socket.on('disconnect', () => {
      if (socket.currentRoomId) {
        const removedCallPeer = roomManager.removeCallParticipant(socket.currentRoomId, socket.id);
        if (removedCallPeer) {
          socket.to(socket.currentRoomId).emit('call:peer-left', {
            peerId: socket.id,
            userName: socket.user.name,
          });
        }
        const presence = roomManager.removeParticipant(socket.currentRoomId, socket.id);
        io.to(socket.currentRoomId).emit('room:presence', { participants: presence });
      }
    });
  });
}
