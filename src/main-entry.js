// Register TypeScript/SWC compiler
require('@swc/register')({
  // Optional: Configure SWC (if needed)
  jsc: {
    parser: {
      syntax: "typescript",
      tsx: false
    },
    target: "es2020"
  },
  // Add this module option
  module: {
    type: "commonjs"
  }
});

// Import the main process file
require('./main.js'); 