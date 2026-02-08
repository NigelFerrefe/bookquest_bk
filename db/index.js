// ℹ️ package responsible to make the connection with mongodb
// https://www.npmjs.com/package/mongoose
const mongoose = require("mongoose");

// ℹ️ Sets the MongoDB URI for our app to have access to it.
// If no env has been set, we dynamically set it to whatever the folder name was upon the creation of the app

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bookquest_bk";

// Optimized settings for serverless environments (Vercel)
const mongoOptions = {
  serverSelectionTimeoutMS: 30000, // 30 seconds to select server
  socketTimeoutMS: 45000, // 45 seconds for socket operations
  connectTimeoutMS: 30000, // 30 seconds for initial connection
  maxPoolSize: 10, // Maximum connections in pool
  minPoolSize: 1, // Minimum connections to maintain
  retryWrites: true, // Retry failed writes automatically
  retryReads: true, // Retry failed reads automatically
};

mongoose
  .connect(MONGO_URI, mongoOptions)
  .then((x) => {
    const dbName = x.connections[0].name;
    console.log(`Connected to Mongo! Database name: "${dbName}"`);
  })
  .catch((err) => {
    console.error("Error connecting to mongo: ", err);
  });

// Handle connection events for better debugging
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
