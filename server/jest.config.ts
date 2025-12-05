import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import tsconfig from './tsconfig.json';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    coverageReporters: ['text', 'lcov', 'html'],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/models/**',
        '!src/config/**',
        '!src/database/index.ts',
        '!test/**',
    ],
    coveragePathIgnorePatterns: [
        '<rootDir>/src/models',
        '<rootDir>/src/utils',
        '<rootDir>/src/config',
        '<rootDir>/src/database',
        '<rootDir>/src/telegram',
        '<rootDir>/src/index.ts',
        '<rootDir>/test',
    ],
    reporters: ['default'],
    moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
        prefix: '<rootDir>/src/'
    }),
    transform: {
        "^.+\\.tsx?$": 'ts-jest',
    },
    maxWorkers: 1,
    forceExit: true,
}

export default config;
