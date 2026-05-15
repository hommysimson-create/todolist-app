'use strict';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  globalSetup: './tests/helpers/globalSetup.js',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/db/pool.js',   // DB 연결 자체는 커버리지 제외
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 80,
    },
  },
  coverageReporters: ['text', 'lcov'],
  verbose: true,
};
