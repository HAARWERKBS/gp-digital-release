import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Users, Settings, FileText, ClipboardList, ChevronDown, Plus, FolderOpen, Trash2, Copy, Edit2, Check, X, Award, Code2, LogOut, ShieldCheck, User, Clock, MessageSquarePlus, HelpCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../lib/store';
import { usePasswordProtection } from './PasswordDialog';
import { UpdateNotification } from './UpdateNotification';
import { FeedbackDialog } from './FeedbackDialog';
import { HelpDialog } from './HelpDialog';

// Easter Egg: Flip Card Logo Component
function FlipCardLogo({ size = 'large' }: { size?: 'large' | 'small' }) {
    const [isFlipped, setIsFlipped] = useState(false);

    const sizeClasses = size === 'large'
        ? 'w-10 h-10'
        : 'w-8 h-8';

    return (
        <div
            className={cn("perspective-500 cursor-pointer", sizeClasses)}
            onClick={() => setIsFlipped(!isFlipped)}
            title="Klick mich!"
        >
            <div
                className={cn(
                    "relative w-full h-full transition-transform duration-700 transform-style-3d",
                    isFlipped && "rotate-y-180"
                )}
                style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: 'transform 0.7s ease-in-out'
                }}
            >
                {/* Front - Logo */}
                <div
                    className="absolute inset-0 backface-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <img
                        src="./icon.png"
                        alt="GP Digital Logo"
                        className={cn("rounded-lg shadow-lg shadow-cyan-500/20", sizeClasses)}
                    />
                </div>

                {/* Back - Developer */}
                <div
                    className="absolute inset-0 backface-hidden rotate-y-180"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                    }}
                >
                    <div className={cn(
                        "rounded-lg overflow-hidden shadow-lg shadow-purple-500/30 border border-purple-500/50 bg-gradient-to-br from-slate-800 to-slate-900",
                        sizeClasses
                    )}>
                        <img
                            src="./developer.jpg"
                            alt="Developer"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>

            {/* Developer Info Popup - appears to the right */}
            {isFlipped && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-purple-500/30 rounded-lg p-3 shadow-2xl shadow-purple-500/20 min-w-[140px] whitespace-nowrap">
                        {/* Arrow pointing left */}
                        <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-slate-800 border-l border-b border-purple-500/30 -rotate-45" />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-1">
                                <Code2 size={14} className="text-purple-400" />
                                <span className="text-xs text-purple-400 font-medium uppercase tracking-wide">Entwickler</span>
                            </div>
                            <p className="text-sm font-semibold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                                Sascha Vollmer
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Made with ❤️</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Layout() {
    const {
        jahrgaenge,
        currentJahrgangId,
        currentJahrgang,
        createJahrgang,
        switchJahrgang,
        updateJahrgang,
        deleteJahrgang,
        duplicateJahrgang,
        // Authentication
        authSession,
        logout,
        sessionTimeRemaining,
        showTimeoutWarning,
        canModifySettings,
        canDeleteData,
        // Lizenz
        licenseRemainingDays,
        licenseInfo
    } = useStore();
    const navigate = useNavigate();

    const [isJahrgangDropdownOpen, setIsJahrgangDropdownOpen] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newJahrgangName, setNewJahrgangName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const { requestPassword, PasswordDialogComponent } = usePasswordProtection();

    // Ref für Click-Outside-Detection
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Click-Outside-Handler - schließt das Dropdown nur wenn außerhalb geklickt wird
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Nicht schließen wenn im Edit-Modus oder beim Erstellen
            if (editingId || isCreatingNew) {
                return;
            }

            const target = event.target as Node;

            // Prüfen ob der Klick außerhalb des Dropdowns UND des Buttons war
            const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
            const isOutsideButton = buttonRef.current && !buttonRef.current.contains(target);

            if (isJahrgangDropdownOpen && isOutsideDropdown && isOutsideButton) {
                setIsJahrgangDropdownOpen(false);
            }
        };

        // Event Listener nur hinzufügen wenn Dropdown offen ist
        if (isJahrgangDropdownOpen) {
            // Timeout damit der initiale Klick nicht sofort das Dropdown schließt
            const timeoutId = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 0);

            return () => {
                clearTimeout(timeoutId);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isJahrgangDropdownOpen, editingId, isCreatingNew]);

    // Passwort-geschützte Jahrgang-Löschung
    const handleDeleteJahrgang = async (id: string) => {
        const jahrgang = jahrgaenge.find(j => j.id === id);
        if (!jahrgang) return;

        if (jahrgaenge.length <= 1) {
            alert("Der letzte Jahrgang kann nicht gelöscht werden.");
            return;
        }

        await requestPassword(
            'Jahrgang löschen',
            `Möchten Sie den Jahrgang "${jahrgang.name}" wirklich löschen? Alle Prüflinge und Noten werden unwiderruflich gelöscht!`
        );
        deleteJahrgang(id);
    };

    // Nav-Items nach Rolle filtern
    const allNavItems = [
        { to: "/", icon: Users, label: "Prüflinge", requiresAdmin: false },
        { to: "/grading", icon: ClipboardList, label: "Benotung", requiresAdmin: false },
        { to: "/gesellenbriefe", icon: Award, label: "Gesellenbriefe", requiresAdmin: false },
        { to: "/settings", icon: Settings, label: "Einstellungen", requiresAdmin: true },
    ];

    // Nur Einstellungen für Admins sichtbar
    const navItems = allNavItems.filter(item => !item.requiresAdmin || canModifySettings());

    // Logout-Handler
    const handleLogout = () => {
        logout();
        navigate('/welcome');
    };

    // Session-Zeit formatieren
    const formatTimeRemaining = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleCreateJahrgang = () => {
        if (newJahrgangName.trim().length > 0) {
            createJahrgang(newJahrgangName.trim());
            setNewJahrgangName('');
            setIsCreatingNew(false);
        }
    };

    const handleStartEdit = (id: string, name: string) => {
        setEditingId(id);
        setEditName(name);
    };

    const handleSaveEdit = () => {
        if (editingId && editName.trim()) {
            updateJahrgang(editingId, { name: editName.trim() });
            setEditingId(null);
            setEditName('');
        }
    };

    const handleDuplicate = (id: string) => {
        const source = jahrgaenge.find(j => j.id === id);
        if (source) {
            duplicateJahrgang(id, `${source.name} (Kopie)`);
        }
    };

    // Lizenz-Warnung wenn weniger als 14 Tage verbleiben (nicht für unbegrenzte Lizenzen)
    const showLicenseWarning = licenseRemainingDays > 0 && licenseRemainingDays <= 14 && !licenseInfo?.isPermanent;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 flex">
            {/* Lizenz-Ablauf-Warnung */}
            {showLicenseWarning && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white px-4 py-2 shadow-lg">
                    <div className="flex items-center justify-center gap-3">
                        <AlertTriangle size={18} className="animate-pulse" />
                        <span className="text-sm font-medium">
                            Ihre Lizenz läuft in {licenseRemainingDays} {licenseRemainingDays === 1 ? 'Tag' : 'Tagen'} ab
                            {licenseInfo?.expiresAt && ` (${new Date(licenseInfo.expiresAt).toLocaleDateString('de-DE')})`}.
                            Bitte kontaktieren Sie den Support für eine Verlängerung.
                        </span>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 border-r border-slate-700/50 hidden md:flex flex-col relative">
                {/* Metallic shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

                <div className="p-6 border-b border-slate-700/50 relative z-10">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <FlipCardLogo size="large" />
                        <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">GP Digital</span>
                    </h1>
                </div>

                {/* Jahrgang Selector */}
                <div className="px-4 py-3 border-b border-slate-700/50 relative z-10">
                    <div className="relative">
                        <button
                            ref={buttonRef}
                            onClick={() => setIsJahrgangDropdownOpen(!isJahrgangDropdownOpen)}
                            className="w-full flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-cyan-500/20 via-cyan-600/20 to-cyan-500/20 text-cyan-300 rounded-lg text-sm font-medium hover:from-cyan-500/30 hover:to-cyan-500/30 transition-all border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                        >
                            <div className="flex items-center gap-2 truncate">
                                <FolderOpen size={16} />
                                <span className="truncate">{currentJahrgang?.name || 'Kein Jahrgang'}</span>
                            </div>
                            <ChevronDown size={16} className={cn("transition-transform", isJahrgangDropdownOpen && "rotate-180")} />
                        </button>

                        {/* Dropdown - öffnet sich nach rechts außerhalb der Sidebar */}
                        {isJahrgangDropdownOpen && (
                            <div
                                ref={dropdownRef}
                                className="absolute top-0 left-full ml-2 w-72 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl shadow-black/70 z-50 max-h-96 overflow-y-auto"
                            >
                                <div className="p-3 border-b border-slate-700 bg-slate-750">
                                    <p className="text-sm text-slate-300 font-semibold">Jahrgänge ({jahrgaenge.length})</p>
                                </div>

                                <div className="py-2">
                                    {[...jahrgaenge].sort((a, b) => a.name.localeCompare(b.name, 'de')).map(j => (
                                        <div key={j.id} className="group px-2">
                                            {editingId === j.id ? (
                                                <div className="flex items-center gap-2 py-1">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="flex-1 px-3 py-2 text-sm border border-slate-500 rounded-lg bg-slate-700 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit();
                                                            if (e.key === 'Escape') setEditingId(null);
                                                        }}
                                                    />
                                                    <button onClick={handleSaveEdit} className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg">
                                                        <Check size={16} />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-600 rounded-lg">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between py-1 hover:bg-slate-700 rounded-lg">
                                                    <button
                                                        onClick={() => {
                                                            switchJahrgang(j.id);
                                                            setIsJahrgangDropdownOpen(false);
                                                        }}
                                                        className={cn(
                                                            "flex-1 text-left px-3 py-2 rounded-lg text-sm",
                                                            j.id === currentJahrgangId ? "bg-cyan-500/30 text-cyan-200 font-semibold border border-cyan-500/50" : "text-slate-200"
                                                        )}
                                                    >
                                                        <span className="block">{j.name}</span>
                                                        <span className="text-xs text-slate-400 block mt-0.5">{j.data.students.length} Prüflinge</span>
                                                    </button>
                                                    <div className="flex items-center gap-1 pr-1">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleStartEdit(j.id, j.name); }}
                                                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/20 rounded-lg"
                                                            title="Umbenennen"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDuplicate(j.id); }}
                                                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg"
                                                            title="Duplizieren"
                                                        >
                                                            <Copy size={14} />
                                                        </button>
                                                        {jahrgaenge.length > 1 && canDeleteData() && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteJahrgang(j.id); }}
                                                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg"
                                                                title="Löschen"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Neuen Jahrgang erstellen */}
                                <div className="p-3 border-t border-slate-700 bg-slate-750">
                                    {isCreatingNew ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={newJahrgangName}
                                                onChange={(e) => setNewJahrgangName(e.target.value.slice(0, 30))}
                                                placeholder="z.B. Sommer 2024"
                                                maxLength={30}
                                                className="flex-1 px-3 py-2 text-sm border border-slate-500 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleCreateJahrgang();
                                                    if (e.key === 'Escape') setIsCreatingNew(false);
                                                }}
                                            />
                                            <button
                                                onClick={handleCreateJahrgang}
                                                className={`p-2 rounded-lg ${newJahrgangName.trim().length > 0 ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-slate-600 cursor-not-allowed'}`}
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button onClick={() => { setIsCreatingNew(false); setNewJahrgangName(''); }} className="p-2 text-slate-400 hover:bg-slate-600 rounded-lg">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsCreatingNew(true)}
                                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-cyan-400 hover:bg-cyan-500/20 rounded-lg border border-cyan-500/30 font-medium"
                                        >
                                            <Plus size={16} />
                                            Neuen Jahrgang anlegen
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 relative z-10">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-gradient-to-r from-cyan-500/20 via-cyan-600/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                                        : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                                )
                            }
                        >
                            <item.icon size={20} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                {/* User Info & Logout */}
                <div className="p-4 border-t border-slate-700/50 relative z-10 space-y-3">
                    {/* Session Timeout Warning */}
                    {showTimeoutWarning && sessionTimeRemaining && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 animate-pulse">
                            <div className="flex items-center gap-2 text-amber-400 text-xs">
                                <Clock size={14} />
                                <span>Sitzung endet in {formatTimeRemaining(sessionTimeRemaining)}</span>
                            </div>
                        </div>
                    )}

                    {/* Role Badge */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {authSession.role === 'admin' ? (
                                <>
                                    <ShieldCheck size={16} className="text-cyan-400" />
                                    <span className="text-xs text-cyan-400 font-medium">Administrator</span>
                                </>
                            ) : (
                                <>
                                    <User size={16} className="text-slate-400" />
                                    <span className="text-xs text-slate-400 font-medium">Mitarbeiter</span>
                                </>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Abmelden"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>

                    {/* Feedback Button */}
                    <button
                        onClick={() => setIsFeedbackOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg border border-purple-500/30 transition-colors"
                    >
                        <MessageSquarePlus size={14} />
                        Feedback geben
                    </button>

                    {/* Help Button */}
                    <button
                        onClick={() => setIsHelpOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg border border-slate-600/30 transition-colors"
                    >
                        <HelpCircle size={14} />
                        Hilfe
                    </button>

                    <p className="text-xs text-center text-slate-500">
                        GP Digital v1.0.0
                    </p>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="flex-1 flex flex-col min-w-0 relative z-0">
                <header className="md:hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 p-4 relative overflow-hidden">
                    {/* Mobile header shine */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
                    <div className="flex items-center justify-between relative z-10">
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            <FlipCardLogo size="small" />
                            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">GP Digital</span>
                        </h1>
                        {/* Mobile: Role Badge & Logout */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                {authSession.role === 'admin' ? (
                                    <ShieldCheck size={14} className="text-cyan-400" />
                                ) : (
                                    <User size={14} className="text-slate-400" />
                                )}
                                <span className={cn(
                                    "text-xs font-medium",
                                    authSession.role === 'admin' ? "text-cyan-400" : "text-slate-400"
                                )}>
                                    {authSession.role === 'admin' ? 'Admin' : 'Mitarbeiter'}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="Abmelden"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                    {/* Mobile Session Timeout Warning */}
                    {showTimeoutWarning && sessionTimeRemaining && (
                        <div className="mt-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 animate-pulse">
                            <div className="flex items-center gap-2 text-amber-400 text-xs">
                                <Clock size={14} />
                                <span>Sitzung endet in {formatTimeRemaining(sessionTimeRemaining)}</span>
                            </div>
                        </div>
                    )}
                    {/* Mobile Jahrgang Selector */}
                    <div className="mt-2 relative z-10">
                        <select
                            value={currentJahrgangId || ''}
                            onChange={(e) => switchJahrgang(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-800 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none"
                        >
                            {jahrgaenge.map(j => (
                                <option key={j.id} value={j.id}>{j.name} ({j.data.students.length})</option>
                            ))}
                        </select>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <div className="max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700/50 flex justify-around p-2 z-50 relative overflow-hidden">
                {/* Mobile nav shine */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center p-2 rounded-lg text-xs font-medium transition-all relative z-10",
                                isActive ? "text-cyan-400" : "text-slate-500"
                            )
                        }
                    >
                        <item.icon size={24} />
                        <span className="mt-1">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <PasswordDialogComponent />
            <UpdateNotification />
            <FeedbackDialog isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
            <HelpDialog isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        </div>
    );
}
