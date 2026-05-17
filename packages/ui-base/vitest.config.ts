import { defineConfig } from 'vitest/config';
import { vitestCoverageDefaults } from '../../vitest.coverage.shared.ts';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.spec.{ts,tsx}'],
    coverage: vitestCoverageDefaults,
  },
});
