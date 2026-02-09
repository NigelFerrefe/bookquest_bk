const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

router.get("/", (req, res, next) => {
  res.json("All good in here");
});

// Health check endpoint to verify MongoDB connection
router.get("/health", async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const healthCheck = {
    status: dbState === 1 ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: {
      state: states[dbState],
      stateCode: dbState,
      name: mongoose.connection.name || 'N/A',
      host: mongoose.connection.host || 'N/A',
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'not set',
      mongoUriConfigured: !!process.env.MONGODB_URI,
    }
  };

  const httpStatus = dbState === 1 ? 200 : 503;
  res.status(httpStatus).json(healthCheck);
});

module.exports = router;
