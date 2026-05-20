import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.spec.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@react33/react-helpers': path.resolve(__dirname, '../helpers/src/index.ts'),
      '@react33/react-persistence': path.resolve(
        __dirname,
        '../persistence/src/index.ts',
      ),
      '@react33/react-networking': path.resolve(
        __dirname,
        '../networking/src/index.ts',
      ),
    },
  },
});
