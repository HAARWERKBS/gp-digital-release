import React, { useState } from 'react';
import { X, Star, Send, Mail, Building2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../lib/store';

interface FeedbackDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FeedbackDialog({ isOpen, onClose }: FeedbackDialogProps) {
    const { globalSettings } = useStore();
    const innung = globalSettings?.innung;
    const hasInnungData = innung && (innung.name || innung.street || innung.zipCity);

    // Umfrage-Antworten
    const [zufriedenheit, setZufriedenheit] = useState<number>(0);
    const [bedienung, setBedienung] = useState<string>('');
    const [vergleich, setVergleich] = useState<string>('');
    const [weiterempfehlung, setWeiterempfehlung] = useState<string>('');
    const [featureWunsch, setFeatureWunsch] = useState<string>('');
    const [freitext, setFreitext] = useState<string>('');
    const [includeInnung, setIncludeInnung] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const resetForm = () => {
        setZufriedenheit(0);
        setBedienung('');
        setVergleich('');
        setWeiterempfehlung('');
        setFeatureWunsch('');
        setFreitext('');
        setIncludeInnung(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = () => {
        setIsSending(true);

        // E-Mail-Body erstellen
        const sterneBewertung = '★'.repeat(zufriedenheit) + '☆'.repeat(5 - zufriedenheit);

        // Innung-Abschnitt nur wenn aktiviert und Daten vorhanden
        let innungSection = '';
        if (includeInnung && hasInnungData) {
            const innungLines = [];
            if (innung?.name) innungLines.push(`Innung: ${innung.name}`);
            if (innung?.street) innungLines.push(`Straße: ${innung.street}`);
            if (innung?.zipCity) innungLines.push(`PLZ/Ort: ${innung.zipCity}`);

            innungSection = `

═══════════════════════════════════════
ABSENDER (INNUNG)
═══════════════════════════════════════

${innungLines.join('\n')}`;
        }

        const emailBody = `
GP Digital - Feedback
${innungSection}

═══════════════════════════════════════
UMFRAGE-ERGEBNISSE
═══════════════════════════════════════

1. Gesamtzufriedenheit: ${sterneBewertung} (${zufriedenheit}/5)

2. Bedienung: ${bedienung || 'Keine Angabe'}

3. Vergleich zur bisherigen Methode: ${vergleich || 'Keine Angabe'}

4. Weiterempfehlung: ${weiterempfehlung || 'Keine Angabe'}

5. Wichtigster Feature-Wunsch: ${featureWunsch || 'Keine Angabe'}

═══════════════════════════════════════
VERBESSERUNGSVORSCHLAG
═══════════════════════════════════════

${freitext || 'Kein Vorschlag eingegeben'}

═══════════════════════════════════════
Gesendet aus GP Digital v1.0.0
Datum: ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}
        `.trim();

        const emailSubject = `GP Digital Feedback - ${zufriedenheit}/5 Sterne`;

        // mailto-Link erstellen und öffnen
        const mailtoLink = `mailto:friseurinnungbs@icloud.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

        window.open(mailtoLink, '_blank');

        setIsSending(false);
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Dialog */}
            <div className="relative bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-slate-600/50 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <Mail size={20} className="text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Feedback & Verbesserungen</h2>
                            <p className="text-xs text-slate-400">Helfen Sie uns, GP Digital zu verbessern</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-5">
                    {/* Frage 1: Zufriedenheit (Sterne) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200">
                            1. Wie zufrieden sind Sie insgesamt mit GP Digital?
                        </label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setZufriedenheit(star)}
                                    className={cn(
                                        "p-1 transition-all hover:scale-110",
                                        star <= zufriedenheit ? "text-amber-400" : "text-slate-600 hover:text-slate-400"
                                    )}
                                >
                                    <Star size={28} fill={star <= zufriedenheit ? "currentColor" : "none"} />
                                </button>
                            ))}
                            {zufriedenheit > 0 && (
                                <span className="ml-2 text-sm text-slate-400 self-center">({zufriedenheit}/5)</span>
                            )}
                        </div>
                    </div>

                    {/* Frage 2: Bedienung */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200">
                            2. Wie einfach ist die App zu bedienen?
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Sehr einfach', 'Einfach', 'Mittel', 'Schwierig'].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setBedienung(option)}
                                    className={cn(
                                        "px-3 py-2 text-sm rounded-lg border transition-all",
                                        bedienung === option
                                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                                            : "bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500"
                                    )}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Frage 3: Vergleich */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200">
                            3. Wie bewerten Sie GP Digital im Vergleich zur bisherigen Methode?
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Viel besser', 'Besser', 'Gleich', 'Schlechter'].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setVergleich(option)}
                                    className={cn(
                                        "px-3 py-2 text-sm rounded-lg border transition-all",
                                        vergleich === option
                                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                                            : "bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500"
                                    )}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Frage 4: Weiterempfehlung */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200">
                            4. Würden Sie GP Digital weiterempfehlen?
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Ja', 'Vielleicht', 'Nein'].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setWeiterempfehlung(option)}
                                    className={cn(
                                        "px-3 py-2 text-sm rounded-lg border transition-all",
                                        weiterempfehlung === option
                                            ? option === 'Ja'
                                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                                                : option === 'Nein'
                                                    ? "bg-red-500/20 border-red-500/50 text-red-300"
                                                    : "bg-amber-500/20 border-amber-500/50 text-amber-300"
                                            : "bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500"
                                    )}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Frage 5: Feature-Wunsch */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200">
                            5. Was wäre Ihnen am wichtigsten?
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Mehr Druckoptionen', 'Schnellere Bedienung', 'Mehr Statistiken', 'Cloud-Sync'].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setFeatureWunsch(option)}
                                    className={cn(
                                        "px-3 py-2 text-sm rounded-lg border transition-all",
                                        featureWunsch === option
                                            ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                                            : "bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500"
                                    )}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Frage 6: Freitext */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200">
                            6. Ihr Verbesserungsvorschlag (optional)
                        </label>
                        <textarea
                            value={freitext}
                            onChange={(e) => setFreitext(e.target.value)}
                            placeholder="Was können wir besser machen? Welche Funktionen fehlen Ihnen?"
                            className="w-full px-3 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none resize-none"
                            rows={4}
                        />
                    </div>

                    {/* Optional: Innung mitsenden */}
                    {hasInnungData && (
                        <div className="pt-2 border-t border-slate-700/50">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={includeInnung}
                                    onChange={(e) => setIncludeInnung(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 rounded border-slate-500 bg-slate-700 text-cyan-500 focus:ring-cyan-500/20 focus:ring-offset-0"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 text-sm text-slate-200 group-hover:text-slate-900 group-hover:text-white transition-colors">
                                        <Building2 size={14} className="text-slate-400" />
                                        <span>Innung-Daten mitsenden</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {innung?.name || 'Innung'}{innung?.zipCity ? ` (${innung.zipCity})` : ''}
                                    </p>
                                </div>
                            </label>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700/50 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                        Öffnet Ihr E-Mail-Programm
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSending}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Send size={16} />
                            Feedback senden
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
