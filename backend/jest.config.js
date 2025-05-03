module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  globalSetup: './tests/testSetup.js',
  setupFilesAfterEnv: ['./tests/testSetup.js'], // For the clearDatabase function
  testPathIgnorePatterns: ['/node_modules/'],
  verbose: true
};
