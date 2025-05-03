// testApp.js
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const routes = require('../routes');

async function createTestApp() {
  const app = express();
  
  // Start in-memory MongoDB
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Connect to MongoDB
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Middleware
  app.use(express.json());
  
  // Routes
  app.use('/', routes);

  return { app, mongoServer };
}

module.exports = createTestApp;
