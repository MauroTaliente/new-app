import { defineConfig } from 'vitest/config';
import { vitestCoverageDefaults } from '../../vitest.coverage.shared.ts';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: false,
    include: ['test/**/*.spec.ts'],
    coverage: vitestCoverageDefaults,
  },
});
