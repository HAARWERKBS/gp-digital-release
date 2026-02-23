const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// App-Version aus package.json
const packageJson = require('../package.json');
const APP_VERSION = packageJson.version;

// Entwicklungsmodus erkennen
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: 'GP Digital - Gesellenprüfung',
        icon: path.join(__dirname, '../public/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        },
        // Modernes Aussehen
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        backgroundColor: '#f9fafb'
    });

    // Im Entwicklungsmodus: Vite Dev Server laden
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        // DevTools öffnen
        mainWindow.webContents.openDevTools();
    } else {
        // Im Produktionsmodus: gebaute Dateien laden
        const indexPath = path.join(__dirname, '../dist/index.html');
        console.log('Loading:', indexPath);
        mainWindow.loadFile(indexPath).catch(err => {
            console.error('Failed to load index.html:', err);
        });
    }


    // Externe Links im Standard-Browser öffnen
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Fenster-Events
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// App ist bereit
app.whenReady().then(() => {
    createWindow();

    // macOS: App neu öffnen wenn Dock-Icon geklickt wird
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Alle Fenster geschlossen
app.on('window-all-closed', () => {
    // Auf macOS bleibt die App aktiv bis Cmd+Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Handler für Version
ipcMain.handle('get-app-version', () => {
    return APP_VERSION;
});

// ============================================
// UPDATE-CHECK mit zukunftssicherer URL-Umleitung
// ============================================

const DEFAULT_VERSION_URL = 'https://raw.githubusercontent.com/HAARWERKBS/gp-digital-release/main/public/version.json';
const savedUpdateUrlPath = path.join(app.getPath('userData'), 'update-url.json');

// Gespeicherte Update-URL laden (falls durch updateUrl-Feld umgeleitet)
function getVersionUrl() {
    try {
        if (fs.existsSync(savedUpdateUrlPath)) {
            const saved = JSON.parse(fs.readFileSync(savedUpdateUrlPath, 'utf-8'));
            if (saved.url) return saved.url;
        }
    } catch (e) { /* Keine gespeicherte URL → Standard verwenden */ }
    return DEFAULT_VERSION_URL;
}

// Neue Update-URL speichern (für zukünftige Umzüge)
function saveUpdateUrl(newUrl) {
    try {
        fs.writeFileSync(savedUpdateUrlPath, JSON.stringify({ url: newUrl }, null, 2), 'utf-8');
    } catch (e) {
        console.error('Fehler beim Speichern der Update-URL:', e);
    }
}

// Plattformspezifische Download-URL ermitteln
function getPlatformDownloadUrl(data) {
    // 1. Bevorzugt: Explizite URLs aus downloads-Objekt in version.json
    if (data.downloads) {
        if (process.platform === 'darwin' && data.downloads.mac) return data.downloads.mac;
        if (process.platform === 'win32' && data.downloads.win) return data.downloads.win;
    }
    // 2. Fallback: Allgemeine Releases-Seite
    return data.downloadUrl || 'https://github.com/HAARWERKBS/gp-digital-release/releases/latest';
}

// IPC Handler für Update-Check
ipcMain.handle('check-for-updates', async () => {
    const versionUrl = getVersionUrl();

    try {
        // Prüfe Version vom Produktions-Repo
        const response = await fetch(versionUrl);
        if (response.ok) {
            const data = await response.json();

            // Wenn updateUrl gesetzt → für zukünftige Checks merken
            if (data.updateUrl && data.updateUrl !== '' && data.updateUrl !== versionUrl) {
                console.log('Update-URL umgeleitet:', data.updateUrl);
                saveUpdateUrl(data.updateUrl);
            }

            return {
                currentVersion: APP_VERSION,
                latestVersion: data.version,
                downloadUrl: getPlatformDownloadUrl(data),
                releaseNotes: data.releaseNotes,
                hasUpdate: data.version !== APP_VERSION
            };
        }
    } catch (error) {
        console.error('Update-Check fehlgeschlagen (URL: ' + versionUrl + '):', error.message);

        // Fallback: Wenn gespeicherte URL fehlschlägt, Original-URL versuchen
        if (versionUrl !== DEFAULT_VERSION_URL) {
            try {
                console.log('Fallback auf Standard-URL...');
                const fallbackResponse = await fetch(DEFAULT_VERSION_URL);
                if (fallbackResponse.ok) {
                    const data = await fallbackResponse.json();
                    return {
                        currentVersion: APP_VERSION,
                        latestVersion: data.version,
                        downloadUrl: getPlatformDownloadUrl(data),
                        releaseNotes: data.releaseNotes,
                        hasUpdate: data.version !== APP_VERSION
                    };
                }
            } catch (fallbackError) {
                console.error('Auch Fallback fehlgeschlagen:', fallbackError.message);
            }
        }
    }

    return {
        currentVersion: APP_VERSION,
        latestVersion: APP_VERSION,
        hasUpdate: false
    };
});

// IPC Handler für externe URL öffnen
ipcMain.handle('open-external', (event, url) => {
    shell.openExternal(url);
});

// ============================================
// MASTER-PASSWORT: Verwendete Passwörter persistent speichern
// Datei liegt im App-Datenverzeichnis (überlebt localStorage-Reset)
// ============================================

const usedMasterPasswordsPath = path.join(app.getPath('userData'), 'used-master-passwords.json');

function getUsedMasterPasswords() {
    try {
        if (fs.existsSync(usedMasterPasswordsPath)) {
            const data = fs.readFileSync(usedMasterPasswordsPath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Fehler beim Lesen der verwendeten Master-Passwörter:', error);
    }
    return [];
}

function saveUsedMasterPassword(passwordHash) {
    try {
        const used = getUsedMasterPasswords();
        if (!used.includes(passwordHash)) {
            used.push(passwordHash);
            fs.writeFileSync(usedMasterPasswordsPath, JSON.stringify(used, null, 2), 'utf-8');
        }
    } catch (error) {
        console.error('Fehler beim Speichern des verwendeten Master-Passworts:', error);
    }
}

// IPC Handler: Verwendete Master-Passwörter abrufen
ipcMain.handle('get-used-master-passwords', () => {
    return getUsedMasterPasswords();
});

// IPC Handler: Master-Passwort als verwendet markieren
ipcMain.handle('save-used-master-password', (event, passwordHash) => {
    saveUsedMasterPassword(passwordHash);
});
