const mongoose = require('mongoose');

module.exports = async function () {
  // Close all connections
  await mongoose.disconnect();
  
  // Stop in-memory server
  if (global.__MONGO_SERVER__) {
    await global.__MONGO_SERVER__.stop();
  }
  
  // Force exit
  await new Promise(resolve => setTimeout(resolve, 1000));
};