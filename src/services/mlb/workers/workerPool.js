const { Worker } = require('worker_threads');
const path = require('path');

// ---------- Main function ----------

async function runParallelSimulation(matchupLineups, numGames) {
  const workerPool = createWorkerPool(numGames);
    
  const workerPromises = workerPool.map(({ worker, games }) => 
    new Promise((resolve, reject) => {
      worker.on('message', (data) => {
        worker.terminate();
        resolve(data);
      });
      worker.on('error', (err) => {
        worker.terminate();
        reject(err);
      });
      worker.postMessage({ matchupLineups, numGames: games });
    })
  );
  
  const results = await Promise.all(workerPromises);
  return combineWorkerResults(results);
}

module.exports = { runParallelSimulation }; 

// ---------- Helper functions ----------

function createWorkerPool(numGames) {
  const numWorkers = getOptimalWorkerCount();
  const gamesPerWorker = Math.ceil(numGames / numWorkers);
  
  return Array(numWorkers).fill(null).map(() => ({
    worker: new Worker(path.join(__dirname, 'worker-entry.js')),
    games: gamesPerWorker
  }));
}

function deepMergeResults(results) {
  if (!Array.isArray(results) || results.length === 0) return {};
  
  // If the values are numbers, sum them
  if (typeof results[0] === 'number') {
    return results.reduce((sum, val) => sum + val, 0);
  }
  
  // If not an object, take the first value (handles strings, etc)
  if (typeof results[0] !== 'object' || results[0] === null) {
    return results[0];
  }

  const merged = {};
  
  // Get all keys from all objects
  const allKeys = [...new Set(results.flatMap(obj => Object.keys(obj)))];
  
  // Merge each key recursively
  for (const key of allKeys) {
    const values = results.map(obj => obj[key]).filter(val => val !== undefined);
    merged[key] = deepMergeResults(values);
  }
  
  return merged;
}

function combineWorkerResults(workerResults) {
  const validResults = workerResults
    .filter(r => r.success)
    .map(r => r.results);
  
  const results = deepMergeResults(validResults);

  return results;
}

function getOptimalWorkerCount() {
  const cpuCount = require('os').cpus().length;

  if (cpuCount <= 4) {
    // Small CPU: Leave 1 core free
    return Math.max(1, cpuCount - 1);
  } else if (cpuCount <= 8) {
    // Mid-size CPU: Leave 1-2 cores free
    return Math.max(1, cpuCount - 2);
  } else {
    // Large CPU: Leave ~25% cores free
    return Math.max(1, Math.floor(cpuCount * 0.75));
  }
}
