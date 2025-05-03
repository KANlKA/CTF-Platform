// Load test environment first
require('dotenv').config({ path: '.env.test' });

// Verify required variables
if (!process.env.TEST_MONGODB_URI) {
  throw new Error(`
    TEST_MONGODB_URI is missing from .env.test
    Add this to your .env.test:
    TEST_MONGODB_URI=mongodb://localhost:27017/ctf-platform-test
  `);
}
