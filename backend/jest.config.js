module.exports = {
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'], // This loads .env.test
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'], // New file we'll create
  testPathIgnorePatterns: ['/node_modules/']
};
