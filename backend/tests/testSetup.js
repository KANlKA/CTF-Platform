const mongoose = require('mongoose');

module.exports = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // Connect with authentication
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        connectTimeoutMS: 30000,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        auth: {
          username: process.env.MONGO_INITDB_ROOT_USERNAME,
          password: process.env.MONGO_INITDB_ROOT_PASSWORD
        },
        authSource: 'admin'
      });
    }
  } catch (err) {
    console.error('Test setup error:', err);
    process.exit(1);
  }
};

// Clean database before each test
module.exports.clearDatabase = async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  } catch (err) {
    console.error('Database cleanup error:', err);
    throw err;
  }
};
