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

// IPC Handler für Update-Check
ipcMain.handle('check-for-updates', async () => {
    try {
        // Prüfe GitHub für neue Version
        const response = await fetch('https://raw.githubusercontent.com/Hairschneider/gp-digital/main/version.json');
        if (response.ok) {
            const data = await response.json();
            return {
                currentVersion: APP_VERSION,
                latestVersion: data.version,
                downloadUrl: data.downloadUrl,
                releaseNotes: data.releaseNotes,
                hasUpdate: data.version !== APP_VERSION
            };
        }
    } catch (error) {
        console.error('Update-Check fehlgeschlagen:', error);
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
