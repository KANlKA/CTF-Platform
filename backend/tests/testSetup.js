const mongoose = require('mongoose');

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  
  await Promise.all(Object.keys(collections).map(async (key) => {
    try {
      await collections[key].deleteMany({});
    } catch (err) {
      console.error(`Error clearing ${key} collection:`, err);
    }
  }));
});

afterAll(async () => {
  await mongoose.disconnect();
});