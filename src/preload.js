const { contextBridge, ipcRenderer } = require('electron');

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
    fetchMlbLineup: (args) => ipcRenderer.invoke('fetch-mlb-lineup', args),

    // --- Added for About Window ---
    // Listener for receiving the app version from main process
    onVersion: (callback) => ipcRenderer.on('set-version', callback)
}); 