import { defineConfig } from 'vitest/config';
import { vitestCoverageDefaults } from '../../vitest.coverage.shared.ts';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    coverage: vitestCoverageDefaults,
  },
});
