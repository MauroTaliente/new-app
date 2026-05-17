import { defineConfig } from 'vitest/config';
import { vitestCoverageDefaults } from '../../vitest.coverage.shared.ts';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.spec.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
    coverage: vitestCoverageDefaults,
  },
});
