import { io } from 'socket.io-client';
import { getStoredToken } from './api';

/**
 * Creates and returns an authenticated Socket.IO connection for CodeSync Hub.
 * Relies on Vite proxy or explicit environment variable.
 */
export function createSocketConnection() {
  const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
  const token = getStoredToken();

  const socket = io(socketUrl, {
    path: '/socket.io',
    withCredentials: true,
    transports: ['websocket', 'polling'],
    auth: {
      token: token || undefined,
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  return socket;
}
