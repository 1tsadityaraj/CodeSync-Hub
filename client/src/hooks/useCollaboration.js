import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { createSocketConnection } from '../lib/socket';

/**
 * Custom hook managing Yjs CRDT synchronization, Monaco Editor binding,
 * Socket.IO transport, presence, and language synchronization for a room.
 */
export function useCollaboration({ roomId, initialLanguage = 'javascript', onRoomError }) {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('connecting'); // 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [presence, setPresence] = useState([]);
  const [language, setLanguage] = useState(initialLanguage);

  const socketRef = useRef(null);
  const docRef = useRef(null);
  const ytextRef = useRef(null);
  const bindingRef = useRef(null);
  const editorRef = useRef(null);

  // Initialize Y.Doc and Socket.IO connection
  useEffect(() => {
    if (!roomId) return;

    // 1. Create client Yjs document & text type
    const doc = new Y.Doc();
    const ytext = doc.getText('monaco');
    docRef.current = doc;
    ytextRef.current = ytext;

    // 2. Connect authenticated socket
    const s = createSocketConnection();
    socketRef.current = s;
    setSocket(s);

    // Socket lifecycle events
    s.on('connect', () => {
      setStatus('connected');
      s.emit('room:join', { roomId });
    });

    s.on('disconnect', () => {
      setStatus('disconnected');
    });

    s.on('connect_error', (err) => {
      setStatus('disconnected');
      if (onRoomError) onRoomError(err.message || 'Connection error');
    });

    s.io.on('reconnect_attempt', () => {
      setStatus('reconnecting');
    });

    s.io.on('reconnect', () => {
      setStatus('connected');
      // Re-join and request missing state
      s.emit('room:join', { roomId });
      const stateVector = Array.from(Y.encodeStateVector(doc));
      s.emit('yjs:sync-step-1', { roomId, stateVector });
    });

    // 3. Yjs Sync Protocol handlers
    s.on('yjs:initial-state', ({ update, language: roomLang }) => {
      try {
        if (update && update.length > 0) {
          const uint8 = new Uint8Array(update);
          Y.applyUpdate(doc, uint8, 'initial-state');
        }
        if (roomLang) {
          setLanguage(roomLang);
        }
      } catch (err) {
        console.error('Failed to apply initial Yjs state:', err);
      }
    });

    s.on('yjs:sync-step-2', ({ update }) => {
      try {
        if (update && update.length > 0) {
          const uint8 = new Uint8Array(update);
          Y.applyUpdate(doc, uint8, 'server');
        }
      } catch (err) {
        console.error('Failed to apply Yjs sync step 2:', err);
      }
    });

    s.on('yjs:update', ({ update }) => {
      try {
        if (update && update.length > 0) {
          const uint8 = new Uint8Array(update);
          Y.applyUpdate(doc, uint8, 'server');
        }
      } catch (err) {
        console.error('Failed to apply remote Yjs update:', err);
      }
    });

    // 4. Outgoing local changes from Yjs document to socket
    const handleDocUpdate = (update, origin) => {
      // Avoid echo loop: only send changes originating from local user input / Monaco
      if (origin === 'server' || origin === 'initial-state') {
        return;
      }
      setSaveStatus('saving');
      s.emit('yjs:update', {
        roomId,
        update: Array.from(update),
      });
    };
    doc.on('update', handleDocUpdate);

    // 5. Room presence, save status, and language sync
    s.on('room:presence', ({ participants }) => {
      setPresence(participants || []);
    });

    s.on('room:save-status', ({ status: saveStat, timestamp }) => {
      setSaveStatus(saveStat);
      if (timestamp) {
        setLastSavedAt(new Date(timestamp));
      }
    });

    s.on('room:language-change', ({ language: newLang }) => {
      setLanguage(newLang);
    });

    s.on('room:error', (err) => {
      if (onRoomError) onRoomError(err.message || 'Room error occurred');
    });

    // Cleanup on unmount or roomId change
    return () => {
      if (bindingRef.current) {
        try {
          bindingRef.current.destroy();
        } catch {
          // Ignore destruction errors
        }
        bindingRef.current = null;
      }

      doc.off('update', handleDocUpdate);
      doc.destroy();
      docRef.current = null;
      ytextRef.current = null;

      s.emit('room:leave', { roomId });
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [roomId, onRoomError]);

  /**
   * Bind Monaco editor instance with Yjs Text document
   */
  const bindEditor = useCallback((editor) => {
    editorRef.current = editor;

    if (!ytextRef.current || !editor) return;

    // Destroy existing binding if any
    if (bindingRef.current) {
      try {
        bindingRef.current.destroy();
      } catch {
        // Ignore
      }
      bindingRef.current = null;
    }

    try {
      const binding = new MonacoBinding(
        ytextRef.current,
        editor.getModel(),
        new Set([editor])
      );
      bindingRef.current = binding;
    } catch (err) {
      console.error('Error creating MonacoBinding:', err);
    }
  }, []);

  /**
   * Change room programming language and broadcast to all participants
   */
  const changeLanguage = useCallback((newLang) => {
    setLanguage(newLang);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('room:language-change', {
        roomId,
        language: newLang,
      });
    }
  }, [roomId]);

  /**
   * Get raw text content currently in the collaborative document
   */
  const getCode = useCallback(() => {
    return ytextRef.current ? ytextRef.current.toString() : '';
  }, []);

  return {
    socket,
    status,
    saveStatus,
    lastSavedAt,
    presence,
    language,
    bindEditor,
    changeLanguage,
    getCode,
  };
}
