const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
process.env.OPENAI_API_KEY = 'mock-key'; // Add this line
const routes = require('../routes');

async function initTestApp() {
  // Connect to test database (remove deprecated options)
  await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://localhost:27017/testdb');

  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(bodyParser.json());
  
  // Routes
  app.use('/', routes);

  // Only add errorHandler if it's properly imported
  if (typeof routes.errorHandler === 'function') {
    app.use(routes.errorHandler);
  }

  return app;
}

module.exports = initTestApp;
