import type { Config } from 'jest';
import baseConfig from './jest.config';

const config: Config = {
    ...baseConfig,
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/models/**',
        '!src/config/**',
        '!src/database/index.ts',
        '!src/routes/**',
        '!src/controllers/**',
        '!src/middlewares/**',
        '!src/app.ts',
        '!test/**',
    ],
    coveragePathIgnorePatterns: [
        '<rootDir>/src/models',
        '<rootDir>/src/utils',
        '<rootDir>/src/config',
        '<rootDir>/src/database',
        '<rootDir>/src/telegram',
        '<rootDir>/src/routes',
        '<rootDir>/src/controllers',
        '<rootDir>/src/middlewares',
        '<rootDir>/src/app.ts',
        '<rootDir>/src/index.ts',
        '<rootDir>/test',
    ],
};

export default config;
