const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.test' });

module.exports = async () => {
  const app = express();
  
  // Add your middleware and routes
  app.use(express.json());
  // Add other middleware as needed
  
  // Connect to test database
  await mongoose.connect(process.env.MONGODB_URI_TEST, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Import and use your routes
  const routes = require('../routes');
  app.use('/', routes);

  return app;
};