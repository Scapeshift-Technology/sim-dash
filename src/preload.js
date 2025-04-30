const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Profile management
    getProfiles: () => ipcRenderer.invoke('get-profiles'),
    saveProfile: (profile) => ipcRenderer.invoke('save-profile', profile),
    deleteProfile: (profileName) => ipcRenderer.invoke('delete-profile', profileName),

    // Connection management
    login: (config) => ipcRenderer.invoke('login', config),
    logout: () => ipcRenderer.invoke('logout'),

    // --- Added for About Window ---
    // Listener for receiving the app version from main process
    onVersion: (callback) => ipcRenderer.on('set-version', callback)
}); 