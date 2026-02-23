import React, { useEffect, useState } from 'react';
import { Download, X, RefreshCw } from 'lucide-react';

interface UpdateInfo {
    currentVersion: string;
    latestVersion: string;
    downloadUrl?: string;
    releaseNotes?: string;
    hasUpdate: boolean;
    error?: string;
}

export const UpdateNotification: React.FC = () => {
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [checking, setChecking] = useState(false);

    const checkForUpdates = async () => {
        // Prüfen ob wir in Electron laufen
        if (window.electronAPI?.checkForUpdates) {
            setChecking(true);
            try {
                const info = await window.electronAPI.checkForUpdates();
                setUpdateInfo(info);
            } catch (error) {
                console.error('Update-Check fehlgeschlagen:', error);
            } finally {
                setChecking(false);
            }
        }
    };

    useEffect(() => {
        // Initial prüfen nach 3 Sekunden (App erst laden lassen)
        const timer = setTimeout(() => {
            checkForUpdates();
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const handleDownload = () => {
        if (updateInfo?.downloadUrl && window.electronAPI?.openExternal) {
            window.electronAPI.openExternal(updateInfo.downloadUrl);
        }
    };

    // Nicht anzeigen wenn kein Update verfügbar oder verworfen
    if (!updateInfo?.hasUpdate || dismissed) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <div className="bg-indigo-600 text-white rounded-xl shadow-2xl p-4 animate-pulse-once">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-500 rounded-lg">
                        <Download size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold">Neue Version verfügbar!</h4>
                        <p className="text-sm text-indigo-100 mt-1">
                            Version {updateInfo.latestVersion} ist verfügbar.
                            <br />
                            <span className="text-indigo-200">
                                (Aktuell: {updateInfo.currentVersion})
                            </span>
                        </p>
                        {updateInfo.releaseNotes && (
                            <p className="text-xs text-indigo-200 mt-2 italic">
                                {updateInfo.releaseNotes}
                            </p>
                        )}
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
                            >
                                <Download size={14} />
                                Herunterladen
                            </button>
                            <button
                                onClick={() => setDismissed(true)}
                                className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-400 transition-colors"
                            >
                                Später
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-indigo-200 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Komponente für die Einstellungsseite - zeigt Version und Update-Button
export const VersionInfo: React.FC = () => {
    const [version, setVersion] = useState<string>('Web-Version');
    const [checking, setChecking] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

    useEffect(() => {
        // Version abrufen wenn in Electron
        if (window.electronAPI?.getAppVersion) {
            window.electronAPI.getAppVersion().then(setVersion);
        }
    }, []);

    const handleCheckUpdate = async () => {
        if (window.electronAPI?.checkForUpdates) {
            setChecking(true);
            try {
                const info = await window.electronAPI.checkForUpdates();
                setUpdateInfo(info);
                if (info.error) {
                    alert('Update-Prüfung fehlgeschlagen:\n' + info.error + '\n\nBitte prüfen Sie Ihre Internetverbindung.');
                } else if (!info.hasUpdate) {
                    alert('Sie verwenden bereits die neueste Version (' + info.currentVersion + ').');
                }
            } catch (error) {
                alert('Update-Prüfung fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung.');
            } finally {
                setChecking(false);
            }
        } else {
            alert('Update-Prüfung ist nur in der Desktop-App verfügbar.');
        }
    };

    const handleDownload = () => {
        if (updateInfo?.downloadUrl && window.electronAPI?.openExternal) {
            window.electronAPI.openExternal(updateInfo.downloadUrl);
        }
    };

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="font-bold text-slate-200 mb-4">App-Version</h3>

            <div className="flex items-center justify-between">
                <div>
                    <p className="text-2xl font-mono font-bold text-indigo-400">
                        v{version}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                        GP Digital - Gesellenprüfung
                    </p>
                </div>

                <button
                    onClick={handleCheckUpdate}
                    disabled={checking}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
                    {checking ? 'Prüfe...' : 'Nach Updates suchen'}
                </button>
            </div>

            {updateInfo?.hasUpdate && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-300 font-medium">
                        Version {updateInfo.latestVersion} ist verfügbar!
                    </p>
                    {updateInfo.releaseNotes && (
                        <p className="text-sm text-green-400 mt-1">{updateInfo.releaseNotes}</p>
                    )}
                    <button
                        onClick={handleDownload}
                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download size={16} />
                        Jetzt herunterladen
                    </button>
                </div>
            )}
        </div>
    );
};
