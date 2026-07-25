import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src/ui',
  base: './',
  plugins: [react()],
  build: {
    outDir: '../../dist/ui',
    emptyOutDir: true,
    target: 'chrome120'
  },
  server: {
    port: 5199,
    strictPort: true
  }
});
