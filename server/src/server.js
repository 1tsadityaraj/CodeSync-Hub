import 'dotenv/config';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocketServer } from './socket/index.js';

const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// Setup Socket.IO with CORS
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const io = new SocketIOServer(server, {
  cors: {
    origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

initSocketServer(io);

server.listen(PORT, () => {
  console.log(`🚀 CodeSync Hub API & WebSocket listening on http://localhost:${PORT}`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Allowed Client URL: ${clientUrl}`);
});

// Handle graceful shutdown
const shutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  io.close(() => {
    console.log('Socket.IO server closed.');
  });
  server.close(async () => {
    console.log('HTTP server closed.');
    await disconnectDB();
    process.exit(0);
  });

  // Force shutdown if taking longer than 10s
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { server, io };
export default server;

