/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleNameMapper: {
    "^@ministrosfc/shared(.*)$": "<rootDir>/../shared/src$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.test.json" }],
  },
  testMatch: ["**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/scripts/**", "!src/main.ts"],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 40,
      functions: 65,
      lines: 70,
    },
  },
  // setupFiles runs before test framework: sets env vars before any module loads
  setupFiles: ["<rootDir>/tests/env-setup.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  // Serial execution prevents cleanDatabase() race conditions between workers
  maxWorkers: 1,
};
