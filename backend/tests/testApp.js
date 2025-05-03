const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

async function initTestApp() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  
  // Use default test DB if env var not set
  const dbUri = process.env.TEST_DB_URI || 'mongodb://localhost:27017/testdb';
  
  await mongoose.connect(dbUri, {
    serverSelectionTimeoutMS: 5000
  });
  
  const routes = require('../routes');
  app.use('/', routes);
  
  return app;
}

module.exports = initTestApp;
