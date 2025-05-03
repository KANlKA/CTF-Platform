module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000, 
  setupFilesAfterEnv: ['./tests/testSetup.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  detectOpenHandles: true,
  forceExit: true,
  testEnvironmentOptions: {
  NODE_ENV: 'test'
  }
};
