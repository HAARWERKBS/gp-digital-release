import React, { useState } from 'react';
import { X, ChevronRight, ChevronDown, Key, Users, ClipboardList, FileText, Award, Settings, Lock, HelpCircle, BookOpen } from 'lucide-react';

interface HelpDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

type Section = {
    id: string;
    title: string;
    icon: React.ReactNode;
    content: React.ReactNode;
};

export function HelpDialog({ isOpen, onClose }: HelpDialogProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>('lizenz');

    if (!isOpen) return null;

    const sections: Section[] = [
        {
            id: 'lizenz',
            title: '1. Produktaktivierung (Lizenz)',
            icon: <Key size={18} />,
            content: (
                <div className="space-y-4">
                    <p className="text-slate-300">Beim ersten Start der Software müssen Sie einen gültigen Lizenzschlüssel eingeben.</p>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                        <p className="font-mono text-cyan-400">GPDIG-XXXXX-XXXXX-XXXXX</p>
                        <p className="text-sm text-slate-400 mt-2">Format des Lizenzschlüssels</p>
                    </div>
                    <h4 className="font-semibold text-white">So aktivieren Sie die Lizenz:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300">
                        <li>Geben Sie Ihren Lizenzschlüssel ein</li>
                        <li>Der Schlüssel wird automatisch formatiert</li>
                        <li>Bei vollständiger Eingabe erscheint ein grüner Hinweis</li>
                        <li>Klicken Sie auf <span className="text-cyan-400">"Lizenz aktivieren"</span></li>
                    </ol>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-blue-300 text-sm">
                        <strong>Hinweis:</strong> Den Lizenzschlüssel haben Sie beim Kauf der Software erhalten.
                    </div>
                </div>
            )
        },
        {
            id: 'anmeldung',
            title: '2. Anmeldung & Benutzerrollen',
            icon: <Users size={18} />,
            content: (
                <div className="space-y-4">
                    <h4 className="font-semibold text-white">Zwei Benutzerrollen</h4>
                    <div className="grid gap-3">
                        <div className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-cyan-500">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-cyan-400 font-semibold">Administrator</span>
                                <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">Voller Zugriff</span>
                            </div>
                            <p className="text-sm text-slate-300">Prüflinge anlegen/bearbeiten/löschen, Noten eintragen, alle Einstellungen ändern</p>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-slate-500">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-slate-300 font-semibold">Mitarbeiter</span>
                                <span className="text-xs bg-slate-500/20 text-slate-300 px-2 py-0.5 rounded">Eingeschränkt</span>
                            </div>
                            <p className="text-sm text-slate-300">Noten eintragen, Gesellenbriefe drucken - aber KEINE Lösch- oder Einstellungsaktionen</p>
                        </div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-300 text-sm">
                        <strong>Automatische Abmeldung:</strong> Nach 30 Minuten ohne Aktivität werden Sie automatisch abgemeldet.
                    </div>
                </div>
            )
        },
        {
            id: 'prueflinge',
            title: '3. Prüflinge verwalten',
            icon: <Users size={18} />,
            content: (
                <div className="space-y-4">
                    <h4 className="font-semibold text-white">Neuen Prüfling anlegen (nur Administrator)</h4>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300">
                        <li>Klicken Sie auf <span className="text-emerald-400">"+ Neuer Prüfling"</span></li>
                        <li>Füllen Sie das Formular aus (Persönliche Daten, Adresse, Betrieb, Prüfungsdaten)</li>
                        <li>Klicken Sie auf <span className="text-cyan-400">"Speichern"</span></li>
                    </ol>

                    <h4 className="font-semibold text-white mt-4">Prüfling pausieren/aktivieren</h4>
                    <p className="text-slate-300">Wenn ein Prüfling z.B. krank ist:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                        <li>Fahren Sie mit der Maus über den Prüfling</li>
                        <li>Klicken Sie auf das <span className="text-amber-400">orangene Pause-Symbol</span></li>
                    </ul>

                    <h4 className="font-semibold text-white mt-4">Prüfling löschen</h4>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
                        <strong>Wichtig:</strong> Nur mit Administrator-Passwort möglich! Das Mitarbeiter-Passwort funktioniert hier NICHT.
                    </div>
                </div>
            )
        },
        {
            id: 'benotung',
            title: '4. Benotung durchführen',
            icon: <ClipboardList size={18} />,
            content: (
                <div className="space-y-4">
                    <h4 className="font-semibold text-white">So tragen Sie Noten ein:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300">
                        <li><strong>Prüfling auswählen:</strong> Links in der Liste auf den Namen klicken</li>
                        <li><strong>Teil wählen:</strong> Oben zwischen "Teil 1" und "Teil 2" wechseln</li>
                        <li><strong>Globale Prüfer:</strong> Klicken Sie auf "Gleiche Prüfungskommission" für alle Prüflinge</li>
                        <li><strong>Punkte eintragen:</strong> Für jeden Prüfer die Punkte (0-100) eingeben</li>
                    </ol>

                    <h4 className="font-semibold text-white mt-4">PDF-Dokumente</h4>
                    <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-slate-500"></span>
                            <span className="text-slate-300">Niederschrift Teil 1/2 - Prüfungsprotokoll</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-purple-500"></span>
                            <span className="text-slate-300">Gesamtniederschrift - Zusammenfassung beider Teile</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-emerald-500"></span>
                            <span className="text-slate-300">Prüfungszeugnis - Offizielles Zeugnis</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'gesellenbriefe',
            title: '5. Gesellenbriefe erstellen',
            icon: <Award size={18} />,
            content: (
                <div className="space-y-4">
                    <p className="text-slate-300">Klicken Sie in der Seitenleiste auf <span className="text-amber-400">"Gesellenbriefe"</span>.</p>

                    <h4 className="font-semibold text-white">Grundfunktionen:</h4>
                    <ul className="list-disc list-inside space-y-2 text-slate-300">
                        <li><strong>Datum festlegen:</strong> Oben links das Datum eintragen</li>
                        <li><strong>Ort + Datum:</strong> Der Ort wird automatisch aus den Innungsdaten übernommen (z.B. "Hannover, den 29. Januar 2026")</li>
                        <li><strong>Vorschau:</strong> Rechts sehen Sie eine Live-Vorschau</li>
                        <li><strong>Einzelner Brief:</strong> Bei einem Prüfling auf "PDF herunterladen"</li>
                        <li><strong>Alle Briefe:</strong> "Alle drucken" für alle bestandenen Prüflinge</li>
                    </ul>

                    <h4 className="font-semibold text-white mt-4">Positionen einrichten (bei Hintergrundbild):</h4>
                    <p className="text-slate-300 text-sm">Mit "Positionen einrichten" können Sie Name, Salon und Datum auf dem Gesellenbrief platzieren:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                        <li><strong>Ausrichtung:</strong> Links, Mitte oder Rechts - die X-Position wird automatisch angepasst</li>
                        <li><strong>Bei "Mitte":</strong> Der Text wird immer horizontal zentriert (X wird ignoriert)</li>
                        <li><strong>Bei "Links":</strong> X = linke Kante des Texts</li>
                        <li><strong>Bei "Rechts":</strong> X = rechte Kante des Texts (Text endet dort)</li>
                    </ul>

                    <h4 className="font-semibold text-white mt-4">7 Individuelle Textfelder (bei Hintergrundbild):</h4>
                    <p className="text-slate-300 text-sm">Mit den individuellen Textfeldern können Sie z.B. Überschriften wie "GESELLENBRIEF", Fließtexte oder Wasserzeichen hinzufügen:</p>
                    <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                        <li><strong>Aktivieren:</strong> Toggle-Button (violett = aktiv) links klicken</li>
                        <li><strong>Text eingeben:</strong> Feld aufklappen, Text eintragen. Mit Enter erstellen Sie Zeilenumbrüche</li>
                        <li><strong>Y-Position:</strong> Abstand von oben (0-297mm)</li>
                        <li><strong>X-Position:</strong> Nur bei Links/Rechts relevant</li>
                        <li><strong>Ausrichtung:</strong> Bei Klick auf Links/Mitte/Rechts wird X automatisch gesetzt (20mm / ignoriert / 190mm)</li>
                        <li><strong>Schriftgröße:</strong> In Punkt (pt), z.B. 40pt für große Überschriften</li>
                        <li><strong>Farbe:</strong> Per Farbwähler oder Hex-Code (#1a1a1a)</li>
                        <li><strong>Stil:</strong> Fett (B) und/oder Kursiv (I) kombinierbar</li>
                    </ul>

                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-emerald-300 text-sm">
                        <strong>Beispiel:</strong> Für einen klassischen Gesellenbrief nutzen Sie die Textfelder für: "GESELLENBRIEF" (40pt, fett, zentriert), "hat bei" (20pt, zentriert), "das Friseurhandwerk erlernt..." usw.
                    </div>

                    <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-3 text-violet-300 text-sm">
                        <strong>Tipp:</strong> A4 = 210×297mm. Bei "Zentriert" ist der Text immer horizontal mittig - Sie müssen nur Y anpassen.
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-blue-300 text-sm">
                        <strong>Tipp:</strong> In den Einstellungen laden Sie das Gesellenbrief-Hintergrundbild hoch und tragen die Innungsdaten (inkl. PLZ + Ort) ein.
                    </div>
                </div>
            )
        },
        {
            id: 'einstellungen',
            title: '6. Einstellungen (nur Admin)',
            icon: <Settings size={18} />,
            content: (
                <div className="space-y-4">
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-300 text-sm mb-4">
                        <strong>Hinweis:</strong> Dieser Menüpunkt ist NUR für Administratoren sichtbar!
                    </div>

                    <h4 className="font-semibold text-white">Verfügbare Einstellungen:</h4>
                    <ul className="space-y-3 text-slate-300">
                        <li><strong>Passwörter:</strong> Admin- und Mitarbeiter-Passwort verwalten</li>
                        <li><strong>Prüferpool:</strong> Prüfer anlegen und verwalten</li>
                        <li><strong>Innung:</strong> Name, Adresse, Logo eintragen</li>
                        <li><strong>Notenschlüssel:</strong> Punktegrenzen anpassen (passwortgeschützt)</li>
                        <li><strong>Prüfungsstruktur:</strong> Aufgaben und Gewichtungen (passwortgeschützt)</li>
                        <li><strong>Gesellenbrief-Design:</strong> Hintergrundbild hochladen</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'passwortschutz',
            title: '7. Passwortschutz verstehen',
            icon: <Lock size={18} />,
            content: (
                <div className="space-y-4">
                    <h4 className="font-semibold text-white">Diese Aktionen erfordern das Administrator-Passwort:</h4>
                    <ul className="space-y-2 text-slate-300">
                        <li className="flex items-center gap-2">
                            <span className="text-red-400">●</span> Prüfling löschen
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-red-400">●</span> Alle Prüflinge löschen
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-red-400">●</span> Jahrgang löschen
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-red-400">●</span> Notenschlüssel ändern
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-red-400">●</span> Prüfungsstruktur ändern
                        </li>
                    </ul>

                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300">
                        <strong className="text-red-400">Wichtig:</strong>
                        <p className="mt-1">Das Mitarbeiter-Passwort reicht für diese Aktionen NICHT aus! Nur das Administrator-Passwort ist gültig.</p>
                    </div>
                </div>
            )
        },
        {
            id: 'faq',
            title: '8. Häufige Fragen',
            icon: <HelpCircle size={18} />,
            content: (
                <div className="space-y-4">
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-white">"Ich habe mein Passwort vergessen"</h4>
                            <p className="text-slate-300 text-sm">Wenden Sie sich an den technischen Support. Es gibt ein Master-Passwort für Notfälle.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white">"Ich sehe den Menüpunkt 'Einstellungen' nicht"</h4>
                            <p className="text-slate-300 text-sm">Sie sind als Mitarbeiter angemeldet. Nur Administratoren sehen die Einstellungen.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white">"Ich wurde automatisch abgemeldet"</h4>
                            <p className="text-slate-300 text-sm">Das passiert nach 30 Minuten ohne Aktivität. Ihre Daten sind gespeichert.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white">"Das PDF wird nicht heruntergeladen"</h4>
                            <p className="text-slate-300 text-sm">Prüfen Sie die Browser-Downloads und erlauben Sie Pop-ups für diese Seite.</p>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    const toggleSection = (id: string) => {
        setExpandedSection(expandedSection === id ? null : id);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <BookOpen size={24} className="text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Hilfe & Anleitung</h2>
                            <p className="text-sm text-slate-400">GP Digital Bedienungsanleitung</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    <div className="space-y-2">
                        {sections.map((section) => (
                            <div key={section.id} className="border border-slate-700 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full flex items-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors text-left"
                                >
                                    <span className="text-cyan-400">{section.icon}</span>
                                    <span className="flex-1 font-medium text-white">{section.title}</span>
                                    {expandedSection === section.id ? (
                                        <ChevronDown size={18} className="text-slate-400" />
                                    ) : (
                                        <ChevronRight size={18} className="text-slate-400" />
                                    )}
                                </button>
                                {expandedSection === section.id && (
                                    <div className="p-4 bg-slate-800/30 border-t border-slate-700">
                                        {section.content}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-800/30">
                    <div className="flex items-center justify-between text-sm text-slate-400">
                        <div>
                            <strong className="text-slate-300">Kontakt:</strong> info@liv-friseure-nds.de • Tel: 0511 / 42 72 31
                        </div>
                        <div>GP Digital v1.0</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
