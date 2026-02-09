// ℹ️ package responsible to make the connection with mongodb
// https://www.npmjs.com/package/mongoose
const mongoose = require("mongoose");

// ℹ️ Sets the MongoDB URI for our app to have access to it.
const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bookquest_bk";

// Disable buffering immediately - CRITICAL for serverless
mongoose.set('strictQuery', false);

// Connection cache for serverless
let cachedConnection = null;

const connectDB = async () => {
  // If we have a cached connection and it's ready, use it
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('✅ Using cached MongoDB connection');
    return cachedConnection;
  }

  // If mongoose is connecting, wait for it
  if (mongoose.connection.readyState === 2) {
    console.log('⏳ Waiting for MongoDB connection to establish...');
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve);
    });
    return mongoose.connection;
  }

  try {
    console.log('🔄 Establishing new MongoDB connection...');
    
    // Optimized settings for serverless environments
    const connection = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 1, // Reduced for serverless
      minPoolSize: 1,
      retryWrites: true,
      retryReads: true,
      bufferCommands: false, // CRITICAL: Disable buffering
    });

    cachedConnection = connection;
    console.log(`✅ Connected to MongoDB: "${connection.connections[0].name}"`);
    
    return connection;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    cachedConnection = null;
    throw new Error(`Database connection failed: ${err.message}`);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
  cachedConnection = null;
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
  cachedConnection = null;
});

module.exports = { connectDB };
