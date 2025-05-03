const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

async function initTestApp() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  
  console.log('Connecting to:', process.env.TEST_MONGODB_URI.replace(/\/\/.*@/, '//****:****@'));
  
  await mongoose.connect("mongodb://localhost:27017/ctf-platform-test", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  const routes = require('../routes');
  app.use('/', routes);
  
  return app;
}

module.exports = initTestApp;
