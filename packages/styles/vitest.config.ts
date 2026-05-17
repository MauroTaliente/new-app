import { defineConfig } from 'vitest/config';
import { vitestCoverageStyles } from '../../vitest.coverage.shared.ts';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['test/**/*.spec.ts'],
    coverage: vitestCoverageStyles,
  },
});
