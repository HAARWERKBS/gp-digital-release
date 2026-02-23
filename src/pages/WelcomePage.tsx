import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { ORGANIZATION_INFO } from '../lib/types';
import { Lock, Eye, EyeOff, KeyRound, ShieldCheck, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function WelcomePage() {
    const { isFirstTimeSetup, login, completeFirstTimeSetup, adminPasswordHash, mitarbeiterPasswordHash } = useStore();
    const navigate = useNavigate();

    // Prüfe ob bestehende Daten ohne Passwort existieren
    // In diesem Fall zeigen wir den normalen Login (Master-Passwort funktioniert immer)
    const hasNoPasswordSet = !adminPasswordHash && !mitarbeiterPasswordHash;
    const showSetupMode = isFirstTimeSetup;
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // Kurze Verzögerung für visuelles Feedback
        await new Promise(resolve => setTimeout(resolve, 300));

        const result = await login(password);
        if (result.success) {
            // Erfolgreich eingeloggt - zur Hauptseite navigieren
            navigate('/');
        } else {
            setError(result.error || 'Ungültiges Passwort. Bitte versuchen Sie es erneut.');
            setPassword('');
        }
        setIsLoading(false);
    };

    const handleFirstTimeSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 4) {
            setError('Das Passwort muss mindestens 4 Zeichen lang sein.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Die Passwörter stimmen nicht überein.');
            return;
        }

        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        completeFirstTimeSetup(password);
        // Nach Ersteinrichtung zur Hauptseite navigieren
        navigate('/');
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-700/20 via-transparent to-transparent pointer-events-none" />

            {/* Main Card */}
            <div className="relative w-full max-w-lg">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-slate-400/30 to-cyan-500/30 rounded-2xl blur-xl opacity-50" />

                <div className="relative bg-gradient-to-b from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl overflow-hidden">
                    {/* Chrome Header Stripe */}
                    <div className="h-1.5 bg-gradient-to-r from-slate-600 via-slate-300 to-slate-600" />

                    {/* Content */}
                    <div className="p-8">
                        {/* Logo/Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/40 to-slate-400/40 rounded-2xl blur-lg opacity-60" />
                                <img
                                    src="./icon.png"
                                    alt="GP Digital Logo"
                                    className="relative w-20 h-20 rounded-2xl shadow-xl"
                                />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-xl font-bold text-center mb-2 bg-gradient-to-r from-slate-200 via-white to-slate-200 bg-clip-text text-transparent">
                            GP Digital
                        </h1>
                        <p className="text-center text-slate-400 text-sm mb-6 leading-relaxed">
                            {ORGANIZATION_INFO.title}
                        </p>

                        {/* Organization Info */}
                        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
                            <p className="text-slate-300 font-medium text-sm text-center">
                                {ORGANIZATION_INFO.name}
                            </p>
                            <p className="text-slate-400 text-xs text-center mt-1">
                                {ORGANIZATION_INFO.street}
                            </p>
                            <p className="text-slate-400 text-xs text-center">
                                {ORGANIZATION_INFO.zipCity}
                            </p>
                            <div className="flex flex-wrap justify-center gap-x-4 mt-2 text-xs text-slate-500">
                                <span>Tel: {ORGANIZATION_INFO.phone}</span>
                                <span>Fax: {ORGANIZATION_INFO.fax}</span>
                            </div>
                            <div className="flex flex-wrap justify-center gap-x-4 mt-1 text-xs">
                                <a href={`mailto:${ORGANIZATION_INFO.email}`} className="text-cyan-400 hover:text-cyan-300 transition-colors">
                                    {ORGANIZATION_INFO.email}
                                </a>
                                <a href={`https://${ORGANIZATION_INFO.website}`} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                                    {ORGANIZATION_INFO.website}
                                </a>
                            </div>
                        </div>

                        {/* Hinweis bei bestehenden Daten ohne Passwort */}
                        {hasNoPasswordSet && !showSetupMode && (
                            <div className="bg-gradient-to-r from-blue-500/10 via-blue-400/10 to-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <KeyRound className="w-4 h-4" />
                                    <span className="text-sm font-medium">Hinweis</span>
                                </div>
                                <p className="text-blue-300/80 text-xs mt-1">
                                    Es ist noch kein Passwort eingerichtet. Bitte wenden Sie sich an den Administrator
                                    oder verwenden Sie das Master-Passwort.
                                </p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={showSetupMode ? handleFirstTimeSetup : handleLogin}>
                            {showSetupMode ? (
                                <>
                                    {/* First Time Setup */}
                                    <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                                        <div className="flex items-center gap-2 text-amber-400">
                                            <KeyRound className="w-4 h-4" />
                                            <span className="text-sm font-medium">Ersteinrichtung</span>
                                        </div>
                                        <p className="text-amber-300/80 text-xs mt-1">
                                            Legen Sie jetzt Ihr Administrator-Passwort fest.
                                        </p>
                                    </div>

                                    {/* Password Input */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                                Neues Admin-Passwort
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                                    placeholder="••••••••"
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                                Passwort bestätigen
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={confirmPassword}
                                                    onChange={e => setConfirmPassword(e.target.value)}
                                                    className="w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Regular Login */}
                                    <div className="mb-4">
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                            Passwort eingeben
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                                placeholder="••••••••"
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Role Info */}
                                    <div className="flex gap-3 mb-4 text-xs">
                                        <div className="flex-1 bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                                            <div className="flex items-center gap-1.5 text-cyan-400 mb-0.5">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                <span className="font-medium">Admin</span>
                                            </div>
                                            <p className="text-slate-500">Voller Zugriff</p>
                                        </div>
                                        <div className="flex-1 bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                                            <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                                                <User className="w-3.5 h-3.5" />
                                                <span className="font-medium">Mitarbeiter</span>
                                            </div>
                                            <p className="text-slate-500">Eingeschränkt</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading || !password}
                                className={cn(
                                    "w-full py-3 rounded-lg font-medium text-sm transition-all duration-200",
                                    "bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600",
                                    "hover:from-slate-500 hover:via-slate-300 hover:to-slate-500",
                                    "text-slate-900 shadow-lg",
                                    "border border-slate-400/50",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    isLoading && "animate-pulse"
                                )}
                            >
                                {isLoading
                                    ? 'Bitte warten...'
                                    : showSetupMode
                                        ? 'Einrichtung abschließen'
                                        : 'Anmelden'
                                }
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 bg-slate-900/50 border-t border-slate-700/50">
                        <p className="text-center text-slate-500 text-xs">
                            {ORGANIZATION_INFO.subtitle}
                        </p>
                    </div>
                </div>
            </div>

            {/* Version Info */}
            <p className="mt-6 text-slate-500 text-xs">
                GP Digital v1.0 • Gesellenprüfung Teil 1 & 2
            </p>
        </div>
    );
}
