// Jest setup for React Testing Library with TypeScript support
import '@testing-library/jest-dom';

// Mock electronAPI minimally
declare global {
  interface Window {
    electronAPI: {
      // Add minimal mocks only as needed
    };
  }
}

global.window = global.window || {};
global.window.electronAPI = {
  // Add minimal mocks only as needed
}; 