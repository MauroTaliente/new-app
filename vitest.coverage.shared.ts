import type { CoverageV8Options } from 'vitest/node';

/** Shared Vitest v8 coverage defaults for workspace packages. */
export const vitestCoverageDefaults: CoverageV8Options = {
  provider: 'v8',
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    'src/**/*.d.ts',
    'src/**/index.ts',
    'src/bin/**',
    'src/types/**',
    '**/*.test.ts',
    '**/*.test.tsx',
  ],
  reporter: ['text', 'html'],
  reportsDirectory: './coverage',
};

/** Build-time / CLI surface in `@react33/react-styles` — coverage focuses on `src/css`. */
export const vitestCoverageStyles: CoverageV8Options = {
  ...vitestCoverageDefaults,
  include: ['src/css/**/*.{ts,tsx}'],
  exclude: [
    'src/**/*.d.ts',
    'src/bin/**',
    '**/*.test.ts',
    '**/*.test.tsx',
  ],
};
