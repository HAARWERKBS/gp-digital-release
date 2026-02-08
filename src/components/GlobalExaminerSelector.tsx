import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { Users, Check, X, Calendar, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

interface GlobalExaminerSelectorProps {
    teil: 1 | 2;
    className?: string;
}

/**
 * Komponente zur Auswahl globaler Prüfer für einen Prüfungsteil.
 * Nur für Admins sichtbar/bearbeitbar, aber alle können die Auswahl sehen.
 */
export default function GlobalExaminerSelector({ teil, className }: GlobalExaminerSelectorProps) {
    const {
        prueferpool,
        getGlobalExaminers,
        setGlobalExaminers,
        canManageExaminers,
        data
    } = useStore();

    const [isExpanded, setIsExpanded] = useState(false);
    const [examDate, setExamDate] = useState<string>('');

    const globalExaminers = getGlobalExaminers(teil);
    const selectedIds = globalExaminers?.examinerIds || [];
    const isAdmin = canManageExaminers();

    // Nur aktive Prüfer anzeigen
    const activePruefer = prueferpool.filter(p => p.isActive);

    // Anzahl der erwarteten Prüfer aus den Einstellungen
    const expectedCount = data.examinerCount || 3;

    const handleTogglePruefer = (id: string) => {
        if (!isAdmin) return;

        const newIds = selectedIds.includes(id)
            ? selectedIds.filter(i => i !== id)
            : [...selectedIds, id];

        setGlobalExaminers(teil, newIds, globalExaminers?.date);
    };

    const handleSetDate = (date: string) => {
        if (!isAdmin) return;
        setGlobalExaminers(teil, selectedIds, date || undefined);
    };

    // Prüfer-Namen für die Anzeige
    const selectedNames = selectedIds
        .map(id => prueferpool.find(p => p.id === id)?.name)
        .filter(Boolean);

    // Datum formatieren
    const formattedDate = globalExaminers?.date
        ? new Date(globalExaminers.date).toLocaleDateString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
        : null;

    return (
        <div className={cn(
            "rounded-xl border overflow-hidden",
            "bg-gradient-to-b from-slate-800 to-slate-900",
            selectedIds.length > 0 ? "border-cyan-500/30" : "border-slate-700",
            className
        )}>
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        selectedIds.length > 0
                            ? "bg-cyan-500/20 text-cyan-400"
                            : "bg-slate-700 text-slate-500"
                    )}>
                        <Users size={20} />
                    </div>
                    <div className="text-left">
                        <h4 className="font-medium text-slate-200">
                            Globale Prüfer Teil {teil}
                        </h4>
                        <p className="text-xs text-slate-500">
                            {selectedIds.length > 0 ? (
                                <>
                                    {selectedNames.join(', ')}
                                    {selectedIds.length < expectedCount && (
                                        <span className="text-amber-400 ml-2">
                                            ({selectedIds.length}/{expectedCount})
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-amber-400">Keine Prüfer ausgewählt</span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {formattedDate && (
                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded border border-slate-600">
                            <Calendar size={12} />
                            {formattedDate}
                        </div>
                    )}
                    {isExpanded ? (
                        <ChevronUp size={18} className="text-slate-500" />
                    ) : (
                        <ChevronDown size={18} className="text-slate-500" />
                    )}
                </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-slate-700 p-4 space-y-4">
                    {/* Admin-only Badge */}
                    {!isAdmin && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800 p-2 rounded-lg border border-slate-700">
                            <ShieldCheck size={14} />
                            Nur Administratoren können die Prüfer ändern
                        </div>
                    )}

                    {/* Prüfungsdatum */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Prüfungsdatum Teil {teil}
                        </label>
                        <input
                            type="date"
                            value={globalExaminers?.date || ''}
                            onChange={(e) => handleSetDate(e.target.value)}
                            disabled={!isAdmin}
                            className={cn(
                                "w-full px-3 py-2 rounded-lg text-sm",
                                "bg-slate-700 border border-slate-600 text-slate-200",
                                "focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20",
                                !isAdmin && "opacity-60 cursor-not-allowed"
                            )}
                        />
                    </div>

                    {/* Prüfer-Liste */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Prüfer auswählen ({selectedIds.length}/{expectedCount})
                        </label>

                        {activePruefer.length === 0 ? (
                            <div className="text-center py-4 text-slate-500 text-sm">
                                <Users size={24} className="mx-auto mb-2 opacity-50" />
                                <p>Keine aktiven Prüfer im Pool</p>
                                {isAdmin && (
                                    <p className="text-xs mt-1">
                                        Fügen Sie Prüfer in den Einstellungen hinzu
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {activePruefer.map(pruefer => {
                                    const isSelected = selectedIds.includes(pruefer.id);
                                    return (
                                        <button
                                            key={pruefer.id}
                                            onClick={() => handleTogglePruefer(pruefer.id)}
                                            disabled={!isAdmin}
                                            className={cn(
                                                "flex items-center gap-2 p-3 rounded-lg text-left transition-all",
                                                "border",
                                                isSelected
                                                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                                                    : "bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500",
                                                !isAdmin && "cursor-not-allowed opacity-60"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-5 h-5 rounded flex items-center justify-center border",
                                                isSelected
                                                    ? "bg-cyan-500 border-cyan-400"
                                                    : "border-slate-500"
                                            )}>
                                                {isSelected && <Check size={14} className="text-white" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-medium truncate block">
                                                    {pruefer.name}
                                                </span>
                                                {pruefer.rolle && (
                                                    <span className={cn(
                                                        "text-xs",
                                                        pruefer.rolle === 'Vorsitzender'
                                                            ? "text-violet-400"
                                                            : pruefer.rolle === 'Beisitzer'
                                                                ? "text-slate-500"
                                                                : "text-slate-400"
                                                    )}>
                                                        {pruefer.rolle}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Hinweis wenn zu wenige/viele Prüfer */}
                    {selectedIds.length > 0 && selectedIds.length !== expectedCount && (
                        <div className={cn(
                            "text-xs p-2 rounded-lg border",
                            selectedIds.length < expectedCount
                                ? "bg-amber-900/20 border-amber-500/30 text-amber-400"
                                : "bg-blue-900/20 border-blue-500/30 text-blue-400"
                        )}>
                            {selectedIds.length < expectedCount
                                ? `Hinweis: Es sind ${expectedCount} Prüfer vorgesehen (${expectedCount - selectedIds.length} fehlen noch)`
                                : `Hinweis: Es sind mehr als ${expectedCount} Prüfer ausgewählt`
                            }
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
