import type { Config } from 'jest';
import baseConfig from './jest.config';

const config: Config = {
    ...baseConfig,
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/models/**',
        '!src/config/**',
        '!src/database/index.ts',
        '!src/index.ts',
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
};

export default config;
