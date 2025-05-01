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
  root: path.resolve(__dirname, 'src'),
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