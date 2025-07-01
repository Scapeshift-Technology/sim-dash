module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/unit/**/*.test.ts', '<rootDir>/unit/**/*.test.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true
        },
        target: 'es2020'
      }
    }]
  },
  moduleNameMapper: {
    '^@/mlb/(.*)$': '<rootDir>/../src/services/mlb/$1',
    '^@/simDash/(.*)$': '<rootDir>/../src/renderer/apps/simDash/$1',
    '^@/accounting/(.*)$': '<rootDir>/../src/renderer/apps/accounting/$1',
    '^@/types/(.*)$': '<rootDir>/../src/types/$1',
    '^@@/(.*)$': '<rootDir>/../src/$1',
    '^@/(.*)$': '<rootDir>/../src/renderer/$1'
  },
  testTimeout: 10000
}; 