const { contextBridge, ipcRenderer } = require('electron');

// Sichere API für die React-App bereitstellen
contextBridge.exposeInMainWorld('electronAPI', {
    // App-Version abrufen
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    // Nach Updates suchen
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

    // Externe URL öffnen
    openExternal: (url) => ipcRenderer.invoke('open-external', url),

    // Master-Passwort: Verwendete Passwörter persistent verwalten
    getUsedMasterPasswords: () => ipcRenderer.invoke('get-used-master-passwords'),
    saveUsedMasterPassword: (hash) => ipcRenderer.invoke('save-used-master-password', hash),

    // Prüfen ob wir in Electron laufen
    isElectron: true
});
