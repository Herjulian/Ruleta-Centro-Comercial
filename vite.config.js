import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './', // Vital para Electron
  plugins: [
    react(),
    tailwindcss(), // Plugin oficial de Tailwind 4
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173, // Puerto por defecto para desarrollo
  }
});