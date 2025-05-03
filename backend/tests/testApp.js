const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('../backend/routes');
const { errorHandler } = require('../backend/middleware');

async function initTestApp() {
  // Connect to test database
  await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://localhost:27017/testdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Create express app
  const app = express();

  // Middleware
  app.use(cors());
  app.use(bodyParser.json());

  // Use all routes from your consolidated routes file
  app.use('/', routes);

  // Error handling
  app.use(errorHandler);

  return app;
}

module.exports = initTestApp;
