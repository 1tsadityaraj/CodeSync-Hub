import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas or local MongoDB instance.
 * Gracefully handles connection failures without leaking connection secrets.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('⚡ No MONGODB_URI provided; launching in-memory MongoDB for seamless development...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`✅ Development In-Memory MongoDB Connected: ${conn.connection.name}`);
        return conn;
      } catch (memErr) {
        console.warn('Could not launch in-memory MongoDB:', memErr.message);
      }
    }

    console.warn(
      '⚠️  MONGODB_URI is not defined in environment variables.\n' +
      '   Please set MONGODB_URI in your server/.env file (see .env.example).\n' +
      '   The server will start, but database-dependent features will fail.'
    );
    return null;
  }

  try {
    // Mask sensitive credentials before logging
    const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log(`📡 Connecting to MongoDB (${maskedUri})...`);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.warn(
      '💡 Troubleshooting MongoDB Atlas connection:\n' +
      '   1. Check your network access / IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 for dev).\n' +
      '   2. Verify your database username and password in MONGODB_URI.\n' +
      '   3. Ensure your cluster is active and not paused.\n' +
      '   4. Verify you have URL-encoded special characters in your password.'
    );
    return null;
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error.message);
  }
}
