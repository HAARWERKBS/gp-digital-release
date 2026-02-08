import React, { useState } from 'react';
import { Lock, X, AlertTriangle } from 'lucide-react';
import { MASTER_ADMIN_PASSWORD } from '../lib/types';
import { useStore } from '../lib/store';

interface PasswordDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title: string;
    description: string;
}

// Einfache Hash-Funktion für Passwort-Vergleich (nicht kryptografisch sicher, aber ausreichend für lokale App)
export const hashPassword = (password: string): string => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
};

export const PasswordDialog: React.FC<PasswordDialogProps> = ({
    isOpen,
    onClose,
    onSuccess,
    title,
    description
}) => {
    const { adminPasswordHash } = useStore();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Prüfe Master-Passwort
        if (password === MASTER_ADMIN_PASSWORD) {
            setPassword('');
            setError('');
            onSuccess();
            onClose();
            return;
        }

        // Prüfe Benutzer-Passwort (wenn gesetzt)
        if (adminPasswordHash) {
            if (hashPassword(password) === adminPasswordHash) {
                setPassword('');
                setError('');
                onSuccess();
                onClose();
                return;
            }
        }

        // Falsches Passwort
        setError('Falsches Passwort');
        setPassword('');
    };

    const handleClose = () => {
        setPassword('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl w-full max-w-md shadow-2xl">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-red-900/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                            <Lock className="text-red-400" size={20} />
                        </div>
                        <h3 className="font-bold text-lg text-red-300">{title}</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white p-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-amber-900/30 border border-amber-500/30 rounded-lg">
                        <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
                        <p className="text-sm text-amber-300">{description}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Administrations-Passwort
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-700 text-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                            placeholder="Passwort eingeben..."
                            autoFocus
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-400">{error}</p>
                        )}
                        {!adminPasswordHash && (
                            <p className="mt-2 text-xs text-slate-400">
                                Hinweis: Kein Benutzer-Passwort gesetzt. Bitte in den Einstellungen festlegen.
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                        >
                            Bestätigen
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Hook für einfache Verwendung des Passwort-Dialogs
export const usePasswordProtection = () => {
    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onSuccess: () => void;
    }>({
        isOpen: false,
        title: '',
        description: '',
        onSuccess: () => {}
    });

    const requestPassword = (title: string, description: string): Promise<boolean> => {
        return new Promise((resolve) => {
            setDialogState({
                isOpen: true,
                title,
                description,
                onSuccess: () => resolve(true)
            });
        });
    };

    const closeDialog = () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
    };

    const PasswordDialogComponent = () => (
        <PasswordDialog
            isOpen={dialogState.isOpen}
            onClose={closeDialog}
            onSuccess={dialogState.onSuccess}
            title={dialogState.title}
            description={dialogState.description}
        />
    );

    return {
        requestPassword,
        PasswordDialogComponent
    };
};
