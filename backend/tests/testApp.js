const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('../routes/auth');
const challengeRoutes = require('../routes/challenges');
const errorHandler = require('../middleware/errorHandler');

// Initialize test app
async function initTestApp() {
  // Connect to test database
  await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://localhost:27017/testdb', {
    auth: {
      username: process.env.DB_USER,
      password: process.env.DB_PASS
    },
    authSource: 'admin'
  });

  // Create express app
  const app = express();

  // Middleware
  app.use(cors());
  app.use(bodyParser.json());

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/challenges', challengeRoutes);

  // Error handling
  app.use(errorHandler);

  return app;
}

module.exports = initTestApp;
