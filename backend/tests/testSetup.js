const mongoose = require('mongoose');

// Check if we're already connected
if (mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.MONGODB_URI_TEST, {
    connectTimeoutMS: 30000,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000
  });
}

// Clean all collections before each test
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Disconnect after all tests
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
});
