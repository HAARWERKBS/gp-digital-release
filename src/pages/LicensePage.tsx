import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, AlertCircle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { validateLicenseKey, LicenseInfo, ORGANIZATION_INFO, LICENSE_STORAGE_KEY, getLicenseRemainingDays, extractExpiryFromKey } from '../lib/types';
import { useStore } from '../lib/store';

export default function LicensePage() {
    const navigate = useNavigate();
    const { activateLicense } = useStore();
    const [licenseKey, setLicenseKey] = useState('');
    const [error, setError] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [expiredLicense, setExpiredLicense] = useState<LicenseInfo | null>(null);

    // Prüfe beim Laden ob eine abgelaufene Lizenz vorliegt
    useEffect(() => {
        try {
            const saved = localStorage.getItem(LICENSE_STORAGE_KEY);
            if (saved) {
                const licenseInfo: LicenseInfo = JSON.parse(saved);
                const remaining = getLicenseRemainingDays(licenseInfo);
                if (remaining <= 0) {
                    setExpiredLicense(licenseInfo);
                }
            }
        } catch {
            // Ignoriere Fehler
        }
    }, []);

    // Formatiere Eingabe automatisch: GPDIG-YYMM-XXXXX-XXXXX (neues Format: 4-5-5)
    const formatLicenseKey = (value: string): string => {
        // Wenn der Wert bereits das richtige Format hat (z.B. beim Einfügen), behalte es bei
        const upperValue = value.toUpperCase();

        // Prüfe ob es bereits ein vollständig formatierter Schlüssel ist
        if (/^GPDIG-[0-9]{4}-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(upperValue)) {
            return upperValue;
        }

        // Entferne alle Bindestriche und extrahiere die Teile
        const withoutDashes = upperValue.replace(/-/g, '');

        // Entferne alles außer Buchstaben und Zahlen
        const clean = withoutDashes.replace(/[^A-Z0-9]/g, '');

        // Wenn es mit GPDIG anfängt, extrahiere den Rest
        let keyContent = '';
        if (clean.startsWith('GPDIG')) {
            keyContent = clean.slice(5);
        } else {
            keyContent = clean;
        }

        // Baue den formatierten Schlüssel zusammen
        let formatted = 'GPDIG';

        if (keyContent.length > 0) {
            // Datumsteil: die ersten 4 Zeichen (sollten Zahlen sein)
            const datePart = keyContent.slice(0, 4);
            formatted += '-' + datePart;
        }
        if (keyContent.length > 4) {
            // Zufallsteil: Zeichen 5-9
            const randomPart = keyContent.slice(4, 9);
            formatted += '-' + randomPart;
        }
        if (keyContent.length > 9) {
            // Prüfsumme: Zeichen 10-14
            const checksumPart = keyContent.slice(9, 14);
            formatted += '-' + checksumPart;
        }

        return formatted;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatLicenseKey(e.target.value);
        setLicenseKey(formatted);
        setError('');
    };

    const handleActivate = () => {
        setIsValidating(true);
        setError('');

        // Kurze Verzögerung für UX
        setTimeout(() => {
            if (validateLicenseKey(licenseKey)) {
                // Ablaufdatum aus dem Schlüssel extrahieren
                const { expiresAt, isPermanent } = extractExpiryFromKey(licenseKey);

                // Lizenz über den Store aktivieren (speichert in localStorage UND aktualisiert State)
                const newLicenseInfo: LicenseInfo = {
                    key: licenseKey.toUpperCase(),
                    activatedAt: new Date().toISOString(),
                    expiresAt: expiresAt,
                    isPermanent: isPermanent
                };
                activateLicense(newLicenseInfo);

                // Navigation zur Welcome-Seite mit React Router
                navigate('/welcome');
            } else {
                setError('Ungültiger Lizenzschlüssel. Bitte überprüfen Sie Ihre Eingabe.');
            }
            setIsValidating(false);
        }, 500);
    };

    const isComplete = licenseKey.length === 22; // GPDIG-XXXX-XXXXX-XXXXX = 22 Zeichen (neues Format: 5+1+4+1+5+1+5)

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 flex items-center justify-center p-4">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <img
                        src="./icon.png"
                        alt="GP Digital Logo"
                        className="w-20 h-20 mx-auto rounded-2xl shadow-2xl shadow-cyan-500/30 mb-4"
                    />
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                        GP Digital
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm">
                        {ORGANIZATION_INFO.subtitle}
                    </p>
                </div>

                {/* Expired License Warning */}
                {expiredLicense && (
                    <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-4 mb-6 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <AlertTriangle size={24} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-red-400">Lizenz abgelaufen</h3>
                                <p className="text-xs text-red-400/80">
                                    Ihre Testlizenz ist am {new Date(expiredLicense.expiresAt).toLocaleDateString('de-DE')} abgelaufen.
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-red-400/70 mt-3">
                            Bitte geben Sie einen neuen Lizenzschlüssel ein, um die Software weiter zu nutzen.
                        </p>
                    </div>
                )}

                {/* License Card */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <Key size={24} className="text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                {expiredLicense ? 'Neue Lizenz aktivieren' : 'Produktaktivierung'}
                            </h2>
                            <p className="text-xs text-slate-400">Geben Sie Ihren Lizenzschlüssel ein</p>
                        </div>
                    </div>

                    {/* License Input */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Lizenzschlüssel
                            </label>
                            <input
                                type="text"
                                value={licenseKey}
                                onChange={handleInputChange}
                                placeholder="GPDIG-XXXX-XXXXX-XXXXX"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-center font-mono text-lg tracking-wider placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                                maxLength={22}
                                spellCheck={false}
                                autoComplete="off"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Success Indicator */}
                        {isComplete && !error && (
                            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm">
                                <CheckCircle2 size={16} />
                                <span>Schlüssel vollständig - bereit zur Aktivierung</span>
                            </div>
                        )}

                        {/* Activate Button */}
                        <button
                            onClick={handleActivate}
                            disabled={!isComplete || isValidating}
                            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            {isValidating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Wird überprüft...
                                </span>
                            ) : (
                                'Lizenz aktivieren'
                            )}
                        </button>
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 pt-4 border-t border-slate-700/50">
                        <p className="text-xs text-slate-500 text-center">
                            Sie haben Ihren Lizenzschlüssel mit dem Kauf der Software erhalten.
                            <br />
                            Bei Fragen wenden Sie sich an: <span className="text-cyan-400">{ORGANIZATION_INFO.email}</span>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-500 mt-6">
                    GP Digital v1.0.0
                </p>
            </div>
        </div>
    );
}
