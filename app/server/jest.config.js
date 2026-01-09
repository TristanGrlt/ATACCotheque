module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
};