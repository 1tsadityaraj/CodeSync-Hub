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
   * Get or initialize an active in-memory room with Yjs document.
   * Loads initial code snapshot from MongoDB if document is not yet in memory.
   */
  async getOrCreateRoom(roomId, initialCode = '') {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId);
    }

    const doc = new Y.Doc();
    const ytext = doc.getText('monaco');

    // If code exists in MongoDB, populate the Yjs document
    let codeToLoad = initialCode;
    if (!codeToLoad) {
      try {
        const dbRoom = await Room.findOne({ roomId }).select('code');
        if (dbRoom && dbRoom.code) {
          codeToLoad = dbRoom.code;
        }
      } catch (err) {
        console.error(`Failed to load persisted code for room ${roomId}:`, err.message);
      }
    }

    if (codeToLoad) {
      doc.transact(() => {
        ytext.insert(0, codeToLoad);
      }, 'server-init');
    }

    const roomState = {
      doc,
      participants: new Map(),
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
   * Flush pending changes immediately (e.g. when room ends or server shuts down).
   */
  async flush(roomId) {
    const roomState = this.rooms.get(roomId);
    if (roomState?.saveTimer) {
      clearTimeout(roomState.saveTimer);
      roomState.saveTimer = null;
    }
    await this.persistCode(roomId);
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
   * Clean up room when ended
   */
  async destroyRoom(roomId) {
    await this.flush(roomId);
    const roomState = this.rooms.get(roomId);
    if (roomState) {
      roomState.doc.destroy();
      this.rooms.delete(roomId);
    }
  }
}

export const roomManager = new RoomManager();
