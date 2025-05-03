const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

async function initTestApp() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  
  // Connect to MongoDB with auth
  await mongoose.connect(process.env.TEST_DB_URI, {
    serverSelectionTimeoutMS: 5000
  });
  
  const routes = require('../routes');
  app.use('/', routes);
  
  return app;
}

module.exports = initTestApp;
