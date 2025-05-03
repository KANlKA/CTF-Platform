// testApp.js
const express = require('express');
const routes = require('../routes');

async function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/', routes);
  return app;
}

module.exports = createTestApp;
