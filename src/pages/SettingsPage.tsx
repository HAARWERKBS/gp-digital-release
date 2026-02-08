import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../lib/store';
import { Plus, Trash2, Save, RotateCcw, Download, Upload, Cloud, HardDrive, FileText, Settings2, GraduationCap, BookOpen, Building2, Scale, AlertTriangle, Lock, Eye, EyeOff, Users, UserPlus, Edit2, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { GradingTask, AppData, GradingSheet, TheorySubject, Innung, GradeScale, DEFAULT_INNUNG, DEFAULT_GRADE_SCALE, MASTER_ADMIN_PASSWORD, Pruefer } from '../lib/types';
import { usePasswordProtection, hashPassword } from '../components/PasswordDialog';
import { VersionInfo } from '../components/UpdateNotification';

export default function SettingsPage() {
    const {
        data, updateSheet, updateInnung, updateGradeScale, resetData, importData,
        adminPasswordHash, setAdminPassword, removeAdminPassword,
        mitarbeiterPasswordHash, setMitarbeiterPassword, removeMitarbeiterPassword,
        prueferpool, addPruefer, updatePruefer, deletePruefer,
        certificateBackgroundImage, setCertificateBackgroundImage,
        certificatePositions, customTextFields
    } = useStore();
    const { requestPassword, PasswordDialogComponent } = usePasswordProtection();

    // Admin-Passwort-Einstellungen
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Mitarbeiter-Passwort-Einstellungen
    const [newMitarbeiterPassword, setNewMitarbeiterPassword] = useState('');
    const [confirmMitarbeiterPassword, setConfirmMitarbeiterPassword] = useState('');
    const [showMitarbeiterPassword, setShowMitarbeiterPassword] = useState(false);
    const [mitarbeiterPasswordError, setMitarbeiterPasswordError] = useState('');
    const [mitarbeiterPasswordSuccess, setMitarbeiterPasswordSuccess] = useState('');

    const handleSetPassword = () => {
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword.length < 4) {
            setPasswordError('Passwort muss mindestens 4 Zeichen haben.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwörter stimmen nicht überein.');
            return;
        }
        if (newPassword === MASTER_ADMIN_PASSWORD) {
            setPasswordError('Dieses Passwort ist nicht erlaubt.');
            return;
        }

        setAdminPassword(hashPassword(newPassword));
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess('Passwort erfolgreich gesetzt!');
        setTimeout(() => setPasswordSuccess(''), 3000);
    };

    // Passwort-geschützte Entfernung des Admin-Passworts
    const handleRemovePassword = async () => {
        await requestPassword(
            'Passwort deaktivieren',
            'Möchten Sie den Passwort-Schutz wirklich deaktivieren? Destruktive Aktionen können dann ohne Passwort durchgeführt werden.'
        );
        removeAdminPassword();
        setPasswordSuccess('Passwort-Schutz wurde deaktiviert.');
        setTimeout(() => setPasswordSuccess(''), 3000);
    };

    // Mitarbeiter-Passwort setzen
    const handleSetMitarbeiterPassword = () => {
        setMitarbeiterPasswordError('');
        setMitarbeiterPasswordSuccess('');

        if (newMitarbeiterPassword.length < 4) {
            setMitarbeiterPasswordError('Passwort muss mindestens 4 Zeichen haben.');
            return;
        }
        if (newMitarbeiterPassword !== confirmMitarbeiterPassword) {
            setMitarbeiterPasswordError('Passwörter stimmen nicht überein.');
            return;
        }
        if (newMitarbeiterPassword === MASTER_ADMIN_PASSWORD) {
            setMitarbeiterPasswordError('Dieses Passwort ist nicht erlaubt.');
            return;
        }
        if (adminPasswordHash && hashPassword(newMitarbeiterPassword) === adminPasswordHash) {
            setMitarbeiterPasswordError('Mitarbeiter-Passwort darf nicht identisch mit Admin-Passwort sein.');
            return;
        }

        setMitarbeiterPassword(hashPassword(newMitarbeiterPassword));
        setNewMitarbeiterPassword('');
        setConfirmMitarbeiterPassword('');
        setMitarbeiterPasswordSuccess('Mitarbeiter-Passwort erfolgreich gesetzt!');
        setTimeout(() => setMitarbeiterPasswordSuccess(''), 3000);
    };

    // Mitarbeiter-Passwort entfernen
    const handleRemoveMitarbeiterPassword = async () => {
        await requestPassword(
            'Mitarbeiter-Passwort deaktivieren',
            'Möchten Sie das Mitarbeiter-Passwort wirklich deaktivieren? Mitarbeiter können sich dann nicht mehr anmelden.'
        );
        removeMitarbeiterPassword();
        setMitarbeiterPasswordSuccess('Mitarbeiter-Passwort wurde deaktiviert.');
        setTimeout(() => setMitarbeiterPasswordSuccess(''), 3000);
    };

    // Passwort-geschützte Reset-Funktion
    const handleResetData = async () => {
        await requestPassword(
            'Jahrgang zurücksetzen',
            'ACHTUNG: Alle Daten des aktuellen Jahrgangs werden gelöscht!'
        );
        resetData();
    };

    // Notfall-Reset: Löscht ALLE Daten aus dem LocalStorage und lädt die Seite neu
    const handleEmergencyReset = async () => {
        await requestPassword(
            'Notfall-Reset',
            'ACHTUNG: Dies löscht ALLE Daten unwiderruflich (alle Jahrgänge, alle Prüflinge, alle Noten)! Nur verwenden wenn die App nicht mehr funktioniert.'
        );
        localStorage.removeItem('hair_grading_app_global');
        localStorage.removeItem('hair_grading_app_data');
        window.location.reload();
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Aufklappbare Sektionen - standardmäßig alle geschlossen
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        data: true, // Datenverwaltung standardmäßig offen
        adminPassword: false,
        mitarbeiterPassword: false,
        prueferpool: false,
        innung: false,
        gradeScale: false,
        certificate: false,
        structure: false,
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Prüferpool state
    const [newPrueferName, setNewPrueferName] = useState('');
    const [newPrueferRolle, setNewPrueferRolle] = useState<Pruefer['rolle']>('Prüfer');
    const [editingPrueferId, setEditingPrueferId] = useState<string | null>(null);
    const [editPrueferName, setEditPrueferName] = useState('');
    const [editPrueferRolle, setEditPrueferRolle] = useState<Pruefer['rolle']>('Prüfer');

    const handleAddPruefer = () => {
        if (newPrueferName.trim()) {
            addPruefer(newPrueferName.trim(), newPrueferRolle);
            setNewPrueferName('');
            setNewPrueferRolle('Prüfer');
        }
    };

    const handleStartEditPruefer = (pruefer: Pruefer) => {
        setEditingPrueferId(pruefer.id);
        setEditPrueferName(pruefer.name);
        setEditPrueferRolle(pruefer.rolle || 'Prüfer');
    };

    const handleSaveEditPruefer = () => {
        if (editingPrueferId && editPrueferName.trim()) {
            updatePruefer(editingPrueferId, { name: editPrueferName.trim(), rolle: editPrueferRolle });
            setEditingPrueferId(null);
            setEditPrueferName('');
        }
    };

    const handleCancelEditPruefer = () => {
        setEditingPrueferId(null);
        setEditPrueferName('');
    };

    // State für beide Teile
    const sheetPart1 = data.sheets.find(s => s.id === 'part1')!;
    const sheetPart2 = data.sheets.find(s => s.id === 'part2')!;

    // Innung state - mit Auto-Save nach Debounce
    const [innung, setInnungLocal] = useState<Innung>(data.innung || DEFAULT_INNUNG);
    const [innungHasChanges, setInnungHasChanges] = useState(false);
    const innungSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Referenz für den letzten bekannten Store-Wert
    const lastStoreInnungRef = React.useRef<string>(JSON.stringify(data.innung));

    // Sync local innung state with store when data.innung changes (e.g., after page navigation)
    useEffect(() => {
        const currentStoreInnung = JSON.stringify(data.innung);
        // Nur synchronisieren wenn sich der Store-Wert tatsächlich geändert hat
        // und wir keine lokalen Änderungen haben
        if (!innungHasChanges && currentStoreInnung !== lastStoreInnungRef.current) {
            setInnungLocal(data.innung || DEFAULT_INNUNG);
            lastStoreInnungRef.current = currentStoreInnung;
        }
    }, [data.innung, innungHasChanges]);

    // Auto-Save für Innung: Speichert automatisch nach 1 Sekunde Inaktivität
    useEffect(() => {
        if (innungHasChanges) {
            // Bestehenden Timer löschen
            if (innungSaveTimeoutRef.current) {
                clearTimeout(innungSaveTimeoutRef.current);
            }
            // Neuen Timer setzen
            innungSaveTimeoutRef.current = setTimeout(() => {
                updateInnung(innung);
                setInnungHasChanges(false);
                lastStoreInnungRef.current = JSON.stringify(innung);
            }, 1000);
        }
        // Cleanup bei Unmount
        return () => {
            if (innungSaveTimeoutRef.current) {
                clearTimeout(innungSaveTimeoutRef.current);
            }
        };
    }, [innung, innungHasChanges, updateInnung]);

    // Bei Unmount sofort speichern wenn Änderungen vorhanden
    useEffect(() => {
        return () => {
            if (innungHasChanges) {
                updateInnung(innung);
            }
        };
    }, []);

    // Wrapper-Funktion für setInnung
    const setInnung = (value: Innung | ((prev: Innung) => Innung)) => {
        setInnungLocal(value);
    };

    // Grade scale state - mit Auto-Save nach Debounce
    const [gradeScale, setGradeScale] = useState<GradeScale>(data.gradeScale || DEFAULT_GRADE_SCALE);
    const gradeScaleSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const lastStoreGradeScaleRef = React.useRef<string>(JSON.stringify(data.gradeScale));

    // Sync gradeScale when store changes
    useEffect(() => {
        const currentStoreGradeScale = JSON.stringify(data.gradeScale);
        if (currentStoreGradeScale !== lastStoreGradeScaleRef.current) {
            setGradeScale(data.gradeScale || DEFAULT_GRADE_SCALE);
            lastStoreGradeScaleRef.current = currentStoreGradeScale;
        }
    }, [data.gradeScale]);

    const [part1Tasks, setPart1Tasks] = useState<GradingTask[]>(sheetPart1.tasks);
    const [part1ExamPiece, setPart1ExamPiece] = useState<GradingTask | undefined>(sheetPart1.examPiece);
    const [part1WorkTaskWeight, setPart1WorkTaskWeight] = useState(sheetPart1.workTaskWeight);
    const [part1ExamPieceWeight, setPart1ExamPieceWeight] = useState(sheetPart1.examPieceWeight);

    const [part2Tasks, setPart2Tasks] = useState<GradingTask[]>(sheetPart2.tasks);
    const [part2ExamPiece, setPart2ExamPiece] = useState<GradingTask | undefined>(sheetPart2.examPiece);
    const [part2WorkTaskWeight, setPart2WorkTaskWeight] = useState(sheetPart2.workTaskWeight);
    const [part2ExamPieceWeight, setPart2ExamPieceWeight] = useState(sheetPart2.examPieceWeight);
    const [part2TheorySubjects, setPart2TheorySubjects] = useState<TheorySubject[]>(sheetPart2.theorySubjects || []);

    const [hasChanges, setHasChanges] = useState(false);
    const [activeTab, setActiveTab] = useState<'part1' | 'part2'>('part1');
    const [structureUnlocked, setStructureUnlocked] = useState(false);

    // Prüfungsstruktur entsperren (passwortgeschützt)
    const handleUnlockStructure = async () => {
        try {
            await requestPassword(
                'Prüfungsstruktur bearbeiten',
                'Um die Prüfungsstruktur und Gewichtungen zu ändern, geben Sie bitte das Admin-Passwort ein.'
            );
            setStructureUnlocked(true);
        } catch {
            // Passwort-Dialog abgebrochen
        }
    };

    // --- Teil 1 Task Management ---
    const handlePart1TaskChange = (idx: number, field: keyof GradingTask, value: any) => {
        const newTasks = [...part1Tasks];
        newTasks[idx] = { ...newTasks[idx], [field]: value };
        setPart1Tasks(newTasks);
        setStructureHasChanges(true);
    };

    const addPart1Task = () => {
        setPart1Tasks([...part1Tasks, { id: crypto.randomUUID(), name: "Neue Aufgabe", maxPoints: 100, weight: 0.1 }]);
        setStructureHasChanges(true);
    };

    const removePart1Task = (idx: number) => {
        setPart1Tasks(part1Tasks.filter((_, i) => i !== idx));
        setStructureHasChanges(true);
    };

    // --- Teil 2 Task Management ---
    const handlePart2TaskChange = (idx: number, field: keyof GradingTask, value: any) => {
        const newTasks = [...part2Tasks];
        newTasks[idx] = { ...newTasks[idx], [field]: value };
        setPart2Tasks(newTasks);
        setStructureHasChanges(true);
    };

    const addPart2Task = () => {
        setPart2Tasks([...part2Tasks, { id: crypto.randomUUID(), name: "Neue Aufgabe", maxPoints: 100, weight: 0.1 }]);
        setStructureHasChanges(true);
    };

    const removePart2Task = (idx: number) => {
        setPart2Tasks(part2Tasks.filter((_, i) => i !== idx));
        setStructureHasChanges(true);
    };

    // --- Theorie Management ---
    const handleTheorySubjectChange = (idx: number, field: keyof TheorySubject, value: any) => {
        const newSubjects = [...part2TheorySubjects];
        newSubjects[idx] = { ...newSubjects[idx], [field]: value };
        setPart2TheorySubjects(newSubjects);
        setStructureHasChanges(true);
    };

    // --- Innung handlers ---
    const handleInnungChange = (field: keyof Innung, value: string) => {
        setInnung(prev => ({ ...prev, [field]: value }));
        setInnungHasChanges(true);
    };

    // --- Grade Scale handlers ---
    const [gradeScaleHasChanges, setGradeScaleHasChanges] = useState(false);
    const handleGradeScaleChange = (grade: keyof GradeScale, bound: 'min' | 'max', value: number) => {
        setGradeScale(prev => ({
            ...prev,
            [grade]: { ...prev[grade], [bound]: value }
        }));
        setGradeScaleHasChanges(true);
    };

    // Auto-Save für GradeScale: Speichert automatisch nach 1 Sekunde Inaktivität
    useEffect(() => {
        if (gradeScaleHasChanges) {
            // Bestehenden Timer löschen
            if (gradeScaleSaveTimeoutRef.current) {
                clearTimeout(gradeScaleSaveTimeoutRef.current);
            }
            // Neuen Timer setzen
            gradeScaleSaveTimeoutRef.current = setTimeout(() => {
                updateGradeScale(gradeScale);
                setGradeScaleHasChanges(false);
                lastStoreGradeScaleRef.current = JSON.stringify(gradeScale);
            }, 1000);
        }
        // Cleanup bei Unmount
        return () => {
            if (gradeScaleSaveTimeoutRef.current) {
                clearTimeout(gradeScaleSaveTimeoutRef.current);
            }
        };
    }, [gradeScale, gradeScaleHasChanges, updateGradeScale]);

    // Bei Unmount sofort speichern wenn Änderungen vorhanden
    useEffect(() => {
        return () => {
            if (gradeScaleHasChanges) {
                updateGradeScale(gradeScale);
            }
        };
    }, []);

    // --- Prüfungsstruktur Änderungs-Tracking ---
    const [structureHasChanges, setStructureHasChanges] = useState(false);

    // --- Lokale Speicher-Funktionen ---
    const saveInnung = () => {
        updateInnung(innung);
        setInnungHasChanges(false);
        lastStoreInnungRef.current = JSON.stringify(innung);
    };

    const saveGradeScale = () => {
        updateGradeScale(gradeScale);
        setGradeScaleHasChanges(false);
    };

    const saveStructure = () => {
        // Update Teil 1
        updateSheet({
            ...sheetPart1,
            tasks: part1Tasks,
            examPiece: part1ExamPiece,
            workTaskWeight: part1WorkTaskWeight,
            examPieceWeight: part1ExamPieceWeight
        });

        // Update Teil 2
        updateSheet({
            ...sheetPart2,
            tasks: part2Tasks,
            examPiece: part2ExamPiece,
            workTaskWeight: part2WorkTaskWeight,
            examPieceWeight: part2ExamPieceWeight,
            theorySubjects: part2TheorySubjects
        });

        setStructureHasChanges(false);
        setHasChanges(false);
    };

    // --- Bildkomprimierung für Gesellenbrief-Hintergrundbild ---
    const compressImage = (file: File, maxWidth = 2000, quality = 0.7): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Nur verkleinern wenn nötig
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Als JPEG komprimieren
                    const compressed = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressed);
                };
                img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
            reader.readAsDataURL(file);
        });
    };

    const handleCertificateImageUpload = async (file: File) => {
        try {
            // Bild komprimieren (max. 2000px Breite, 70% Qualität)
            const compressed = await compressImage(file);

            // Größe prüfen (Base64 ist ca. 33% größer als binär)
            const sizeKB = Math.round(compressed.length * 0.75 / 1024);

            if (sizeKB > 1500) {
                // Nochmal mit niedrigerer Qualität versuchen
                const moreCompressed = await compressImage(file, 1500, 0.5);
                const newSizeKB = Math.round(moreCompressed.length * 0.75 / 1024);

                if (newSizeKB > 1500) {
                    alert(`Das Bild ist mit ${newSizeKB}KB immer noch zu groß.\n\nBitte verwenden Sie ein kleineres Bild (max. ~1.5MB nach Komprimierung).`);
                    return;
                }

                setCertificateBackgroundImage(moreCompressed);
            } else {
                setCertificateBackgroundImage(compressed);
            }
        } catch (error) {
            console.error('Fehler beim Verarbeiten des Bildes:', error);
            alert('Fehler beim Verarbeiten des Bildes. Bitte versuchen Sie ein anderes Bild.');
        }
    };

    // --- Data Management ---
    const handleExport = () => {
        // Exportiere AppData + Gesellenbrief-Einstellungen
        const exportData = {
            ...data,
            // Gesellenbrief-Einstellungen aus GlobalSettings hinzufügen
            certificateBackgroundImage,
            certificatePositions,
            customTextFields
        };
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gp_digital_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target?.result as string) as AppData;
                if (Array.isArray(importedData.students) && Array.isArray(importedData.sheets)) {
                    if (confirm("Möchten Sie wirklich die vorhandenen Daten mit dem Backup überschreiben?")) {
                        if (importData) {
                            importData(importedData);
                            alert("Daten erfolgreich importiert!");
                            window.location.reload();
                        }
                    }
                } else {
                    alert("Ungültiges Dateiformat.");
                }
            } catch (error) {
                alert("Fehler beim Importieren der Datei.");
            }
        };
        reader.readAsText(file);
    };

    // Berechne Summe der Faktoren
    const part1WeightSum = part1Tasks.reduce((sum, t) => sum + t.weight, 0);
    const part2WeightSum = part2Tasks.reduce((sum, t) => sum + t.weight, 0);

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            {/* Header mit Liquid Metal Design */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 p-6 shadow-2xl">
                {/* Metallic Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-pulse" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                {/* Metallic Orbs */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-violet-400/20 via-purple-500/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-cyan-500/20 via-blue-400/10 to-transparent rounded-full blur-3xl" />

                <div className="relative z-10">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Einstellungen</h2>
                    <p className="text-slate-400 mt-1">Prüfungsstruktur und Datenverwaltung</p>
                </div>
            </div>

            {/* Data Import/Export - Chrome Style */}
            <div className="relative rounded-xl border border-slate-700 shadow-xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <button
                    onClick={() => toggleSection('data')}
                    className="w-full p-4 bg-gradient-to-b from-slate-700 to-slate-800 border-b border-slate-600 flex items-center gap-2 relative z-10 hover:from-slate-600 hover:to-slate-700 transition-colors"
                >
                    {expandedSections.data ? <ChevronDown className="text-slate-500" size={20} /> : <ChevronRight className="text-slate-500" size={20} />}
                    <HardDrive className="text-cyan-400" size={20} />
                    <h3 className="font-semibold text-slate-200">Datenverwaltung</h3>
                </button>
                {expandedSections.data && (
                <div className="p-6 flex flex-wrap gap-4 relative z-10">
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 text-slate-200 font-medium transition-colors">
                        <Download size={18} />
                        Daten Exportieren (Backup)
                    </button>

                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json,application/json" />
                    <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 text-slate-200 font-medium transition-colors">
                        <Upload size={18} />
                        Daten Importieren
                    </button>

                    <div className="flex-1" />

                    <button
                        onClick={handleResetData}
                        className="px-4 py-2 text-red-400 hover:bg-red-900/30 rounded-lg flex items-center gap-2 border border-red-500/30 transition-colors"
                    >
                        <RotateCcw size={18} />
                        Jahrgang zurücksetzen
                    </button>

                    <button
                        onClick={handleEmergencyReset}
                        className="px-4 py-2 text-red-300 hover:bg-red-900/40 rounded-lg flex items-center gap-2 border border-red-500/50 bg-red-900/30 transition-colors"
                        title="Nur verwenden wenn die App nicht mehr funktioniert"
                    >
                        <AlertTriangle size={18} />
                        Notfall-Reset
                    </button>
                </div>
                )}
            </div>

            {/* Admin Password - Chrome Style */}
            <div className="relative rounded-xl border border-slate-700 shadow-xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <button
                    onClick={() => toggleSection('adminPassword')}
                    className="w-full p-4 bg-gradient-to-b from-slate-700 to-slate-800 border-b border-slate-600 flex items-center gap-2 relative z-10 hover:from-slate-600 hover:to-slate-700 transition-colors"
                >
                    {expandedSections.adminPassword ? <ChevronDown className="text-slate-500" size={20} /> : <ChevronRight className="text-slate-500" size={20} />}
                    <Lock className="text-cyan-400" size={20} />
                    <h3 className="font-semibold text-slate-200">Administrations-Passwort</h3>
                    {adminPasswordHash && <span className="ml-2 text-xs text-emerald-400">✓ gesetzt</span>}
                </button>
                {expandedSections.adminPassword && (
                <div className="p-6 space-y-4 relative z-10">
                    <p className="text-sm text-slate-400">
                        Dieses Passwort wird für das Löschen von Prüflingen, Jahrgängen und anderen destruktiven Aktionen benötigt.
                        {adminPasswordHash ? (
                            <span className="ml-2 text-emerald-400 font-medium">Passwort ist gesetzt.</span>
                        ) : (
                            <span className="ml-2 text-amber-400 font-medium">Kein Passwort gesetzt!</span>
                        )}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Neues Passwort</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg pr-10 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                                    placeholder="Mindestens 4 Zeichen"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Passwort bestätigen</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                                placeholder="Passwort wiederholen"
                            />
                        </div>
                    </div>

                    {passwordError && (
                        <p className="text-sm text-red-400">{passwordError}</p>
                    )}
                    {passwordSuccess && (
                        <p className="text-sm text-emerald-400">{passwordSuccess}</p>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleSetPassword}
                            disabled={!newPassword || !confirmPassword}
                            className="relative px-4 py-2 bg-gradient-to-b from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                        >
                            <Lock size={16} />
                            Passwort {adminPasswordHash ? 'ändern' : 'setzen'}
                        </button>

                        {adminPasswordHash && (
                            <button
                                onClick={handleRemovePassword}
                                className="px-4 py-2 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-900/30 flex items-center gap-2 transition-colors"
                            >
                                <Trash2 size={16} />
                                Passwort-Schutz deaktivieren
                            </button>
                        )}
                    </div>
                </div>
                )}
            </div>

            {/* Mitarbeiter-Passwort - Chrome Style */}
            <div className="relative rounded-xl border border-slate-700 shadow-xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <button
                    onClick={() => toggleSection('mitarbeiterPassword')}
                    className="w-full p-4 bg-gradient-to-b from-slate-700 to-slate-800 border-b border-slate-600 flex items-center gap-2 relative z-10 hover:from-slate-600 hover:to-slate-700 transition-colors"
                >
                    {expandedSections.mitarbeiterPassword ? <ChevronDown className="text-slate-500" size={20} /> : <ChevronRight className="text-slate-500" size={20} />}
                    <Users className="text-cyan-400" size={20} />
                    <h3 className="font-semibold text-slate-200">Mitarbeiter-Passwort</h3>
                    {mitarbeiterPasswordHash && <span className="ml-2 text-xs text-emerald-400">✓ gesetzt</span>}
                </button>
                {expandedSections.mitarbeiterPassword && (
                <div className="p-6 space-y-4 relative z-10">
                    <p className="text-sm text-slate-400">
                        Mitarbeiter haben eingeschränkten Zugriff: Sie können Noten eintragen und Gesellenbriefe drucken,
                        aber keine Prüflinge löschen oder Einstellungen ändern.
                        {mitarbeiterPasswordHash ? (
                            <span className="ml-2 text-emerald-400 font-medium">Mitarbeiter-Passwort ist gesetzt.</span>
                        ) : (
                            <span className="ml-2 text-amber-400 font-medium">Kein Mitarbeiter-Passwort gesetzt.</span>
                        )}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Neues Mitarbeiter-Passwort</label>
                            <div className="relative">
                                <input
                                    type={showMitarbeiterPassword ? 'text' : 'password'}
                                    value={newMitarbeiterPassword}
                                    onChange={(e) => { setNewMitarbeiterPassword(e.target.value); setMitarbeiterPasswordError(''); }}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg pr-10 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                                    placeholder="Mindestens 4 Zeichen"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowMitarbeiterPassword(!showMitarbeiterPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showMitarbeiterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Passwort bestätigen</label>
                            <input
                                type={showMitarbeiterPassword ? 'text' : 'password'}
                                value={confirmMitarbeiterPassword}
                                onChange={(e) => { setConfirmMitarbeiterPassword(e.target.value); setMitarbeiterPasswordError(''); }}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                                placeholder="Passwort wiederholen"
                            />
                        </div>
                    </div>

                    {mitarbeiterPasswordError && (
                        <p className="text-sm text-red-400">{mitarbeiterPasswordError}</p>
                    )}
                    {mitarbeiterPasswordSuccess && (
                        <p className="text-sm text-emerald-400">{mitarbeiterPasswordSuccess}</p>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleSetMitarbeiterPassword}
                            disabled={!newMitarbeiterPassword || !confirmMitarbeiterPassword}
                            className="relative px-4 py-2 bg-gradient-to-b from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                        >
                            <Users size={16} />
                            Passwort {mitarbeiterPasswordHash ? 'ändern' : 'setzen'}
                        </button>

                        {mitarbeiterPasswordHash && (
                            <button
                                onClick={handleRemoveMitarbeiterPassword}
                                className="px-4 py-2 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-900/30 flex items-center gap-2 transition-colors"
                            >
                                <Trash2 size={16} />
                                Mitarbeiter-Zugang deaktivieren
                            </button>
                        )}
                    </div>
                </div>
                )}
            </div>

            {/* Prüferpool - Chrome Style */}
            <div className="relative rounded-xl border border-slate-700 shadow-xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <button
                    onClick={() => toggleSection('prueferpool')}
                    className="w-full p-4 bg-gradient-to-b from-slate-700 to-slate-800 border-b border-slate-600 flex items-center gap-2 relative z-10 hover:from-slate-600 hover:to-slate-700 transition-colors"
                >
                    {expandedSections.prueferpool ? <ChevronDown className="text-slate-500" size={20} /> : <ChevronRight className="text-slate-500" size={20} />}
                    <Users className="text-cyan-400" size={20} />
                    <h3 className="font-semibold text-slate-200">Prüferpool</h3>
                    <span className="ml-auto text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded border border-slate-600">{prueferpool.length} Prüfer</span>
                </button>
                {expandedSections.prueferpool && (
                <div className="p-6 space-y-4 relative z-10">
                    <p className="text-sm text-slate-400">
                        Verwalten Sie hier alle Prüfer, die für Prüfungen zur Verfügung stehen.
                        Diese können dann bei der Benotung aus einer Liste ausgewählt werden.
                    </p>

                    {/* Liste der Prüfer */}
                    {prueferpool.length > 0 ? (
                        <div className="space-y-2">
                            {prueferpool.map((pruefer) => (
                                <div
                                    key={pruefer.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border ${pruefer.isActive ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-800/50 border-slate-700 opacity-60'}`}
                                >
                                    {editingPrueferId === pruefer.id ? (
                                        // Edit mode
                                        <>
                                            <input
                                                type="text"
                                                className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200 focus:border-cyan-500"
                                                value={editPrueferName}
                                                onChange={(e) => setEditPrueferName(e.target.value)}
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveEditPruefer();
                                                    if (e.key === 'Escape') handleCancelEditPruefer();
                                                }}
                                            />
                                            <select
                                                className="p-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200 focus:border-cyan-500"
                                                value={editPrueferRolle}
                                                onChange={(e) => setEditPrueferRolle(e.target.value as Pruefer['rolle'])}
                                            >
                                                <option value="Vorsitzender">Vorsitzender</option>
                                                <option value="Prüfer">Prüfer</option>
                                                <option value="Beisitzer">Beisitzer</option>
                                            </select>
                                            <button
                                                onClick={handleSaveEditPruefer}
                                                className="p-2 text-emerald-400 hover:bg-emerald-900/30 rounded-lg transition-colors"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={handleCancelEditPruefer}
                                                className="p-2 text-slate-500 hover:bg-slate-700 rounded-lg transition-colors"
                                            >
                                                <X size={18} />
                                            </button>
                                        </>
                                    ) : (
                                        // View mode
                                        <>
                                            <div className="flex-1">
                                                <span className="font-medium text-slate-200">{pruefer.name}</span>
                                                {pruefer.rolle && (
                                                    <span className={`ml-2 text-xs px-2 py-0.5 rounded border ${
                                                        pruefer.rolle === 'Vorsitzender'
                                                            ? 'bg-violet-900/30 text-violet-300 border-violet-500/30'
                                                            : pruefer.rolle === 'Beisitzer'
                                                            ? 'bg-slate-700 text-slate-400 border-slate-600'
                                                            : 'bg-cyan-900/30 text-cyan-300 border-cyan-500/30'
                                                    }`}>
                                                        {pruefer.rolle}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => updatePruefer(pruefer.id, { isActive: !pruefer.isActive })}
                                                className={`text-xs px-2 py-1 rounded border transition-colors ${pruefer.isActive ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' : 'bg-slate-700 text-slate-500 border-slate-600'}`}
                                            >
                                                {pruefer.isActive ? 'Aktiv' : 'Inaktiv'}
                                            </button>
                                            <button
                                                onClick={() => handleStartEditPruefer(pruefer)}
                                                className="p-2 text-slate-500 hover:text-cyan-400 hover:bg-cyan-900/30 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => deletePruefer(pruefer.id)}
                                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Users size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Noch keine Prüfer angelegt</p>
                        </div>
                    )}

                    {/* Neuen Prüfer hinzufügen */}
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-700">
                        <input
                            type="text"
                            className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500"
                            placeholder="Name des Prüfers"
                            value={newPrueferName}
                            onChange={(e) => setNewPrueferName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddPruefer();
                            }}
                        />
                        <select
                            className="p-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200 focus:border-cyan-500"
                            value={newPrueferRolle}
                            onChange={(e) => setNewPrueferRolle(e.target.value as Pruefer['rolle'])}
                        >
                            <option value="Vorsitzender">Vorsitzender</option>
                            <option value="Prüfer">Prüfer</option>
                            <option value="Beisitzer">Beisitzer</option>
                        </select>
                        <button
                            onClick={handleAddPruefer}
                            disabled={!newPrueferName.trim()}
                            className="relative px-4 py-2 bg-gradient-to-b from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                        >
                            <UserPlus size={18} />
                            Hinzufügen
                        </button>
                    </div>
                </div>
                )}
            </div>

            {/* Innung Configuration - Chrome Style */}
            <div className="relative rounded-xl border border-slate-700 shadow-xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <button
                    onClick={() => toggleSection('innung')}
                    className="w-full p-4 bg-gradient-to-b from-slate-700 to-slate-800 border-b border-slate-600 flex items-center gap-2 relative z-10 hover:from-slate-600 hover:to-slate-700 transition-colors"
                >
                    {expandedSections.innung ? <ChevronDown className="text-slate-500" size={20} /> : <ChevronRight className="text-slate-500" size={20} />}
                    <Building2 className="text-cyan-400" size={20} />
                    <h3 className="font-semibold text-slate-200">Innung / Prüfungsausschuss</h3>
                    <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={saveInnung}
                            disabled={!innungHasChanges}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${innungHasChanges
                                ? "bg-gradient-to-b from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25"
                                : "bg-slate-600/50 text-slate-500 cursor-default border border-slate-600"
                            }`}
                        >
                            <Save size={14} />
                            Speichern
                        </button>
                    </div>
                </button>
                {expandedSections.innung && (
                <div className="p-6 space-y-4 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1">Name der Innung</label>
                            <input
                                type="text"
                                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-cyan-500"
                                placeholder="z.B. Friseur-Innung Köln"
                                value={innung.name}
                                onChange={(e) => handleInnungChange('name', e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1">Straße und Hausnummer</label>
                            <input
                                type="text"
                                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-cyan-500"
                                placeholder="z.B. Musterstraße 123"
                                value={innung.street}
                                onChange={(e) => handleInnungChange('street', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">PLZ und Ort</label>
                            <input
                                type="text"
                                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-cyan-500"
                                placeholder="z.B. 50667 Köln"
                                value={innung.zipCity}
                                onChange={(e) => handleInnungChange('zipCity', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Telefon (optional)</label>
                            <input
                                type="text"
                                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-cyan-500"
                                placeholder="z.B. 0221 12345678"
                                value={innung.phone || ''}
                                onChange={(e) => handleInnungChange('phone', e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1">E-Mail (optional)</label>
                            <input
                                type="email"
                                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-cyan-500"
                                placeholder="z.B. info@friseur-innung-koeln.de"
                                value={innung.email || ''}
                                onChange={(e) => handleInnungChange('email', e.target.value)}
                            />
                        </div>

                        {/* Innungs-Logo */}
                        <div className="md:col-span-2 pt-4 border-t border-slate-700">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Innungs-Logo (für PDFs)</label>
                            <div className="flex items-start gap-4">
                                {innung.logo ? (
                                    <div className="relative w-24 h-24 border border-slate-600 rounded-lg overflow-hidden bg-slate-700 flex items-center justify-center">
                                        <img src={innung.logo} alt="Innungs-Logo" className="max-w-full max-h-full object-contain" />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center bg-slate-800 text-slate-500 text-xs text-center p-2">
                                        Kein Logo
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="cursor-pointer px-4 py-2 border border-slate-600 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium inline-flex items-center gap-2 text-sm transition-colors">
                                        <Upload size={16} />
                                        Logo hochladen
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => {
                                                        const result = ev.target?.result as string;
                                                        setInnung(prev => ({ ...prev, logo: result }));
                                                        setInnungHasChanges(true);
                                                        setHasChanges(true);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                    <p className="text-xs text-slate-500">
                                        PNG oder JPG empfohlen. Wird in Gesamtniederschrift und Prüfungszeugnis angezeigt.
                                    </p>
                                    {innung.logo && (
                                        <button
                                            onClick={() => {
                                                setInnung(prev => ({ ...prev, logo: undefined }));
                                                setInnungHasChanges(true);
                                                setHasChanges(true);
                                            }}
                                            className="text-xs text-red-400 hover:text-red-300 underline"
                                        >
                                            Logo entfernen
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>

            {/* Notenschlüssel Configuration - Chrome Style */}
            <div className="relative rounded-xl border border-slate-700 shadow-xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <button
                    onClick={() => toggleSection('gradeScale')}
                    className="w-full p-4 bg-gradient-to-b from-slate-700 to-slate-800 border-b border-slate-600 flex items-center gap-2 relative z-10 hover:from-slate-600 hover:to-slate-700 transition-colors"
                >
                    {expandedSections.gradeScale ? <ChevronDown className="text-slate-500" size={20} /> : <ChevronRight className="text-slate-500" size={20} />}
                    <Scale className="text-cyan-400" size={20} />
                    <h3 className="font-semibold text-slate-200">Notenschlüssel (Punktegrenzen)</h3>
                    <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={saveGradeScale}
                            disabled={!gradeScaleHasChanges}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${gradeScaleHasChanges
                                ? "bg-gradient-to-b from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25"
                                : "bg-slate-600/50 text-slate-500 cursor-default border border-slate-600"
                            }`}
                        >
                            <Save size={14} />
                            Speichern
                        </button>
                        {!structureUnlocked ? (
                            <button
                                onClick={handleUnlockStructure}
                                className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/50 text-amber-300 rounded-lg hover:bg-amber-800/50 text-sm font-medium border border-amber-500/30 transition-colors"
                            >
                                <Lock size={14} />
                                Entsperren
                            </button>
                        ) : (
                            <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-900/50 text-emerald-300 rounded-lg text-sm font-medium border border-emerald-500/30">
                                <Check size={14} />
                                Aktiv
                            </span>
                        )}
                    </div>
                </button>
                {expandedSections.gradeScale && (
                <>
                {/* Overlay wenn gesperrt */}
                {!structureUnlocked && (
                    <div className="absolute inset-0 top-[52px] bg-slate-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="text-center p-6">
                            <Lock size={32} className="mx-auto text-slate-500 mb-2" />
                            <p className="text-slate-400 text-sm">Passwort erforderlich</p>
                        </div>
                    </div>
                )}

                <div className="p-6 relative z-[5]">
                    <p className="text-sm text-slate-400 mb-4">
                        Definieren Sie die Punktegrenzen für jede Note. Die Werte werden auf dem Prüfungszeugnis angezeigt.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {/* sehr gut */}
                        <div className="p-3 bg-emerald-900/30 rounded-lg border border-emerald-500/30">
                            <div className="text-center mb-2">
                                <span className="text-lg font-bold text-emerald-400">1</span>
                                <p className="text-xs text-emerald-300">sehr gut</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                                <input
                                    type="number"
                                    className="w-12 p-1 bg-slate-700 border border-slate-600 rounded text-center text-xs text-slate-200"
                                    value={gradeScale.sehrGut.min}
                                    onChange={(e) => handleGradeScaleChange('sehrGut', 'min', Number(e.target.value))}
                                />
                                <span className="text-slate-500">-</span>
                                <input
                                    type="number"
                                    className="w-12 p-1 bg-slate-700 border border-slate-600 rounded text-center text-xs text-slate-200"
                                    value={gradeScale.sehrGut.max}
                                    onChange={(e) => handleGradeScaleChange('sehrGut', 'max', Number(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* gut */}
                        <div className="p-3 bg-lime-900/30 rounded-lg border border-lime-500/30">
                            <div className="text-center mb-2">
                                <span className="text-lg font-bold text-lime-400">2</span>
                                <p className="text-xs text-lime-300">gut</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                                <input
                                    type="number"
                                    className="w-12 p-1 bg-slate-700 border border-slate-600 rounded text-center text-xs text-slate-200"
                                    value={gradeScale.gut.min}
                                    onChange={(e) => handleGradeScaleChange('gut', 'min', Number(e.target.value))}
                                />
                                <span className="text-slate-500">-</span>
                                <input
                                    type="number"
                                    className="w-12 p-1 bg-slate-700 border border-slate-600 rounded text-center text-xs text-slate-200"
                                    value={gradeScale.gut.max}
                                    onChange={(e) => handleGradeScaleChange('gut', 'max', Number(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* befriedigend */}
                        <div className="p-3 bg-yellow-900/30 rounded-lg border border-yellow-500/30">
                            <div className="text-center mb-2">
                                <span className="text-lg font-bold text-yellow-400">3</span>
                                <p className="text-xs text-yellow-300">befriedigend</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                                <input
                                    type="number"
                                    className="w-12 p-1 bg-slate-700 border border-slate-600 rounded text-center text-xs text-slate-200"
                                    value={gradeScale.befriedigend.min}
                                    onChange={(e) => handleGradeScaleChange('befriedigend', 'min', Number(e.target.value))}
                                />
                                <span className="text-slate-500">-</span>
                                <input
                                    type="number"
                                    className="w-12 p-1 bg-slate-700 border border-slate-600 rounded text-center text-xs text-slate-200"
                                    value={gradeScale.befriedigend.max}
                                    onChange={(e) => handleGradeScaleChange('befriedigend', 'max', Number(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* ausreichend */}
                        <div className="p-3 bg-orange-900/30 rounded-lg border border-orange-500/30">
                            <div className="text-center mb-2">
                                <span className="text-lg font-bold text-orange-400">4</span>
                                <p className="text-xs text-orange-300">ausreichend</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                                <input
                                    type="number"
                                    className="w-12 p-1 bg-slate-700 border border-slate-600 rounded text-center text-xs text-slate-200"
                                    value={gradeScale.ausreichend.min}
                                    onChange={(e) => handleGradeScaleChange('ausreichend', 'min', Number(e.target.value))}
                                />
                                <span className="text-slate-500">-</span>
                                <input
                                    type="number"
                                    className="w-12 p-1 bg-slate-700 border border-slate-600 rounded text-center text-xs text-slate-200"
                                    value={gradeScale.ausreichend.max}
                                    onChange={(e) => handleGradeScaleChange('ausreichend', 'max', Number(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* mangelhaft */}
                        <div className="p-3 bg-red-900/30 rounded-lg border border-red-500/30">
                            <div className="text-center mb-2">
                                <span className="text-lg font-bold text-red-400">5</span>
                                <p className="text-xs text-red-300">mangelhaft</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                                <input
                                    type="number"
                                    className="w-12 p-1 bg-slate-700 border border-slate-600 rounded text-center text-xs text-slate-200"
                                    value={gradeScale.mangelhaft.min}
                                    onChange={(e) => handleGradeScaleChange('mangelhaft', 'min', Number(e.target.value))}
                                />
                                <span className="text-slate-500">-</span>
                                <input
                                    type="number"
                                    className="w-12 p-1 bg-slate-700 border border-slate-600 rounded text-center text-xs text-slate-200"
                                    value={gradeScale.mangelhaft.max}
                                    onChange={(e) => handleGradeScaleChange('mangelhaft', 'max', Number(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* ungenügend */}
                        <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                            <div className="text-center mb-2">
                                <span className="text-lg font-bold text-slate-400">6</span>
                                <p className="text-xs text-slate-500">ungenügend</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                                <input
                                    type="number"
                                    className="w-12 p-1 bg-slate-700 border border-slate-600 rounded text-center text-xs text-slate-200"
                                    value={gradeScale.ungenuegend.min}
                                    onChange={(e) => handleGradeScaleChange('ungenuegend', 'min', Number(e.target.value))}
                                />
                                <span className="text-slate-500">-</span>
                                <input
                                    type="number"
                                    className="w-12 p-1 bg-slate-700 border border-slate-600 rounded text-center text-xs text-slate-200"
                                    value={gradeScale.ungenuegend.max}
                                    onChange={(e) => handleGradeScaleChange('ungenuegend', 'max', Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                </>
                )}
            </div>

            {/* Certificate Configuration - Chrome Style */}
            <div className="relative rounded-xl border border-slate-700 shadow-xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <button
                    onClick={() => toggleSection('certificate')}
                    className="w-full p-4 bg-gradient-to-b from-slate-700 to-slate-800 border-b border-slate-600 flex items-center gap-2 relative z-10 hover:from-slate-600 hover:to-slate-700 transition-colors"
                >
                    {expandedSections.certificate ? <ChevronDown className="text-slate-500" size={20} /> : <ChevronRight className="text-slate-500" size={20} />}
                    <FileText className="text-cyan-400" size={20} />
                    <h3 className="font-semibold text-slate-200">Gesellenbrief Design</h3>
                    {certificateBackgroundImage && <span className="ml-2 text-xs text-emerald-400">✓ Bild gesetzt</span>}
                </button>
                {expandedSections.certificate && (
                <div className="p-6 space-y-4 relative z-10">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">Hintergrundbild (A4 Format)</label>
                        <div className="flex items-center gap-4">
                            {certificateBackgroundImage ? (
                                <div className="relative w-32 h-44 border border-slate-600 rounded-md overflow-hidden bg-slate-700">
                                    <img src={certificateBackgroundImage} alt="Preview" className="w-full h-full object-cover opacity-50" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-bold text-slate-400">Vorschau</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-32 h-44 border-2 border-dashed border-slate-600 rounded-md flex items-center justify-center bg-slate-800 text-slate-500 text-xs text-center p-2">
                                    Kein Bild ausgewählt
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="cursor-pointer px-4 py-2 border border-slate-600 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium inline-flex items-center gap-2 transition-colors">
                                    <Upload size={16} />
                                    Bild hochladen
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleCertificateImageUpload(file);
                                            }
                                        }}
                                    />
                                </label>
                                <p className="text-xs text-slate-500 max-w-xs">
                                    Laden Sie hier das Hintergrundbild Ihrer Innung hoch (JPG/PNG). Das Bild wird automatisch komprimiert.
                                </p>
                                {certificateBackgroundImage && (
                                    <button
                                        onClick={() => setCertificateBackgroundImage(undefined)}
                                        className="text-xs text-red-400 hover:text-red-300 underline"
                                    >
                                        Bild entfernen
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>

            {/* Prüfungsstruktur - Chrome Style */}
            <div className="relative rounded-xl border border-slate-700 shadow-xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <button
                    onClick={() => toggleSection('structure')}
                    className="w-full p-4 bg-gradient-to-b from-slate-700 to-slate-800 border-b border-slate-600 flex items-center gap-2 relative z-10 hover:from-slate-600 hover:to-slate-700 transition-colors"
                >
                    {expandedSections.structure ? <ChevronDown className="text-slate-500" size={20} /> : <ChevronRight className="text-slate-500" size={20} />}
                    <Settings2 className="text-cyan-400" size={20} />
                    <h3 className="font-semibold text-slate-200">Prüfungsstruktur & Gewichtungen</h3>
                    <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={saveStructure}
                            disabled={!structureHasChanges}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${structureHasChanges
                                ? "bg-gradient-to-b from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25"
                                : "bg-slate-600/50 text-slate-500 cursor-default border border-slate-600"
                            }`}
                        >
                            <Save size={14} />
                            Speichern
                        </button>
                        {!structureUnlocked ? (
                            <button
                                onClick={handleUnlockStructure}
                                className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/50 text-amber-300 rounded-lg hover:bg-amber-800/50 text-sm font-medium border border-amber-500/30 transition-colors"
                            >
                                <Lock size={14} />
                                Entsperren zum Bearbeiten
                            </button>
                        ) : (
                            <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-900/50 text-emerald-300 rounded-lg text-sm font-medium border border-emerald-500/30">
                                <Check size={14} />
                                Bearbeitung aktiv
                            </span>
                        )}
                    </div>
                </button>
                {expandedSections.structure && (
                <>
                {/* Overlay wenn gesperrt */}
                {!structureUnlocked && (
                    <div className="absolute inset-0 top-[52px] bg-slate-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="text-center p-6">
                            <Lock size={48} className="mx-auto text-slate-500 mb-4" />
                            <p className="text-slate-300 font-medium">Prüfungsstruktur ist geschützt</p>
                            <p className="text-sm text-slate-500 mt-1">Klicken Sie oben auf "Entsperren" um Änderungen vorzunehmen</p>
                        </div>
                    </div>
                )}

                {/* Info Box */}
                <div className="p-4 bg-cyan-900/30 border-b border-cyan-700/30 relative z-[5]">
                    <p className="text-sm text-cyan-200">
                        <strong>Gesamtergebnis:</strong> Teil 1 zählt <strong>25%</strong>, Teil 2 zählt <strong>75%</strong> der Gesamtpunktzahl.
                        <br />
                        Bestehensgrenze: <strong>50 von 100 Punkten</strong> (50%) - "Wenn jeder Prüfer 50 Punkte gibt, besteht man"
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700 relative z-[5]">
                    <button
                        onClick={() => setActiveTab('part1')}
                        className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${activeTab === 'part1'
                            ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-b-2 border-cyan-500'
                            : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'
                            }`}
                    >
                        Teil 1 der Gesellenprüfung (25%)
                    </button>
                    <button
                        onClick={() => setActiveTab('part2')}
                        className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${activeTab === 'part2'
                            ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-b-2 border-cyan-500'
                            : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'
                            }`}
                    >
                        Teil 2 der Gesellenprüfung (75%)
                    </button>
                </div>

                {/* Teil 1 Content */}
                {activeTab === 'part1' && (
                    <div className="p-6 space-y-6 relative z-[5]">
                        {/* Gewichtungen */}
                        <div className="bg-slate-700/50 p-4 rounded-lg space-y-4 border border-slate-600/50">
                            <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                                <GraduationCap size={18} className="text-cyan-400" />
                                Gewichtung Praxis
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Arbeitsaufgaben</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="1"
                                            className="w-24 p-2 bg-slate-700 border border-slate-600 rounded-lg text-center text-slate-200"
                                            value={part1WorkTaskWeight}
                                            onChange={(e) => { setPart1WorkTaskWeight(Number(e.target.value)); setStructureHasChanges(true); }}
                                        />
                                        <span className="text-slate-400">= {(part1WorkTaskWeight * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Prüfungsstück</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="1"
                                            className="w-24 p-2 bg-slate-700 border border-slate-600 rounded-lg text-center text-slate-200"
                                            value={part1ExamPieceWeight}
                                            onChange={(e) => { setPart1ExamPieceWeight(Number(e.target.value)); setStructureHasChanges(true); }}
                                        />
                                        <span className="text-slate-400">= {(part1ExamPieceWeight * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            </div>
                            {Math.abs(part1WorkTaskWeight + part1ExamPieceWeight - 1) > 0.01 && (
                                <p className="text-sm text-red-400">Summe sollte 1.0 (100%) ergeben!</p>
                            )}
                        </div>

                        {/* Arbeitsaufgaben */}
                        <div>
                            <h4 className="font-semibold text-slate-200 mb-3">Arbeitsaufgaben (Faktor-Summe: {part1WeightSum.toFixed(2)})</h4>
                            {Math.abs(part1WeightSum - 1) > 0.01 && (
                                <p className="text-sm text-amber-400 mb-2">Hinweis: Die Summe der Faktoren sollte idealerweise 1.0 ergeben.</p>
                            )}
                            <div className="space-y-2">
                                {part1Tasks.map((task, idx) => (
                                    <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                                        <span className="text-slate-500 font-mono text-sm w-6">{idx + 1}.</span>
                                        <input
                                            className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-200"
                                            value={task.name}
                                            onChange={(e) => handlePart1TaskChange(idx, 'name', e.target.value)}
                                        />
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-slate-500">Max:</span>
                                            <input
                                                type="number"
                                                className="w-16 p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-center text-slate-200"
                                                value={task.maxPoints}
                                                onChange={(e) => handlePart1TaskChange(idx, 'maxPoints', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-slate-500">Faktor:</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-20 p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-center text-slate-200"
                                                value={task.weight}
                                                onChange={(e) => handlePart1TaskChange(idx, 'weight', Number(e.target.value))}
                                            />
                                        </div>
                                        <button
                                            onClick={() => removePart1Task(idx)}
                                            className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={addPart1Task}
                                className="mt-3 w-full py-2 border-2 border-dashed border-slate-600 rounded-lg text-slate-500 hover:border-cyan-500/50 hover:text-cyan-400 flex items-center justify-center gap-2 text-sm transition-colors"
                            >
                                <Plus size={16} /> Aufgabe hinzufügen
                            </button>
                        </div>

                        {/* Prüfungsstück */}
                        <div>
                            <h4 className="font-semibold text-slate-200 mb-3">Prüfungsstück</h4>
                            {part1ExamPiece && (
                                <div className="flex items-center gap-3 p-3 bg-amber-900/30 rounded-lg border border-amber-500/30">
                                    <GraduationCap size={18} className="text-amber-400" />
                                    <input
                                        className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-200"
                                        value={part1ExamPiece.name}
                                        onChange={(e) => { setPart1ExamPiece({ ...part1ExamPiece, name: e.target.value }); setStructureHasChanges(true); }}
                                    />
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-slate-500">Max:</span>
                                        <input
                                            type="number"
                                            className="w-16 p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-center text-slate-200"
                                            value={part1ExamPiece.maxPoints}
                                            onChange={(e) => { setPart1ExamPiece({ ...part1ExamPiece, maxPoints: Number(e.target.value) }); setStructureHasChanges(true); }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Teil 2 Content */}
                {activeTab === 'part2' && (
                    <div className="p-6 space-y-6 relative z-[5]">
                        {/* Gewichtungen */}
                        <div className="bg-slate-700/50 p-4 rounded-lg space-y-4 border border-slate-600/50">
                            <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                                <GraduationCap size={18} className="text-cyan-400" />
                                Gewichtung Praxis (Friseur- und Kosmetikdienstleistungen)
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Arbeitsaufgaben</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="1"
                                            className="w-24 p-2 bg-slate-700 border border-slate-600 rounded-lg text-center text-slate-200"
                                            value={part2WorkTaskWeight}
                                            onChange={(e) => { setPart2WorkTaskWeight(Number(e.target.value)); setStructureHasChanges(true); }}
                                        />
                                        <span className="text-slate-400">= {(part2WorkTaskWeight * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Prüfungsstück</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="1"
                                            className="w-24 p-2 bg-slate-700 border border-slate-600 rounded-lg text-center text-slate-200"
                                            value={part2ExamPieceWeight}
                                            onChange={(e) => { setPart2ExamPieceWeight(Number(e.target.value)); setStructureHasChanges(true); }}
                                        />
                                        <span className="text-slate-400">= {(part2ExamPieceWeight * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            </div>
                            {Math.abs(part2WorkTaskWeight + part2ExamPieceWeight - 1) > 0.01 && (
                                <p className="text-sm text-red-400">Summe sollte 1.0 (100%) ergeben!</p>
                            )}
                        </div>

                        {/* Arbeitsaufgaben */}
                        <div>
                            <h4 className="font-semibold text-slate-200 mb-3">Arbeitsaufgaben (Faktor-Summe: {part2WeightSum.toFixed(2)})</h4>
                            {Math.abs(part2WeightSum - 1) > 0.01 && (
                                <p className="text-sm text-amber-400 mb-2">Hinweis: Die Summe der Faktoren sollte idealerweise 1.0 ergeben.</p>
                            )}
                            <div className="space-y-2">
                                {part2Tasks.map((task, idx) => (
                                    <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                                        <span className="text-slate-500 font-mono text-sm w-6">{idx + 1}.</span>
                                        <input
                                            className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-200"
                                            value={task.name}
                                            onChange={(e) => handlePart2TaskChange(idx, 'name', e.target.value)}
                                        />
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-slate-500">Max:</span>
                                            <input
                                                type="number"
                                                className="w-16 p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-center text-slate-200"
                                                value={task.maxPoints}
                                                onChange={(e) => handlePart2TaskChange(idx, 'maxPoints', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-slate-500">Faktor:</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-20 p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-center text-slate-200"
                                                value={task.weight}
                                                onChange={(e) => handlePart2TaskChange(idx, 'weight', Number(e.target.value))}
                                            />
                                        </div>
                                        <button
                                            onClick={() => removePart2Task(idx)}
                                            className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={addPart2Task}
                                className="mt-3 w-full py-2 border-2 border-dashed border-slate-600 rounded-lg text-slate-500 hover:border-cyan-500/50 hover:text-cyan-400 flex items-center justify-center gap-2 text-sm transition-colors"
                            >
                                <Plus size={16} /> Aufgabe hinzufügen
                            </button>
                        </div>

                        {/* Prüfungsstück */}
                        <div>
                            <h4 className="font-semibold text-slate-200 mb-3">Prüfungsstück</h4>
                            {part2ExamPiece && (
                                <div className="flex items-center gap-3 p-3 bg-amber-900/30 rounded-lg border border-amber-500/30">
                                    <GraduationCap size={18} className="text-amber-400" />
                                    <input
                                        className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-200"
                                        value={part2ExamPiece.name}
                                        onChange={(e) => { setPart2ExamPiece({ ...part2ExamPiece, name: e.target.value }); setStructureHasChanges(true); }}
                                    />
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-slate-500">Max:</span>
                                        <input
                                            type="number"
                                            className="w-16 p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-center text-slate-200"
                                            value={part2ExamPiece.maxPoints}
                                            onChange={(e) => { setPart2ExamPiece({ ...part2ExamPiece, maxPoints: Number(e.target.value) }); setStructureHasChanges(true); }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Theorie */}
                        <div>
                            <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                                <BookOpen size={18} className="text-emerald-400" />
                                Theorieprüfung (Schriftlich ×2, Mündlich ×1)
                            </h4>
                            <div className="space-y-2">
                                {part2TheorySubjects.map((subject, idx) => (
                                    <div key={subject.id} className="flex items-center gap-3 p-3 bg-emerald-900/30 rounded-lg border border-emerald-500/30">
                                        <span className="text-slate-500 font-mono text-sm w-6">{idx + 1}.</span>
                                        <input
                                            className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-200"
                                            value={subject.name}
                                            onChange={(e) => handleTheorySubjectChange(idx, 'name', e.target.value)}
                                        />
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-slate-500">Max:</span>
                                            <input
                                                type="number"
                                                className="w-16 p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-center text-slate-200"
                                                value={subject.maxPoints}
                                                onChange={(e) => handleTheorySubjectChange(idx, 'maxPoints', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-slate-500">Schr.×</span>
                                            <input
                                                type="number"
                                                className="w-14 p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-center text-slate-200"
                                                value={subject.writtenWeight}
                                                onChange={(e) => handleTheorySubjectChange(idx, 'writtenWeight', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-slate-500">Mdl.×</span>
                                            <input
                                                type="number"
                                                className="w-14 p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-center text-slate-200"
                                                value={subject.oralWeight}
                                                onChange={(e) => handleTheorySubjectChange(idx, 'oralWeight', Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                </>
                )}
            </div>

            {/* Version Info */}
            <VersionInfo />

            <PasswordDialogComponent />
        </div>
    );
}
