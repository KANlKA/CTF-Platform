module.exports = {
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'], 
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  testPathIgnorePatterns: ['/node_modules/']
};

