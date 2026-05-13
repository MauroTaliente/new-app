import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const packagesDir = path.resolve(__dirname, '../../packages');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // En desarrollo, usar código fuente para HMR al editar paquetes
      '@maurotaliente/react-ui-base': path.join(packagesDir, 'ui-base/src'),
      '@maurotaliente/react-form': path.join(packagesDir, 'form/src'),
      '@maurotaliente/react-ui': path.join(packagesDir, 'ui/src'),
      '@maurotaliente/react-styles': path.join(packagesDir, 'styles/src'),
      '@maurotaliente/react-theme': path.join(packagesDir, 'theme/src'),
      '@maurotaliente/react-context': path.join(packagesDir, 'context/src'),
      '@maurotaliente/react-helpers': path.join(packagesDir, 'helpers/src'),
      '@maurotaliente/react-hooks': path.join(packagesDir, 'hooks/src'),
      '@maurotaliente/react-networking': path.join(packagesDir, 'networking/src'),
      '@maurotaliente/react-persistence': path.join(packagesDir, 'persistence/src'),
    },
  },
});
