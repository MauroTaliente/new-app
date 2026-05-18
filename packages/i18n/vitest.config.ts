import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { vitestCoverageDefaults } from '../../vitest.coverage.shared.ts';

export default defineConfig({
  resolve: {
    alias: {
      '@react33/react-context': path.resolve(__dirname, '../context/src/index.ts'),
      '@react33/react-persistence': path.resolve(__dirname, '../persistence/src/index.ts'),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.spec.ts'],
    coverage: {
      ...vitestCoverageDefaults,
      exclude: [...(vitestCoverageDefaults.exclude ?? []), 'src/types.ts'],
    },
  },
});
