const mongoose = require('mongoose');

beforeEach(async () => {
  try {
    // Wait for connection if needed
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(global.__MONGO_URI__);
    }

    // Clear collections with individual timeouts
    const collections = mongoose.connection.collections;
    await Promise.all(Object.keys(collections).map(async (key) => {
      try {
        await collections[key].deleteMany({}).maxTimeMS(10000);
      } catch (err) {
        console.error(`Error clearing ${key} collection:`, err);
      }
    })); // Fixed missing closing parenthesis here
  } catch (err) {
    console.error('Test setup error:', err);
    throw err;
  }
}, 30000); // Increased timeout for beforeEach