const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

async function initTestApp() {
    const app = express();
    app.use(cors());
    app.use(bodyParser.json());
  
    const dbOptions = {
      serverSelectionTimeoutMS: 5000,
      auth: {
        username: process.env.DB_USER,
        password: process.env.DB_PASS
      },
      authSource: 'admin'
    };
  
  await mongoose.connect(process.env.TEST_MONGODB_URI, dbOptions);
  const routes = require('../routes');
  app.use('/', routes);
  
  return app;
}

module.exports = initTestApp;
