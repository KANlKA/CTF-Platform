module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  globalSetup: './tests/testSetup.js',
  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: ['./tests/testSetup.js'], // For the clearDatabase function
  testPathIgnorePatterns: ['/node_modules/'],
  modulePaths: ['<rootDir>'],
  moduleDirectories: ['node_modules', 'backend', 'routes', 'middleware', 'models'],
  verbose: true
};
