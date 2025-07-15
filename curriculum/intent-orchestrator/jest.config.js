/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
        '**/tests/**/*.test.ts'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    rootDir: '.',
    // Mock inquirer to avoid ES module issues
    moduleNameMapper: {
        '^inquirer$': '<rootDir>/tests/__mocks__/inquirer.js'
    }
};