// Register TypeScript/SWC compiler
require('@swc/register')({
  jsc: {
    parser: {
      syntax: "typescript",
      tsx: false
    },
    target: "es2020"
  },
  module: {
    type: "commonjs"
  }
});

// Import the worker code
require('./simulationWorker.js');
