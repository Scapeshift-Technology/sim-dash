import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set the base directory for asset loading
  // './' is needed for Electron to find files correctly after build
  base: './',
  // Set the root directory where index.html is located
  root: path.resolve(__dirname, 'src/renderer'),
  resolve: {
    alias: {
      '@/mlb': path.resolve(__dirname, 'src/services/mlb'),
      '@/simDash': path.resolve(__dirname, 'src/renderer/apps/simDash'),
      '@/accounting': path.resolve(__dirname, 'src/renderer/apps/accounting'),
      '@/types': path.resolve(__dirname, 'types'),
      '@@': path.resolve(__dirname, 'src'),
      '@': path.resolve(__dirname, 'src/renderer') // MUST BE LAST(If ahead of others, will override and cause errors)
    }
  },
  build: {
    // Specify the output directory relative to the project root
    outDir: path.resolve(__dirname, 'dist/renderer'),
    // Empty the output directory before building
    emptyOutDir: true,
    // Optional: Configure Rollup options if needed
    // rollupOptions: {
    //   output: {
    //     // ...
    //   },
    // },
  },
  // Optional: Configure server options for development
  // server: {
  //   port: 3000, // Default is 5173
  // },
}); 