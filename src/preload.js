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
    testConnection: (config) => ipcRenderer.invoke('test-connection', config),
    login: (config) => ipcRenderer.invoke('login', config),
    logout: () => ipcRenderer.invoke('logout'),

    // League/Schedule/Lineup data
    fetchLeagues: () => ipcRenderer.invoke('fetch-leagues'),
    fetchSchedule: (args) => ipcRenderer.invoke('fetch-schedule', args),

    // ---------- MLB-specific functions ----------
    // Fetching data
    fetchMlbGameData: (args) => ipcRenderer.invoke('fetch-mlb-game-data', args),
    fetchMlbGamePlayerStats: (args) => ipcRenderer.invoke('fetch-mlb-game-player-stats', args),

    // Simulations
    simulateMatchupMLB: (args) => ipcRenderer.invoke('simulate-matchup-mlb', args),

    // Live data (MLB)
    connectToWebSocketMLB: (args) => ipcRenderer.invoke('connect-to-web-socket-mlb', args),
    disconnectFromWebSocketMLB: (args) => ipcRenderer.invoke('disconnect-from-web-socket-mlb', args),
    onMLBGameUpdate: (callback) => {
        // Create the event listener
        const listener = (event, data) => callback(data);
        ipcRenderer.on('mlb-game-update', listener);
        
        // Return cleanup function
        return () => {
            ipcRenderer.removeListener('mlb-game-update', listener);
        };
    },
    fetchInitialMLBLiveData: (args) => ipcRenderer.invoke('fetch-initial-mlb-live-data', args),
    
    // ---------- Simulation Windows ----------
    createSimWindow: (args) => ipcRenderer.invoke('create-sim-window', args),

    // Simulation Results Window Communication
    getMLBSimData: (args) => ipcRenderer.invoke('get-mlb-sim-data', args),

    // Sim history
    saveSimHistory: (args) => ipcRenderer.invoke('save-sim-history', args),
    getSimHistory: (args) => ipcRenderer.invoke('get-sim-history', args),

    // --- Added for About Window ---
    // Listener for receiving the app version from main process
    onVersion: (callback) => ipcRenderer.on('set-version', callback),
    // Listener for receiving the build time from main process
    onBuildTime: (callback) => ipcRenderer.on('set-build-time', callback),

    // Expose logger functions
    ...logFunctions
}); 