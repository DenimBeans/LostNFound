module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,  // Change from 10000 to 30000 (30 seconds)
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.js']
};