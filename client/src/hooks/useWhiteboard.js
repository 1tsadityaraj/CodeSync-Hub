import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook managing real-time collaborative whiteboard state,
 * incremental operations, tombstone tracking, and user-scoped undo/redo.
 */
export function useWhiteboard({ socket, roomId, isActive, user }) {
  const [objects, setObjects] = useState(new Map());
  const [remoteCursors, setRemoteCursors] = useState(new Map());
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const lastCursorSentRef = useRef(0);
  const objectsRef = useRef(objects);
  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  // Cleanup inactive remote cursors after 5 seconds of inactivity
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRemoteCursors((prev) => {
        let changed = false;
        const next = new Map(prev);
        for (const [userId, cur] of next.entries()) {
          if (now - cur.lastSeen > 5000) {
            next.delete(userId);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleInitialState = ({ objects: initObjs }) => {
      if (Array.isArray(initObjs)) {
        const objMap = new Map();
        for (const obj of initObjs) {
          if (obj && obj.id) {
            objMap.set(obj.id, obj);
          }
        }
        setObjects(objMap);
      }
    };

    const handleObjectCreate = ({ object }) => {
      if (!object || !object.id) return;
      setObjects((prev) => new Map(prev).set(object.id, object));
    };

    const handleObjectUpdate = ({ object }) => {
      if (!object || !object.id) return;
      setObjects((prev) => new Map(prev).set(object.id, object));
    };

    const handleObjectDelete = ({ objectId }) => {
      if (!objectId) return;
      setObjects((prev) => {
        const next = new Map(prev);
        next.delete(objectId);
        return next;
      });
    };

    const handleClear = () => {
      setObjects(new Map());
      setUndoStack([]);
      setRedoStack([]);
    };

    const handleCursor = ({ userId, userName, x, y }) => {
      if (!userId || userId === (user?._id || user?.id)) return;
      setRemoteCursors((prev) => {
        const next = new Map(prev);
        next.set(userId, {
          x,
          y,
          userName: userName || 'Peer',
          lastSeen: Date.now(),
        });
        return next;
      });
    };

    const handleSaveStatus = ({ status }) => {
      if (status) {
        setSaveStatus(status);
      }
    };

    socket.on('whiteboard:initial-state', handleInitialState);
    socket.on('whiteboard:object-create', handleObjectCreate);
    socket.on('whiteboard:object-update', handleObjectUpdate);
    socket.on('whiteboard:object-delete', handleObjectDelete);
    socket.on('whiteboard:clear', handleClear);
    socket.on('whiteboard:cursor', handleCursor);
    socket.on('whiteboard:save-status', handleSaveStatus);

    return () => {
      socket.off('whiteboard:initial-state', handleInitialState);
      socket.off('whiteboard:object-create', handleObjectCreate);
      socket.off('whiteboard:object-update', handleObjectUpdate);
      socket.off('whiteboard:object-delete', handleObjectDelete);
      socket.off('whiteboard:clear', handleClear);
      socket.off('whiteboard:cursor', handleCursor);
      socket.off('whiteboard:save-status', handleSaveStatus);
    };
  }, [socket, roomId, user]);

  /**
   * Add a newly committed drawing object and broadcast to peers
   */
  const addObject = useCallback(
    (rawObj) => {
      if (!isActive || !socket) return null;

      const id =
        rawObj.id ||
        `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const newObj = {
        ...rawObj,
        id,
        userId: user?._id?.toString() || user?.id || 'anon',
        userName: user?.name || 'User',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setObjects((prev) => new Map(prev).set(id, newObj));
      setUndoStack((prev) => [...prev, { type: 'create', object: newObj }]);
      setRedoStack([]);
      setSaveStatus('saving');

      socket.emit('whiteboard:object-create', {
        roomId,
        object: newObj,
      });

      return newObj;
    },
    [isActive, socket, roomId, user]
  );

  /**
   * Update an existing object and broadcast
   */
  const updateObject = useCallback(
    (updatedObj) => {
      if (!isActive || !socket || !updatedObj?.id) return;

      const merged = {
        ...updatedObj,
        updatedAt: Date.now(),
      };

      setObjects((prev) => new Map(prev).set(merged.id, merged));
      setSaveStatus('saving');

      socket.emit('whiteboard:object-update', {
        roomId,
        object: merged,
      });
    },
    [isActive, socket, roomId]
  );

  /**
   * Delete an object (via eraser or selection) and broadcast
   */
  const deleteObject = useCallback(
    (objectId) => {
      if (!isActive || !socket || !objectId) return;

      const existing = objectsRef.current.get(objectId);
      if (!existing) return;

      setObjects((prev) => {
        const next = new Map(prev);
        next.delete(objectId);
        return next;
      });

      setUndoStack((prev) => [...prev, { type: 'delete', object: existing }]);
      setRedoStack([]);
      setSaveStatus('saving');

      socket.emit('whiteboard:object-delete', {
        roomId,
        objectId,
      });
    },
    [isActive, socket, roomId]
  );

  /**
   * Clear entire canvas and broadcast
   */
  const clearBoard = useCallback(() => {
    if (!isActive || !socket) return;

    setObjects(new Map());
    setUndoStack([]);
    setRedoStack([]);
    setSaveStatus('saving');

    socket.emit('whiteboard:clear', { roomId });
  }, [isActive, socket, roomId]);

  /**
   * Emit throttled cursor position
   */
  const sendCursor = useCallback(
    (x, y) => {
      if (!socket || !socket.connected) return;

      const now = Date.now();
      // Throttle to 30ms (approx 33fps)
      if (now - lastCursorSentRef.current < 30) return;
      lastCursorSentRef.current = now;

      socket.emit('whiteboard:cursor', {
        roomId,
        x: Math.round(x),
        y: Math.round(y),
      });
    },
    [socket, roomId]
  );

  /**
   * User-scoped Undo: reverts the last action performed by THIS user
   */
  const undo = useCallback(() => {
    if (!isActive || undoStack.length === 0) return;

    const action = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    if (action.type === 'create') {
      // Undo creation -> delete object
      setObjects((prev) => {
        const next = new Map(prev);
        next.delete(action.object.id);
        return next;
      });
      setRedoStack((prev) => [...prev, action]);
      setSaveStatus('saving');

      if (socket) {
        socket.emit('whiteboard:object-delete', {
          roomId,
          objectId: action.object.id,
        });
      }
    } else if (action.type === 'delete') {
      // Undo deletion -> recreate object
      setObjects((prev) => new Map(prev).set(action.object.id, action.object));
      setRedoStack((prev) => [...prev, action]);
      setSaveStatus('saving');

      if (socket) {
        socket.emit('whiteboard:object-create', {
          roomId,
          object: action.object,
        });
      }
    }
  }, [isActive, undoStack, socket, roomId]);

  /**
   * User-scoped Redo: reapplies the last undone action
   */
  const redo = useCallback(() => {
    if (!isActive || redoStack.length === 0) return;

    const action = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));

    if (action.type === 'create') {
      // Redo creation -> add object back
      setObjects((prev) => new Map(prev).set(action.object.id, action.object));
      setUndoStack((prev) => [...prev, action]);
      setSaveStatus('saving');

      if (socket) {
        socket.emit('whiteboard:object-create', {
          roomId,
          object: action.object,
        });
      }
    } else if (action.type === 'delete') {
      // Redo deletion -> delete object again
      setObjects((prev) => {
        const next = new Map(prev);
        next.delete(action.object.id);
        return next;
      });
      setUndoStack((prev) => [...prev, action]);
      setSaveStatus('saving');

      if (socket) {
        socket.emit('whiteboard:object-delete', {
          roomId,
          objectId: action.object.id,
        });
      }
    }
  }, [isActive, redoStack, socket, roomId]);

  return {
    objects: Array.from(objects.values()),
    remoteCursors: Array.from(remoteCursors.values()),
    saveStatus,
    canUndo: undoStack.length > 0 && isActive,
    canRedo: redoStack.length > 0 && isActive,
    addObject,
    updateObject,
    deleteObject,
    clearBoard,
    sendCursor,
    undo,
    redo,
  };
}
