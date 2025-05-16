const { contextBridge, ipcRenderer } = require('electron');

// Attempt to import electron-log for the renderer. 
// This is one way to expose it; another is via ipcRenderer.invoke/on for specific log messages.
let logFunctions = {};
try {
  const rendererLog = require('electron-log/renderer');
  logFunctions = {
    log: rendererLog.log,
    info: rendererLog.info,
    warn: rendererLog.warn,
    error: rendererLog.error,
    debug: rendererLog.debug,
    verbose: rendererLog.verbose,
    silly: rendererLog.silly,
  };
} catch (e) {
  console.error('Failed to load electron-log/renderer in preload:', e);
  // Fallback or leave empty if direct renderer logging isn't critical from preload initially
}

contextBridge.exposeInMainWorld('electronAPI', {
    // Profile management
    getProfiles: () => ipcRenderer.invoke('get-profiles'),
    saveProfile: (profile) => ipcRenderer.invoke('save-profile', profile),
    deleteProfile: (profileName) => ipcRenderer.invoke('delete-profile', profileName),

    // Connection management
    login: (config) => ipcRenderer.invoke('login', config),
    logout: () => ipcRenderer.invoke('logout'),

    // League/Schedule/Lineup data
    fetchLeagues: () => ipcRenderer.invoke('fetch-leagues'),
    fetchSchedule: (args) => ipcRenderer.invoke('fetch-schedule', args),
    fetchMlbGameData: (args) => ipcRenderer.invoke('fetch-mlb-game-data', args),
    fetchMlbGamePlayerStats: (args) => ipcRenderer.invoke('fetch-mlb-game-player-stats', args),

    // Simulations
    simulateMatchupMLB: (args) => ipcRenderer.invoke('simulate-matchup-mlb', args),
    
    // Simulation Windows
    createSimWindow: (args) => ipcRenderer.invoke('create-sim-window', args),

    // Simulation Results Window Communication
    getSimData: (args) => ipcRenderer.invoke('get-sim-data', args),

    // Sim history
    saveSimHistory: (args) => ipcRenderer.invoke('save-sim-history', args),
    getSimHistory: (args) => ipcRenderer.invoke('get-sim-history', args),

    // --- Added for About Window ---
    // Listener for receiving the app version from main process
    onVersion: (callback) => ipcRenderer.on('set-version', callback),

    // Expose logger functions
    ...logFunctions
}); 