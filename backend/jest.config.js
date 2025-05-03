module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000, // Increased overall timeout
  setupFilesAfterEnv: ['./tests/testSetup.js'],
  globalSetup: './tests/globalSetup.js',
  globalTeardown: './tests/globalTeardown.js',
  testPathIgnorePatterns: ['/node_modules/'],
  detectOpenHandles: true,
  forceExit: true,
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};