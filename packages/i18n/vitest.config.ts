import { defineConfig } from 'vitest/config';
import { vitestCoverageDefaults } from '../../vitest.coverage.shared.ts';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      ...vitestCoverageDefaults,
      exclude: [...(vitestCoverageDefaults.exclude ?? []), 'src/types.ts'],
    },
  },
});
