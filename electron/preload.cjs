const { contextBridge, ipcRenderer } = require('electron');

// Sichere API für die React-App bereitstellen
contextBridge.exposeInMainWorld('electronAPI', {
    // App-Version abrufen
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    // Nach Updates suchen
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

    // Externe URL öffnen
    openExternal: (url) => ipcRenderer.invoke('open-external', url),

    // Prüfen ob wir in Electron laufen
    isElectron: true
});
