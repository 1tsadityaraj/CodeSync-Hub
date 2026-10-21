import * as Y from 'yjs';
import Room from '../models/Room.js';

/**
 * Manages in-memory Yjs documents, active socket presences, and debounced MongoDB persistence.
 */
class RoomManager {
  constructor() {
    /**
     * Map<roomId, {
     *   doc: Y.Doc,
     *   participants: Map<socketId, { id: string, name: string, email: string, role: string }>,
     *   saveTimer: NodeJS.Timeout | null,
     *   isSaving: boolean,
     *   pendingSave: boolean
     * }>
     */
    this.rooms = new Map();
  }

  /**
   * Get or initialize an active in-memory room with Yjs document and whiteboard state.
   * Loads initial code and whiteboard snapshot from MongoDB if room is not yet in memory.
   */
  async getOrCreateRoom(roomId, initialCode = '') {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId);
    }

    const doc = new Y.Doc();
    const ytext = doc.getText('monaco');
    const whiteboardObjects = new Map();
    const deletedObjectIds = new Set();

    // If code/whiteboard exists in MongoDB, populate the in-memory room
    let codeToLoad = initialCode;
    try {
      const dbRoom = await Room.findOne({ roomId }).select('code whiteboard');
      if (dbRoom) {
        if (!codeToLoad && dbRoom.code) {
          codeToLoad = dbRoom.code;
        }
        if (Array.isArray(dbRoom.whiteboard)) {
          for (const obj of dbRoom.whiteboard) {
            if (obj && obj.id) {
              whiteboardObjects.set(obj.id, obj);
            }
          }
        }
      }
    } catch (err) {
      console.error(`Failed to load persisted room data for room ${roomId}:`, err.message);
    }

    if (codeToLoad) {
      doc.transact(() => {
        ytext.insert(0, codeToLoad);
      }, 'server-init');
    }

    const roomState = {
      doc,
      whiteboardObjects,
      deletedObjectIds,
      whiteboardSaveTimer: null,
      isWhiteboardSaving: false,
      pendingWhiteboardSave: false,
      participants: new Map(),
      callParticipants: new Map(),
      saveTimer: null,
      isSaving: false,
      pendingSave: false,
    };

    this.rooms.set(roomId, roomState);
    return roomState;
  }

  /**
   * Schedule debounced code snapshot save to MongoDB (e.g. 1500ms after last keystroke).
   */
  scheduleSave(roomId, io = null) {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return;

    if (io) {
      io.to(roomId).emit('room:save-status', { status: 'saving' });
    }

    if (roomState.saveTimer) {
      clearTimeout(roomState.saveTimer);
    }

    roomState.saveTimer = setTimeout(async () => {
      await this.persistCode(roomId, io);
    }, 1500);
  }

  /**
   * Persist current Yjs document text snapshot directly into MongoDB.
   */
  async persistCode(roomId, io = null) {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return;

    if (roomState.isSaving) {
      roomState.pendingSave = true;
      return;
    }

    roomState.isSaving = true;
    const currentCode = roomState.doc.getText('monaco').toString();

    try {
      await Room.findOneAndUpdate(
        { roomId },
        { code: currentCode },
        { returnDocument: 'after' }
      );

      if (io) {
        io.to(roomId).emit('room:save-status', {
          status: 'saved',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error(`[RoomManager] Failed to persist code for room ${roomId}:`, err.message);
      if (io) {
        io.to(roomId).emit('room:save-status', { status: 'error', message: 'Autosave failed' });
      }
    } finally {
      roomState.isSaving = false;
      if (roomState.pendingSave) {
        roomState.pendingSave = false;
        await this.persistCode(roomId, io);
      }
    }
  }

  /**
   * Get all active whiteboard objects for a room.
   */
  getWhiteboardObjects(roomId) {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return [];
    return Array.from(roomState.whiteboardObjects.values());
  }

  /**
   * Add or update a whiteboard object with tombstone protection against resurrection.
   */
  addOrUpdateWhiteboardObject(roomId, object) {
    const roomState = this.rooms.get(roomId);
    if (!roomState || !object || !object.id) return false;

    // Tombstone check: prevent resurrection of deleted object
    if (roomState.deletedObjectIds.has(object.id)) {
      return false;
    }

    roomState.whiteboardObjects.set(object.id, {
      ...object,
      updatedAt: Date.now(),
    });
    return true;
  }

  /**
   * Delete a whiteboard object and record its tombstone.
   */
  deleteWhiteboardObject(roomId, objectId) {
    const roomState = this.rooms.get(roomId);
    if (!roomState || !objectId) return false;

    roomState.deletedObjectIds.add(objectId);
    roomState.whiteboardObjects.delete(objectId);
    return true;
  }

  /**
   * Clear all whiteboard objects in a room and tombstone all cleared IDs.
   */
  clearWhiteboard(roomId) {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return;

    for (const id of roomState.whiteboardObjects.keys()) {
      roomState.deletedObjectIds.add(id);
    }
    roomState.whiteboardObjects.clear();
  }

  /**
   * Schedule debounced whiteboard snapshot save to MongoDB (1500ms).
   */
  scheduleWhiteboardSave(roomId, io = null) {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return;

    if (io) {
      io.to(roomId).emit('whiteboard:save-status', { status: 'saving' });
    }

    if (roomState.whiteboardSaveTimer) {
      clearTimeout(roomState.whiteboardSaveTimer);
    }

    roomState.whiteboardSaveTimer = setTimeout(async () => {
      await this.persistWhiteboard(roomId, io);
    }, 1500);
  }

  /**
   * Persist current whiteboard objects snapshot directly into MongoDB.
   */
  async persistWhiteboard(roomId, io = null) {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return;

    if (roomState.isWhiteboardSaving) {
      roomState.pendingWhiteboardSave = true;
      return;
    }

    roomState.isWhiteboardSaving = true;
    const currentObjects = Array.from(roomState.whiteboardObjects.values());

    try {
      await Room.findOneAndUpdate(
        { roomId },
        { whiteboard: currentObjects },
        { returnDocument: 'after' }
      );

      if (io) {
        io.to(roomId).emit('whiteboard:save-status', {
          status: 'saved',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error(`[RoomManager] Failed to persist whiteboard for room ${roomId}:`, err.message);
      if (io) {
        io.to(roomId).emit('whiteboard:save-status', { status: 'error', message: 'Whiteboard save failed' });
      }
    } finally {
      roomState.isWhiteboardSaving = false;
      if (roomState.pendingWhiteboardSave) {
        roomState.pendingWhiteboardSave = false;
        await this.persistWhiteboard(roomId, io);
      }
    }
  }

  /**
   * Flush pending changes immediately for both code and whiteboard (e.g. when room ends or server shuts down).
   */
  async flush(roomId) {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return;

    if (roomState.saveTimer) {
      clearTimeout(roomState.saveTimer);
      roomState.saveTimer = null;
    }
    if (roomState.whiteboardSaveTimer) {
      clearTimeout(roomState.whiteboardSaveTimer);
      roomState.whiteboardSaveTimer = null;
    }
    await Promise.all([
      this.persistCode(roomId),
      this.persistWhiteboard(roomId),
    ]);
  }

  /**
   * Add active participant presence to room.
   */
  addParticipant(roomId, socketId, user, role = 'participant') {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return [];

    roomState.participants.set(socketId, {
      id: user._id?.toString() || user.id,
      name: user.name,
      email: user.email,
      role,
      socketId,
    });

    return this.getPresence(roomId);
  }

  /**
   * Remove active participant presence on disconnect or leave.
   */
  removeParticipant(roomId, socketId) {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return [];

    roomState.participants.delete(socketId);
    if (roomState.callParticipants) {
      roomState.callParticipants.delete(socketId);
    }

    // If no participants remain in room, flush pending changes to MongoDB
    if (roomState.participants.size === 0) {
      this.flush(roomId);
    }

    return this.getPresence(roomId);
  }

  /**
   * Get unique active participants (deduplicated by user ID if user opens multiple tabs).
   */
  getPresence(roomId) {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return [];

    const mapById = new Map();
    for (const p of roomState.participants.values()) {
      if (!mapById.has(p.id)) {
        mapById.set(p.id, {
          id: p.id,
          name: p.name,
          email: p.email,
          role: p.role,
        });
      }
    }

    return Array.from(mapById.values());
  }

  /**
   * Add active call participant (when user joins audio/video call).
   */
  addCallParticipant(roomId, socketId, user, mediaState = { audio: true, video: true }) {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return null;

    const participant = {
      socketId,
      userId: user._id?.toString() || user.id,
      userName: user.name || 'Participant',
      audio: mediaState?.audio !== false,
      video: mediaState?.video !== false,
      joinedAt: Date.now(),
    };

    roomState.callParticipants.set(socketId, participant);
    return participant;
  }

  /**
   * Get list of participants currently in the room's call.
   */
  getCallParticipants(roomId) {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return [];
    return Array.from(roomState.callParticipants.values());
  }

  /**
   * Update audio/video status of a call participant.
   */
  updateCallMediaState(roomId, socketId, mediaState) {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return null;

    const participant = roomState.callParticipants.get(socketId);
    if (!participant) return null;

    if (typeof mediaState.audio === 'boolean') {
      participant.audio = mediaState.audio;
    }
    if (typeof mediaState.video === 'boolean') {
      participant.video = mediaState.video;
    }

    return participant;
  }

  /**
   * Remove a participant from the room's call.
   */
  removeCallParticipant(roomId, socketId) {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return null;

    const removed = roomState.callParticipants.get(socketId);
    roomState.callParticipants.delete(socketId);
    return removed || null;
  }

  /**
   * Clean up room when ended
   */
  async destroyRoom(roomId) {
    await this.flush(roomId);
    const roomState = this.rooms.get(roomId);
    if (roomState) {
      roomState.callParticipants.clear();
      roomState.doc.destroy();
      this.rooms.delete(roomId);
    }
  }
}

export const roomManager = new RoomManager();
