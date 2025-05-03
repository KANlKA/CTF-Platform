const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

module.exports = async function () {
  // Disable buffering and increase timeouts
  mongoose.set('bufferCommands', false);
  mongoose.set('bufferTimeoutMS', 30000);

  const mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'ctf-test-db',
      port: 27018 // Use different port to avoid conflicts
    }
  });

  global.__MONGO_URI__ = mongoServer.getUri();
  global.__MONGO_SERVER__ = mongoServer;

  await mongoose.connect(global.__MONGO_URI__, {
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 30000
  });
};