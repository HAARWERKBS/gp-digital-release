// TypeScript-Definitionen für die Electron-API

interface UpdateInfo {
    currentVersion: string;
    latestVersion: string;
    downloadUrl?: string;
    releaseNotes?: string;
    updateUrl?: string;
    hasUpdate: boolean;
}

interface ElectronAPI {
    getAppVersion: () => Promise<string>;
    checkForUpdates: () => Promise<UpdateInfo>;
    openExternal: (url: string) => Promise<void>;
    getUsedMasterPasswords: () => Promise<string[]>;
    saveUsedMasterPassword: (hash: string) => Promise<void>;
    isElectron: boolean;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

export {};
