const { parentPort } = require('worker_threads');
const { simulateMatchupMLB } = require('../sim/engine');

if (!parentPort) {
  throw new Error('This module must be run as a worker thread!');
}

// Listen for messages from the main thread
parentPort.on('message', async (data) => {
  try {
    const { matchupLineups, numGames, baseRunningModel, statCaptureConfig, liveGameData, parkEffects, umpireEffects } = data;
    const results = await simulateMatchupMLB(matchupLineups, numGames, baseRunningModel, statCaptureConfig, liveGameData, parkEffects, umpireEffects);
    parentPort.postMessage({ success: true, results });
  } catch (error) {
    parentPort.postMessage({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
