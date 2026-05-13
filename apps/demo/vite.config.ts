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
      '@react33/react-ui-base': path.join(packagesDir, 'ui-base/src'),
      '@react33/react-form': path.join(packagesDir, 'form/src'),
      '@react33/react-ui': path.join(packagesDir, 'ui/src'),
      '@react33/react-styles': path.join(packagesDir, 'styles/src'),
      '@react33/react-theme': path.join(packagesDir, 'theme/src'),
      '@react33/react-context': path.join(packagesDir, 'context/src'),
      '@react33/react-helpers': path.join(packagesDir, 'helpers/src'),
      '@react33/react-hooks': path.join(packagesDir, 'hooks/src'),
      '@react33/react-networking': path.join(packagesDir, 'networking/src'),
      '@react33/react-persistence': path.join(packagesDir, 'persistence/src'),
    },
  },
});
