// Jest setup for React Testing Library
require('@testing-library/jest-dom');

// Mock electronAPI minimally
global.window = global.window || {};
global.window.electronAPI = {
  // Add minimal mocks only as needed
};

 