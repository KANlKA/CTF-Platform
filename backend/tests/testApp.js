const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('../routes'); // Changed from '../backend/routes'
const { errorHandler } = require('../middleware'); // Changed from '../backend/middleware'

async function initTestApp() {
  await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://localhost:27017/testdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use('/', routes);
  app.use(errorHandler);

  return app;
}

module.exports = initTestApp;
