const mongoose = require('mongoose');

module.exports = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // Only connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        connectTimeoutMS: 30000,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000
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
    const auth = {
      username: process.env.MONGO_INITDB_ROOT_USERNAME,
      password: process.env.MONGO_INITDB_ROOT_PASSWORD
    };

    for (const key in collections) {
      const collection = collections[key];
      // Authenticate before clearing
      await collection.db.admin().command({
        authenticate: 1,
        ...auth
      });
      await collection.deleteMany({});
    }
  } catch (err) {
    console.error('Database cleanup error:', err);
    throw err;
  }
};
