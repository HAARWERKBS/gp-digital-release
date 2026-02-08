import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '../lib/store';
import { Plus, Search, Trash2, User, Building2, Edit, FileSpreadsheet, Download, LayoutGrid, List, UserX, UserCheck, FolderInput, AlertTriangle } from 'lucide-react';
import { Student, Gender, Wahlqualifikation, Grade } from '../lib/types';
import { cn } from '../lib/utils';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CertificateDocument } from '../components/CertificateDocument';
import { parseGermanDate } from '../lib/dateUtils';
import { usePasswordProtection } from '../components/PasswordDialog';
import * as XLSX from 'xlsx';

type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | 'active' | 'inactive';

// LocalStorage Key für Ansichtsmodus
const VIEW_MODE_STORAGE_KEY = 'gp-digital-students-view-mode';

export default function StudentsPage() {
    const {
        data, addStudent, addStudents, updateStudent, updateStudents, deleteStudent, deleteAllStudents, adminPasswordHash,
        // Berechtigungen
        canModifyStudents, canDeleteData,
        // Jahrgang-Verwaltung
        jahrgaenge, currentJahrgangId, moveStudentToJahrgang
    } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState("");
    // Ansichtsmodus aus localStorage laden
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
        return (saved === 'grid' || saved === 'list') ? saved : 'grid';
    });
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { requestPassword, PasswordDialogComponent } = usePasswordProtection();

    // Ansichtsmodus in localStorage speichern
    useEffect(() => {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    }, [viewMode]);

    // Passwort-geschützte Löschfunktionen
    const handleDeleteStudent = async (studentId: string, studentName: string) => {
        await requestPassword(
            'Prüfling löschen',
            `Möchten Sie "${studentName}" wirklich löschen? Alle Noten werden ebenfalls gelöscht.`
        );
        deleteStudent(studentId);
    };

    const handleDeleteAllStudents = async () => {
        await requestPassword(
            'Alle Prüflinge löschen',
            'WARNUNG: Wirklich ALLE Prüflinge und deren Noten unwiderruflich löschen?'
        );
        deleteAllStudents();
    };

    // Prüfling in anderen Jahrgang verschieben
    const handleMoveStudent = async (studentId: string, studentName: string, targetJahrgangId: string, targetJahrgangName: string) => {
        await requestPassword(
            'Prüfling verschieben',
            `"${studentName}" wird in den Jahrgang "${targetJahrgangName}" verschoben (inkl. aller Noten).`
        );
        moveStudentToJahrgang(studentId, targetJahrgangId);
    };

    // Andere Jahrgänge für Verschieben-Dropdown
    const otherJahrgaenge = jahrgaenge.filter(j => j.id !== currentJahrgangId);

    const filteredStudents = data.students
        .filter(s => {
            // Filter by active status
            if (filterMode === 'active' && !s.isActive) return false;
            if (filterMode === 'inactive' && s.isActive) return false;
            return true;
        })
        .filter(s =>
            s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.salon.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const activeCount = data.students.filter(s => s.isActive).length;
    const inactiveCount = data.students.filter(s => !s.isActive).length;

    // Berechne Bestanden-Status für alle Prüflinge
    const studentPassStatus = useMemo(() => {
        const results: Record<string, { hasGrades: boolean; passed: boolean; totalPoints: number }> = {};

        const getAvgScore = (grade: Grade, taskId: string) => {
            if (!grade.examiners || grade.examiners.length === 0) return 0;
            const sum = grade.examiners.reduce((acc, ex) => acc + (ex.scores[taskId] || 0), 0);
            return sum / grade.examiners.length;
        };

        const getExamPieceAvg = (grade: Grade, examPieceId: string) => {
            if (!grade.examPieceExaminers || grade.examPieceExaminers.length === 0) return 0;
            return grade.examPieceExaminers.reduce((acc, ex) => acc + (ex.scores[examPieceId] || 0), 0) / grade.examPieceExaminers.length;
        };

        data.students.forEach(student => {
            const gradePart1 = data.grades.find(g => g.studentId === student.id && g.sheetId === 'part1');
            const gradePart2 = data.grades.find(g => g.studentId === student.id && g.sheetId === 'part2');
            const sheetPart1 = data.sheets.find(s => s.id === 'part1');
            const sheetPart2 = data.sheets.find(s => s.id === 'part2');

            if (!gradePart1 || !gradePart2 || !sheetPart1 || !sheetPart2) {
                results[student.id] = { hasGrades: false, passed: true, totalPoints: 0 };
                return;
            }

            // Teil 1 Berechnung
            const part1WorkTaskPoints = sheetPart1.tasks.reduce((sum, t) => sum + (getAvgScore(gradePart1, t.id) * t.weight), 0);
            const part1ExamPiecePoints = sheetPart1.examPiece ? getExamPieceAvg(gradePart1, sheetPart1.examPiece.id) : 0;
            const part1Total = (part1WorkTaskPoints * sheetPart1.workTaskWeight) + (part1ExamPiecePoints * sheetPart1.examPieceWeight);

            // Teil 2 Berechnung
            const part2WorkTaskPoints = sheetPart2.tasks.reduce((sum, t) => sum + (getAvgScore(gradePart2, t.id) * t.weight), 0);
            const part2ExamPiecePoints = sheetPart2.examPiece ? getExamPieceAvg(gradePart2, sheetPart2.examPiece.id) : 0;
            const part2Total = (part2WorkTaskPoints * sheetPart2.workTaskWeight) + (part2ExamPiecePoints * sheetPart2.examPieceWeight);

            // Gesamtergebnis
            const totalPoints = (part1Total * 0.25) + (part2Total * 0.75);
            const passed = totalPoints >= 50;

            results[student.id] = { hasGrades: true, passed, totalPoints };
        });

        return results;
    }, [data.students, data.grades, data.sheets]);

    // Berechne Top 3 Prüflinge für Medaillen (Gold, Silber, Bronze)
    const topStudents = useMemo(() => {
        const studentsWithPoints: { id: string; points: number }[] = [];

        const getAvgScore = (grade: Grade, taskId: string) => {
            if (!grade.examiners || grade.examiners.length === 0) return 0;
            const sum = grade.examiners.reduce((acc, ex) => acc + (ex.scores[taskId] || 0), 0);
            return sum / grade.examiners.length;
        };

        const getExamPieceAvg = (grade: Grade, examPieceId: string) => {
            if (!grade.examPieceExaminers || grade.examPieceExaminers.length === 0) return 0;
            return grade.examPieceExaminers.reduce((acc, ex) => acc + (ex.scores[examPieceId] || 0), 0) / grade.examPieceExaminers.length;
        };

        data.students.filter(s => s.isActive).forEach(student => {
            const gradePart1 = data.grades.find(g => g.studentId === student.id && g.sheetId === 'part1');
            const sheetPart1 = data.sheets.find(s => s.id === 'part1');

            // Mindestens Teil 1 muss benotet sein
            if (!gradePart1 || !sheetPart1) return;

            // Teil 1 Berechnung
            const part1WorkTaskPoints = sheetPart1.tasks.reduce((sum, t) => sum + (getAvgScore(gradePart1, t.id) * t.weight), 0);
            const part1ExamPiecePoints = sheetPart1.examPiece ? getExamPieceAvg(gradePart1, sheetPart1.examPiece.id) : 0;
            const part1Total = (part1WorkTaskPoints * sheetPart1.workTaskWeight) + (part1ExamPiecePoints * sheetPart1.examPieceWeight);

            let totalPoints = part1Total * 0.25; // Teil 1 = 25%

            // Teil 2 hinzufügen wenn vorhanden
            const gradePart2 = data.grades.find(g => g.studentId === student.id && g.sheetId === 'part2');
            const sheetPart2 = data.sheets.find(s => s.id === 'part2');

            if (gradePart2 && sheetPart2) {
                const part2WorkTaskPoints = sheetPart2.tasks.reduce((sum, t) => sum + (getAvgScore(gradePart2, t.id) * t.weight), 0);
                const part2ExamPiecePoints = sheetPart2.examPiece ? getExamPieceAvg(gradePart2, sheetPart2.examPiece.id) : 0;
                const part2Total = (part2WorkTaskPoints * sheetPart2.workTaskWeight) + (part2ExamPiecePoints * sheetPart2.examPieceWeight);
                totalPoints += part2Total * 0.75; // Teil 2 = 75%
            }

            studentsWithPoints.push({ id: student.id, points: totalPoints });
        });

        // Sortieren nach Punkten (höchste zuerst) und Top 3 nehmen
        const sorted = studentsWithPoints.sort((a, b) => b.points - a.points);
        const result: Record<string, 1 | 2 | 3> = {};

        if (sorted.length >= 1 && sorted[0].points > 0) result[sorted[0].id] = 1; // Gold
        if (sorted.length >= 2 && sorted[1].points > 0) result[sorted[1].id] = 2; // Silber
        if (sorted.length >= 3 && sorted[2].points > 0) result[sorted[2].id] = 3; // Bronze

        return result;
    }, [data.students, data.grades, data.sheets]);

    const toggleStudentActive = (studentId: string) => {
        const student = data.students.find(s => s.id === studentId);
        if (student) {
            updateStudent(studentId, { isActive: !student.isActive });
        }
    };

    const handleEdit = (student: Student) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const handleSaveStudent = (s: Omit<Student, 'id' | 'createdAt' | 'isActive'>) => {
        if (editingStudent) {
            updateStudent(editingStudent.id, s);
        } else {
            addStudent(s);
        }
        setEditingStudent(undefined);
    };

    // --- Excel Export (ohne Blattschutz - einfacher Export) ---
    const handleExcelExport = () => {
        try {
            const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('de-DE') : '';
        const exportData = data.students.map(s => ({
            "Anrede": s.gender || "",
            "Vorname": s.firstName,
            "Nachname": s.lastName,
            "Prüfungsnummer": s.examNumber,

            "Geburtsdatum": formatDate(s.dob),
            "Geburtsort": s.birthPlace || "",
            "Geburtsland": s.birthCountry || "",

            "Straße": s.street || "",
            "Hausnummer": s.houseNumber || "",
            "PLZ": s.zip || "",
            "Stadt": s.city || "",
            "E-Mail": s.email || "",
            "Handy": s.mobile || "",

            "Betrieb": s.salon,
            "Betrieb Straße": s.salonStreet || "",
            "Betrieb PLZ Ort": s.salonZipCity || "",
            "Betrieb Telefon": s.salonPhone || "",
            "Firma": s.company || "",

            "Lehrzeit Von": formatDate(s.trainingStart),
            "Lehrzeit Bis": formatDate(s.trainingEnd),
            "Prüfungsdatum Teil 1": formatDate(s.examDatePart1),
            "Prüfungsdatum Teil 2": formatDate(s.examDatePart2),
            "Wahlqualifikation": s.wahlqualifikation || "",
        }));

        const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, "Prüflinge");

            // Verwende Blob + Download-Link (funktioniert in Electron und Browser)
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Prueflinge_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error('Excel-Export Fehler:', error);
        }
    };

    // --- Excel Import (mit Update-Funktion für bestehende Prüflinge) ---
    const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const arrayBuffer = evt.target?.result;
                const wb = XLSX.read(arrayBuffer, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws);

                console.log('Import: Gefundene Zeilen:', jsonData.length);
                console.log('Import: Erste Zeile:', jsonData[0]);

                const studentsToAdd: Omit<Student, 'id' | 'createdAt'>[] = [];
                const studentsToUpdate: { id: string; data: Partial<Student> }[] = [];
                let skippedEmpty = 0;
                let skippedDuplicatesInBatch = 0;

                // Hilfsfunktion: Finde existierenden Prüfling
                const findExistingStudent = (examNumber: string, firstName: string, lastName: string): Student | undefined => {
                    return data.students.find(existing => {
                        // Priorität 1: Prüfungsnummer (wenn beide vorhanden)
                        if (existing.examNumber && examNumber && existing.examNumber === examNumber) {
                            return true;
                        }
                        // Priorität 2: Name (case-insensitive)
                        return existing.firstName.toLowerCase() === firstName.toLowerCase() &&
                               existing.lastName.toLowerCase() === lastName.toLowerCase();
                    });
                };

                // Tracke bereits verarbeitete Einträge im aktuellen Batch (um Duplikate in der Excel zu erkennen)
                const processedInBatch = new Set<string>();

                jsonData.forEach((row: any) => {
                    const firstName = row['Vorname'] || '';
                    const lastName = row['Nachname'] || '';
                    const examNumber = String(row['Prüfungsnummer'] || '').trim();

                    // Leere Zeilen überspringen
                    if (!firstName && !lastName) {
                        skippedEmpty++;
                        return;
                    }

                    // Eindeutiger Schlüssel für Batch-Duplikat-Erkennung
                    const batchKey = examNumber || `${firstName.toLowerCase()}_${lastName.toLowerCase()}`;
                    if (processedInBatch.has(batchKey)) {
                        console.log(`Import: Duplikat in Excel-Datei übersprungen -> ${firstName} ${lastName}`);
                        skippedDuplicatesInBatch++;
                        return;
                    }
                    processedInBatch.add(batchKey);

                    const importedData: Omit<Student, 'id' | 'createdAt'> = {
                        gender: row['Anrede'] === 'Frau' || row['Anrede'] === 'Herr' || row['Anrede'] === 'Divers' ? row['Anrede'] : undefined,
                        firstName,
                        lastName,
                        examNumber,

                        birthPlace: row['Geburtsort'] || '',
                        birthCountry: row['Geburtsland'] || '',
                        street: row['Straße'] || '',
                        houseNumber: String(row['Hausnummer'] || ''),
                        zip: String(row['PLZ'] || ''),
                        city: row['Stadt'] || '',
                        email: row['E-Mail'] || '',
                        mobile: String(row['Handy'] || ''),

                        salon: row['Betrieb'] || row['Salon'] || '',
                        salonStreet: row['Betrieb Straße'] || row['Salon Adresse'] || '',
                        salonZipCity: row['Betrieb PLZ Ort'] || '',
                        salonPhone: String(row['Betrieb Telefon'] || row['Salon Telefon'] || ''),
                        company: row['Firma'] || '',
                        instructor: '',

                        dob: parseGermanDate(row['Geburtsdatum']) || '',
                        trainingStart: parseGermanDate(row['Lehrzeit Von']) || undefined,
                        trainingEnd: parseGermanDate(row['Lehrzeit Bis']) || undefined,
                        examDatePart1: parseGermanDate(row['Prüfungsdatum Teil 1']) || undefined,
                        examDatePart2: parseGermanDate(row['Prüfungsdatum Teil 2']) || undefined,
                        wahlqualifikation: WAHLQUALIFIKATIONEN.includes(row['Wahlqualifikation']) ? row['Wahlqualifikation'] : undefined,
                    };

                    if (importedData.firstName && importedData.lastName) {
                        const existingStudent = findExistingStudent(examNumber, firstName, lastName);

                        if (existingStudent) {
                            // Prüfling existiert bereits -> Update vorbereiten
                            console.log(`Import: Update -> ${firstName} ${lastName} (ID: ${existingStudent.id})`);
                            studentsToUpdate.push({
                                id: existingStudent.id,
                                data: importedData
                            });
                        } else {
                            // Neuer Prüfling
                            console.log(`Import: Neu -> ${firstName} ${lastName} (Nr: ${examNumber})`);
                            studentsToAdd.push(importedData);
                        }
                    }
                });

                console.log('Import Zusammenfassung:', {
                    total: jsonData.length,
                    new: studentsToAdd.length,
                    updated: studentsToUpdate.length,
                    skippedEmpty,
                    skippedDuplicatesInBatch
                });

                // Batch-Updates und Adds durchführen
                if (studentsToUpdate.length > 0) {
                    updateStudents(studentsToUpdate);
                }
                if (studentsToAdd.length > 0) {
                    addStudents(studentsToAdd);
                }

                // Benutzer-Feedback
                const messages: string[] = [];
                if (studentsToAdd.length > 0) {
                    messages.push(`${studentsToAdd.length} neue(r) Prüfling(e) hinzugefügt`);
                }
                if (studentsToUpdate.length > 0) {
                    messages.push(`${studentsToUpdate.length} bestehende(r) Prüfling(e) aktualisiert`);
                }
                if (skippedDuplicatesInBatch > 0) {
                    messages.push(`${skippedDuplicatesInBatch} Duplikat(e) in Excel übersprungen`);
                }
                if (skippedEmpty > 0) {
                    messages.push(`${skippedEmpty} leere Zeile(n) übersprungen`);
                }

                if (messages.length > 0) {
                    alert(`Import abgeschlossen:\n\n${messages.join('\n')}`);
                } else {
                    alert('Keine Daten zum Importieren gefunden.');
                }
            } catch (err) {
                console.error(err);
                alert("Fehler beim Importieren. Bitte prüfen Sie das Format.");
            } finally {
                // Reset input
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="space-y-6">
            {/* Header mit Liquid Metal Design */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 p-6 shadow-2xl border border-transparent">
                {/* Metallic Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-pulse" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                {/* Metallic Orbs */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-violet-500/20 via-purple-400/10 to-transparent rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                            Prüflinge
                        </h2>
                        <p className="text-slate-400 mt-1">Verwalten Sie hier alle Auszubildenden.</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {/* Chrome Buttons */}
                        <button
                            onClick={handleExcelExport}
                            className="group relative bg-gradient-to-b from-emerald-500 to-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-emerald-400 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/25 text-sm font-medium"
                        >
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent via-white/10 to-white/20" />
                            <Download size={18} className="relative z-10" />
                            <span className="relative z-10">Excel Export</span>
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative bg-gradient-to-b from-slate-600 to-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-slate-500 hover:to-slate-700 transition-all shadow-lg text-sm font-medium border border-slate-500/30"
                        >
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent via-white/5 to-white/10" />
                            <FileSpreadsheet size={18} className="relative z-10" />
                            <span className="relative z-10">Excel Import</span>
                        </button>
                        <input type="file" ref={fileInputRef} hidden accept=".xlsx, .xls" onChange={handleExcelImport} />

                        {/* Nur für Admins: Alle löschen */}
                        {canDeleteData() && (
                            <button
                                onClick={handleDeleteAllStudents}
                                className="group relative bg-gradient-to-b from-red-500/20 to-red-700/30 text-red-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:from-red-500/30 hover:to-red-600/40 transition-all shadow-lg border border-red-500/30 text-sm font-medium"
                            >
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent via-white/5 to-white/10" />
                                <Trash2 size={18} className="relative z-10" />
                                <span className="relative z-10">Alles löschen</span>
                            </button>
                        )}

                        {/* Nur für Admins: Neuer Prüfling */}
                        {canModifyStudents() && (
                            <button
                                onClick={() => { setEditingStudent(undefined); setIsModalOpen(true); }}
                                className="group relative bg-gradient-to-b from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 text-sm font-medium"
                            >
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent via-white/10 to-white/20" />
                                <Plus size={18} className="relative z-10" />
                                <span className="relative z-10">Neuer Prüfling</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Search and View Controls - Chrome Style */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Suchen nach Name oder Salon..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-2">
                    <div className="flex bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg p-1 border border-slate-700 shadow-inner">
                        <button
                            onClick={() => setFilterMode('all')}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                filterMode === 'all'
                                    ? "bg-gradient-to-b from-slate-600 to-slate-700 text-white shadow-lg border border-slate-500/30"
                                    : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            Alle ({data.students.length})
                        </button>
                        <button
                            onClick={() => setFilterMode('active')}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1",
                                filterMode === 'active'
                                    ? "bg-gradient-to-b from-emerald-600 to-emerald-800 text-white shadow-lg border border-emerald-500/30"
                                    : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            <UserCheck size={14} />
                            Aktiv ({activeCount})
                        </button>
                        <button
                            onClick={() => setFilterMode('inactive')}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1",
                                filterMode === 'inactive'
                                    ? "bg-gradient-to-b from-slate-600 to-slate-700 text-white shadow-lg border border-slate-500/30"
                                    : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            <UserX size={14} />
                            Pausiert ({inactiveCount})
                        </button>
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg p-1 border border-slate-700 shadow-inner">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-2 rounded-md transition-all",
                                viewMode === 'grid'
                                    ? "bg-gradient-to-b from-cyan-600 to-cyan-800 text-white shadow-lg"
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                            title="Kachelansicht"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-2 rounded-md transition-all",
                                viewMode === 'list'
                                    ? "bg-gradient-to-b from-cyan-600 to-cyan-800 text-white shadow-lg"
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                            title="Listenansicht"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid View - Chrome Cards */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map(student => (
                        <div
                            key={student.id}
                            className={cn(
                                "relative p-5 rounded-xl transition-all group overflow-hidden",
                                "bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900",
                                "border shadow-xl",
                                student.isActive
                                    ? "border-slate-700 hover:border-slate-600"
                                    : "border-slate-800"
                            )}
                        >
                            {/* Chrome Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                            {/* Status Badge */}
                            {!student.isActive && (
                                <div className="absolute top-2 left-2 bg-slate-600 text-slate-300 text-xs px-2 py-0.5 rounded-full border border-slate-500/30">
                                    Pausiert
                                </div>
                            )}

                            {/* Aktionen nur für Admins - immer sichtbar */}
                            {canModifyStudents() && (
                                <div className="absolute top-3 right-3 flex gap-1.5 z-20">
                                    <button
                                        onClick={() => toggleStudentActive(student.id)}
                                        className={cn(
                                            "bg-slate-700/90 rounded-full p-1.5 shadow-lg border transition-colors",
                                            student.isActive
                                                ? "text-emerald-400 hover:text-emerald-300 border-emerald-500/50 hover:border-emerald-400"
                                                : "text-red-400 hover:text-red-300 border-red-500/50 hover:border-red-400"
                                        )}
                                        title={student.isActive ? "Pausieren" : "Aktivieren"}
                                    >
                                        {student.isActive ? <UserCheck size={14} /> : <UserX size={14} />}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(student)}
                                        className="text-cyan-400 hover:text-cyan-300 bg-slate-700/90 rounded-full p-1.5 shadow-lg border border-cyan-500/50 hover:border-cyan-400 transition-colors"
                                        title="Bearbeiten"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    {/* Verschieben-Button mit Dropdown */}
                                    {otherJahrgaenge.length > 0 && (
                                        <div className="relative group/move">
                                            <button
                                                className="text-amber-400 hover:text-amber-300 bg-slate-700/90 rounded-full p-1.5 shadow-lg border border-amber-500/50 hover:border-amber-400 transition-colors"
                                                title="In anderen Jahrgang verschieben"
                                            >
                                                <FolderInput size={14} />
                                            </button>
                                            {/* Unsichtbare Brücke zwischen Button und Dropdown */}
                                            <div className="hidden group-hover/move:block absolute right-0 top-full h-2 w-full" />
                                            <div className="hidden group-hover/move:block absolute right-0 top-full mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 min-w-[180px] py-1">
                                                <div className="px-3 py-1.5 text-xs text-slate-400 border-b border-slate-700">Verschieben nach:</div>
                                                {otherJahrgaenge.map(j => (
                                                    <button
                                                        key={j.id}
                                                        onClick={() => handleMoveStudent(student.id, `${student.firstName} ${student.lastName}`, j.id, j.name)}
                                                        className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-2"
                                                    >
                                                        <FolderInput size={14} className="text-amber-400" />
                                                        {j.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {canDeleteData() && (
                                        <button
                                            onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
                                            className="text-slate-400 hover:text-red-400 bg-slate-700/90 rounded-full p-1.5 shadow-lg border border-slate-600 hover:border-red-500/50 transition-colors"
                                            title="Löschen"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="flex items-start gap-4 relative z-10">
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                                    "bg-gradient-to-br shadow-inner border",
                                    student.isActive
                                        ? "from-cyan-600 to-blue-700 text-white border-cyan-500/30"
                                        : "from-slate-600 to-slate-700 text-slate-400 border-slate-500/30"
                                )}>
                                    {student.firstName[0]}{student.lastName[0]}
                                </div>
                                <div>
                                    <h3 className={cn(
                                        "font-semibold flex items-center gap-1.5",
                                        student.isActive ? "text-slate-100" : "text-slate-400"
                                    )}>
                                        {topStudents[student.id] === 1 && <span title="1. Platz - Gold">🥇</span>}
                                        {topStudents[student.id] === 2 && <span title="2. Platz - Silber">🥈</span>}
                                        {topStudents[student.id] === 3 && <span title="3. Platz - Bronze">🥉</span>}
                                        {student.firstName} {student.lastName}
                                    </h3>
                                    <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
                                        <Building2 size={14} />
                                        {student.salon}
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                                        <User size={14} />
                                        Prüfungs-Nr: {student.examNumber}
                                    </div>
                                </div>
                            </div>
                            {/* Additional Info Section */}
                            <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-1 text-xs text-slate-400 relative z-10">
                                {student.mobile && (
                                    <div><span className="text-slate-500">Handy:</span> {student.mobile}</div>
                                )}
                                {student.salonPhone && (
                                    <div><span className="text-slate-500">Betrieb Tel:</span> {student.salonPhone}</div>
                                )}
                                {(student.trainingStart || student.trainingEnd) && (
                                    <div>
                                        <span className="text-slate-500">Lehrzeit:</span> {student.trainingStart ? new Date(student.trainingStart).toLocaleDateString('de-DE') : '–'} bis {student.trainingEnd ? new Date(student.trainingEnd).toLocaleDateString('de-DE') : '–'}
                                    </div>
                                )}
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-700/30 flex justify-between items-center text-xs text-slate-500 relative z-10">
                                <div className="flex gap-2">
                                    <span>Geb: {student.dob ? new Date(student.dob).toLocaleDateString('de-DE') : '-'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {studentPassStatus[student.id]?.hasGrades && !studentPassStatus[student.id]?.passed && (
                                        <div className="relative group/tooltip">
                                            <AlertTriangle size={14} className="text-red-500 cursor-help" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                                                Nicht bestanden ({studentPassStatus[student.id]?.totalPoints.toFixed(1)} Punkte)
                                            </div>
                                        </div>
                                    )}
                                    <PDFDownloadLink
                                        document={<CertificateDocument student={student} backgroundImage={data.certificateBackgroundImage} />}
                                        fileName={`gesellenbrief_${student.lastName}.pdf`}
                                        className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                                    >
                                        Brief drucken
                                    </PDFDownloadLink>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredStudents.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500">
                            {searchTerm ? 'Keine Ergebnisse gefunden.' : filterMode === 'inactive' ? 'Keine pausierten Prüflinge.' : 'Noch keine Prüflinge angelegt.'}
                        </div>
                    )}
                </div>
            )}

            {/* List View - Chrome Table */}
            {viewMode === 'list' && (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 shadow-xl">
                    {/* Chrome Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none z-10" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

                    <table className="w-full relative">
                        <thead className="bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-12">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Prüfungs-Nr.</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Handy</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Betrieb</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Betrieb Tel.</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Lehrzeit</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50 bg-gradient-to-b from-slate-850 to-slate-900">
                            {filteredStudents.map(student => (
                                <tr
                                    key={student.id}
                                    className={cn(
                                        "hover:bg-slate-800/50 transition-colors",
                                        !student.isActive && "bg-slate-900/50"
                                    )}
                                >
                                    <td className="px-4 py-3">
                                        {canModifyStudents() ? (
                                            <button
                                                onClick={() => toggleStudentActive(student.id)}
                                                className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all border",
                                                    student.isActive
                                                        ? "bg-gradient-to-b from-emerald-600 to-emerald-800 text-white border-emerald-500/30 hover:from-orange-500 hover:to-orange-700 hover:border-orange-500/30"
                                                        : "bg-gradient-to-b from-slate-600 to-slate-800 text-slate-400 border-slate-500/30 hover:from-emerald-600 hover:to-emerald-800 hover:text-white"
                                                )}
                                                title={student.isActive ? "Pausieren" : "Aktivieren"}
                                            >
                                                {student.isActive ? <UserCheck size={16} /> : <UserX size={16} />}
                                            </button>
                                        ) : (
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center border",
                                                student.isActive
                                                    ? "bg-gradient-to-b from-emerald-600/50 to-emerald-800/50 text-white/70 border-emerald-500/20"
                                                    : "bg-gradient-to-b from-slate-600/50 to-slate-800/50 text-slate-400/70 border-slate-500/20"
                                            )}>
                                                {student.isActive ? <UserCheck size={16} /> : <UserX size={16} />}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border shadow-inner",
                                                student.isActive
                                                    ? "bg-gradient-to-br from-cyan-600 to-blue-700 text-white border-cyan-500/30"
                                                    : "bg-gradient-to-br from-slate-600 to-slate-700 text-slate-400 border-slate-500/30"
                                            )}>
                                                {student.firstName[0]}{student.lastName[0]}
                                            </div>
                                            <div>
                                                <div className={cn(
                                                    "font-medium flex items-center gap-1.5",
                                                    student.isActive ? "text-slate-100" : "text-slate-400"
                                                )}>
                                                    {topStudents[student.id] === 1 && <span title="1. Platz - Gold">🥇</span>}
                                                    {topStudents[student.id] === 2 && <span title="2. Platz - Silber">🥈</span>}
                                                    {topStudents[student.id] === 3 && <span title="3. Platz - Bronze">🥉</span>}
                                                    {student.firstName} {student.lastName}
                                                </div>
                                                {!student.isActive && (
                                                    <span className="text-xs text-slate-500">Pausiert</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-300 font-mono">{student.examNumber}</td>
                                    <td className="px-4 py-3 text-sm text-slate-400">{student.mobile || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-slate-400">{student.salon}</td>
                                    <td className="px-4 py-3 text-sm text-slate-400">{student.salonPhone || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-slate-400">
                                        {student.trainingStart ? new Date(student.trainingStart).toLocaleDateString('de-DE') : '-'} – {student.trainingEnd ? new Date(student.trainingEnd).toLocaleDateString('de-DE') : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {studentPassStatus[student.id]?.hasGrades && !studentPassStatus[student.id]?.passed && (
                                                <div className="relative group/tooltip">
                                                    <AlertTriangle size={14} className="text-red-500 cursor-help" />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                                                        Nicht bestanden ({studentPassStatus[student.id]?.totalPoints.toFixed(1)} Punkte)
                                                    </div>
                                                </div>
                                            )}
                                            <PDFDownloadLink
                                                document={<CertificateDocument student={student} backgroundImage={data.certificateBackgroundImage} />}
                                                fileName={`gesellenbrief_${student.lastName}.pdf`}
                                                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                                            >
                                                Brief
                                            </PDFDownloadLink>
                                            {canModifyStudents() && (
                                                <button
                                                    onClick={() => handleEdit(student)}
                                                    className="text-slate-500 hover:text-cyan-400 p-1 transition-colors"
                                                    title="Bearbeiten"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            )}
                                            {/* Verschieben-Button mit Dropdown */}
                                            {canModifyStudents() && otherJahrgaenge.length > 0 && (
                                                <div className="relative group/move">
                                                    <button
                                                        className="text-slate-500 hover:text-amber-400 p-1 transition-colors"
                                                        title="In anderen Jahrgang verschieben"
                                                    >
                                                        <FolderInput size={16} />
                                                    </button>
                                                    {/* Unsichtbare Brücke zwischen Button und Dropdown */}
                                                    <div className="hidden group-hover/move:block absolute right-0 top-full h-2 w-full" />
                                                    <div className="hidden group-hover/move:block absolute right-0 top-full mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 min-w-[180px] py-1">
                                                        <div className="px-3 py-1.5 text-xs text-slate-400 border-b border-slate-700">Verschieben nach:</div>
                                                        {otherJahrgaenge.map(j => (
                                                            <button
                                                                key={j.id}
                                                                onClick={() => handleMoveStudent(student.id, `${student.firstName} ${student.lastName}`, j.id, j.name)}
                                                                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-2"
                                                            >
                                                                <FolderInput size={14} className="text-amber-400" />
                                                                {j.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {canDeleteData() && (
                                                <button
                                                    onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
                                                    className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                                                    title="Löschen"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredStudents.length === 0 && (
                        <div className="py-12 text-center text-slate-500 bg-slate-900">
                            {searchTerm ? 'Keine Ergebnisse gefunden.' : filterMode === 'inactive' ? 'Keine pausierten Prüflinge.' : 'Noch keine Prüflinge angelegt.'}
                        </div>
                    )}
                </div>
            )}

            {
                isModalOpen && (
                    <StudentModal
                        onClose={() => { setIsModalOpen(false); setEditingStudent(undefined); }}
                        onSave={handleSaveStudent}
                        initialData={editingStudent}
                    />
                )
            }

            <PasswordDialogComponent />
        </div >
    );
}

const WAHLQUALIFIKATIONEN: Wahlqualifikation[] = ['Kosmetik', 'Langhaarfrisuren', 'Nageldesign/-modelage', 'Haarersatz', 'Coloration'];

// Standard Input-Klassen für Dark-Theme (ohne dark: Präfix da App immer dunkel ist)
const INPUT_CLASSES = "mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-slate-200 shadow-inner border p-2 text-sm focus:border-cyan-500 focus:ring-cyan-500/20 placeholder-slate-500";
const SELECT_CLASSES = "mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-slate-200 shadow-inner border p-2 text-sm focus:border-cyan-500 focus:ring-cyan-500/20";
const LABEL_CLASSES = "text-sm font-medium text-slate-300";

function StudentModal({ onClose, onSave, initialData }: { onClose: () => void, onSave: (s: Omit<Student, 'id' | 'createdAt' | 'isActive'>) => void, initialData?: Student }) {
    const formatDateForInput = (isoDate?: string) => {
        if (!isoDate) return '';
        try {
            // Prüfe ob es bereits deutsches Format ist (TT.MM.JJJJ)
            if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(isoDate)) return isoDate;
            // Ansonsten als ISO-Datum parsen und formatieren
            const date = new Date(isoDate);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch { return ''; }
    };

    // State für Validierungsfehler (ersetzt alert() um Fokus-Probleme auf Windows zu vermeiden)
    const [validationError, setValidationError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: initialData?.firstName || '',
        lastName: initialData?.lastName || '',
        examNumber: initialData?.examNumber || '',
        gender: initialData?.gender || '' as Gender | '',

        // Private Adresse
        street: initialData?.street || '',
        houseNumber: initialData?.houseNumber || '',
        zip: initialData?.zip || '',
        city: initialData?.city || '',

        // Geburt
        dob: formatDateForInput(initialData?.dob),
        birthPlace: initialData?.birthPlace || '',
        birthCountry: initialData?.birthCountry || '',

        // Salon
        salon: initialData?.salon || '',
        salonStreet: initialData?.salonStreet || '',
        salonZipCity: initialData?.salonZipCity || '',
        salonPhone: initialData?.salonPhone || '',
        company: initialData?.company || '',
        instructor: initialData?.instructor || '',

        // Kontakt
        email: initialData?.email || '',
        mobile: initialData?.mobile || '',

        // Ausbildung
        trainingStart: formatDateForInput(initialData?.trainingStart),
        trainingEnd: formatDateForInput(initialData?.trainingEnd),

        // Prüfung
        examDatePart1: formatDateForInput(initialData?.examDatePart1),
        examDatePart2: formatDateForInput(initialData?.examDatePart2),
        wahlqualifikation: initialData?.wahlqualifikation || '' as Wahlqualifikation | '',
    });

    // Validierung: Prüft ob ein Datumsfeld gültig ist (leer = gültig, ausgefüllt = muss parsen)
    const isDateValid = (dateStr: string, required: boolean = false): boolean => {
        if (!dateStr.trim()) return !required; // Leer ist OK wenn nicht required
        return parseGermanDate(dateStr) !== null;
    };

    // CSS-Klassen für Datumsfelder
    const getDateInputClass = (dateStr: string, required: boolean = false): string => {
        const baseClass = "mt-1 block w-full rounded-md shadow-sm border p-2 text-sm";
        if (!dateStr.trim() && !required) return `${baseClass} border-gray-300`;
        if (!isDateValid(dateStr, required)) {
            return `${baseClass} border-red-500 bg-red-50 text-red-700 focus:border-red-500 focus:ring-red-200`;
        }
        return `${baseClass} border-gray-300`;
    };

    // CSS-Klassen für Labels
    const getDateLabelClass = (dateStr: string, required: boolean = false): string => {
        const baseClass = "text-sm font-medium";
        if (dateStr.trim() && !isDateValid(dateStr, required)) {
            return `${baseClass} text-red-600`;
        }
        return `${baseClass} text-gray-700`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        // Datumsfelder parsen - leere Felder sind erlaubt
        const parsedDob = formData.dob.trim() ? parseGermanDate(formData.dob) : undefined;
        const parsedStart = formData.trainingStart.trim() ? parseGermanDate(formData.trainingStart) : undefined;
        const parsedEnd = formData.trainingEnd.trim() ? parseGermanDate(formData.trainingEnd) : undefined;
        const parsedExamDate1 = formData.examDatePart1?.trim() ? parseGermanDate(formData.examDatePart1) : undefined;
        const parsedExamDate2 = formData.examDatePart2?.trim() ? parseGermanDate(formData.examDatePart2) : undefined;

        // Nur prüfen wenn ein Datum eingegeben wurde aber ungültig ist
        const invalidDates: string[] = [];
        if (formData.dob.trim() && !parsedDob) invalidDates.push('Geburtsdatum');
        if (formData.trainingStart.trim() && !parsedStart) invalidDates.push('Lehrzeit von');
        if (formData.trainingEnd.trim() && !parsedEnd) invalidDates.push('Lehrzeit bis');
        if (formData.examDatePart1?.trim() && !parsedExamDate1) invalidDates.push('Prüfungsdatum Teil 1');
        if (formData.examDatePart2?.trim() && !parsedExamDate2) invalidDates.push('Prüfungsdatum Teil 2');

        if (invalidDates.length > 0) {
            setValidationError(`Ungültiges Datumsformat bei: ${invalidDates.join(', ')}. Bitte Format TT.MM.JJJJ verwenden.`);
            return;
        }

        onSave({
            ...formData,
            gender: formData.gender || undefined,
            wahlqualifikation: formData.wahlqualifikation || undefined,
            dob: parsedDob,
            trainingStart: parsedStart,
            trainingEnd: parsedEnd,
            examDatePart1: parsedExamDate1,
            examDatePart2: parsedExamDate2,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
                {/* Chrome Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-gradient-to-b from-slate-700 to-slate-800 sticky top-0 z-10">
                    <h3 className="font-bold text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                        {initialData ? 'Prüfling bearbeiten' : 'Neuen Prüfling anlegen'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-2xl transition-colors">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6 relative z-10">

                    {/* SECTION: Person */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-cyan-400 border-b border-cyan-500/30 pb-1">Persönliche Daten</h4>
                        <div className="grid grid-cols-4 gap-4">
                            <label className="block">
                                <span className={LABEL_CLASSES}>Anrede</span>
                                <select className={SELECT_CLASSES}
                                    value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value as Gender })}>
                                    <option value="">-</option>
                                    <option value="Frau">Frau</option>
                                    <option value="Herr">Herr</option>
                                    <option value="Divers">Divers</option>
                                </select>
                            </label>
                            <label className="block">
                                <span className={LABEL_CLASSES}>Vorname</span>
                                <input required className={INPUT_CLASSES}
                                    value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                            </label>
                            <label className="block col-span-2">
                                <span className={LABEL_CLASSES}>Nachname</span>
                                <input required className={INPUT_CLASSES}
                                    value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                            </label>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <label className="block">
                                <span className={cn(LABEL_CLASSES, formData.dob && !isDateValid(formData.dob) && "text-red-400")}>Geburtsdatum</span>
                                <input type="text" placeholder="TT.MM.JJJJ"
                                    className={cn(INPUT_CLASSES,
                                        formData.dob && !isDateValid(formData.dob) && "bg-red-900/30 border-red-500/50 text-red-200"
                                    )}
                                    value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                                {formData.dob && !isDateValid(formData.dob) && (
                                    <span className="text-xs text-red-400 mt-1">Ungültiges Datum</span>
                                )}
                            </label>
                            <label className="block">
                                <span className={LABEL_CLASSES}>Geburtsort</span>
                                <input className={INPUT_CLASSES}
                                    value={formData.birthPlace} onChange={e => setFormData({ ...formData, birthPlace: e.target.value })} />
                            </label>
                            <label className="block">
                                <span className={LABEL_CLASSES}>Geburtsland</span>
                                <input className={INPUT_CLASSES} placeholder="Deutschland"
                                    value={formData.birthCountry} onChange={e => setFormData({ ...formData, birthCountry: e.target.value })} />
                            </label>
                        </div>
                    </div>

                    {/* SECTION: Address */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-cyan-400 border-b border-cyan-500/30 pb-1">Privatanschrift</h4>
                        <div className="grid grid-cols-4 gap-4">
                            <label className="block col-span-2">
                                <span className={LABEL_CLASSES}>Straße</span>
                                <input className={INPUT_CLASSES}
                                    value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} />
                            </label>
                            <label className="block">
                                <span className={LABEL_CLASSES}>Hausnummer</span>
                                <input className={INPUT_CLASSES}
                                    value={formData.houseNumber} onChange={e => setFormData({ ...formData, houseNumber: e.target.value })} />
                            </label>
                            <label className="block">
                                <span className={LABEL_CLASSES}>PLZ</span>
                                <input className={INPUT_CLASSES}
                                    value={formData.zip} onChange={e => setFormData({ ...formData, zip: e.target.value })} />
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                <span className={LABEL_CLASSES}>Stadt</span>
                                <input className={INPUT_CLASSES}
                                    value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className={LABEL_CLASSES}>E-Mail</span>
                                    <input type="email" className={INPUT_CLASSES}
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </label>
                                <label className="block">
                                    <span className={LABEL_CLASSES}>Handy</span>
                                    <input className={INPUT_CLASSES}
                                        value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* SECTION: Salon */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-cyan-400 border-b border-cyan-500/30 pb-1">Ausbildungsbetrieb</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                <span className={LABEL_CLASSES}>Betrieb / Firma</span>
                                <input required className={INPUT_CLASSES}
                                    value={formData.salon} onChange={e => setFormData({ ...formData, salon: e.target.value })} />
                            </label>
                            <label className="block">
                                <span className={LABEL_CLASSES}>Telefon Betrieb</span>
                                <input className={INPUT_CLASSES}
                                    value={formData.salonPhone} onChange={e => setFormData({ ...formData, salonPhone: e.target.value })} />
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                <span className={LABEL_CLASSES}>Straße und Hausnummer</span>
                                <input className={INPUT_CLASSES}
                                    value={formData.salonStreet} onChange={e => setFormData({ ...formData, salonStreet: e.target.value })} />
                            </label>
                            <label className="block">
                                <span className={LABEL_CLASSES}>PLZ und Ort</span>
                                <input className={INPUT_CLASSES}
                                    value={formData.salonZipCity} onChange={e => setFormData({ ...formData, salonZipCity: e.target.value })} />
                            </label>
                        </div>
                        <label className="block">
                            <span className={LABEL_CLASSES}>Inhaber/Firma (falls abweichend)</span>
                            <input className={INPUT_CLASSES} placeholder="Optional"
                                value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                        </label>
                    </div>

                    {/* SECTION: Ausbildung & Prüfung */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-cyan-400 border-b border-cyan-500/30 pb-1">Ausbildung & Prüfung</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <label className="block">
                                <span className={LABEL_CLASSES}>Prüfungsnummer</span>
                                <input required className={INPUT_CLASSES}
                                    value={formData.examNumber} onChange={e => setFormData({ ...formData, examNumber: e.target.value })} />
                            </label>
                            <label className="block">
                                <span className={cn(LABEL_CLASSES, formData.trainingStart && !isDateValid(formData.trainingStart) && "text-red-400")}>Lehrzeit von</span>
                                <input type="text" placeholder="TT.MM.JJJJ"
                                    className={cn(INPUT_CLASSES,
                                        formData.trainingStart && !isDateValid(formData.trainingStart) && "bg-red-900/30 border-red-500/50 text-red-200"
                                    )}
                                    value={formData.trainingStart} onChange={e => setFormData({ ...formData, trainingStart: e.target.value })} />
                                {formData.trainingStart && !isDateValid(formData.trainingStart) && (
                                    <span className="text-xs text-red-400 mt-1">Ungültiges Datum</span>
                                )}
                            </label>
                            <label className="block">
                                <span className={cn(LABEL_CLASSES, formData.trainingEnd && !isDateValid(formData.trainingEnd) && "text-red-400")}>Lehrzeit bis</span>
                                <input type="text" placeholder="TT.MM.JJJJ"
                                    className={cn(INPUT_CLASSES,
                                        formData.trainingEnd && !isDateValid(formData.trainingEnd) && "bg-red-900/30 border-red-500/50 text-red-200"
                                    )}
                                    value={formData.trainingEnd} onChange={e => setFormData({ ...formData, trainingEnd: e.target.value })} />
                                {formData.trainingEnd && !isDateValid(formData.trainingEnd) && (
                                    <span className="text-xs text-red-400 mt-1">Ungültiges Datum</span>
                                )}
                            </label>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <label className="block">
                                <span className={cn(LABEL_CLASSES, formData.examDatePart1 && !isDateValid(formData.examDatePart1) && "text-red-400")}>Prüfungsdatum Teil 1</span>
                                <input type="text" placeholder="TT.MM.JJJJ"
                                    className={cn(INPUT_CLASSES,
                                        formData.examDatePart1 && !isDateValid(formData.examDatePart1) && "bg-red-900/30 border-red-500/50 text-red-200"
                                    )}
                                    value={formData.examDatePart1} onChange={e => setFormData({ ...formData, examDatePart1: e.target.value })} />
                                {formData.examDatePart1 && !isDateValid(formData.examDatePart1) && (
                                    <span className="text-xs text-red-400 mt-1">Ungültiges Datum</span>
                                )}
                            </label>
                            <label className="block">
                                <span className={cn(LABEL_CLASSES, formData.examDatePart2 && !isDateValid(formData.examDatePart2) && "text-red-400")}>Prüfungsdatum Teil 2</span>
                                <input type="text" placeholder="TT.MM.JJJJ"
                                    className={cn(INPUT_CLASSES,
                                        formData.examDatePart2 && !isDateValid(formData.examDatePart2) && "bg-red-900/30 border-red-500/50 text-red-200"
                                    )}
                                    value={formData.examDatePart2} onChange={e => setFormData({ ...formData, examDatePart2: e.target.value })} />
                                {formData.examDatePart2 && !isDateValid(formData.examDatePart2) && (
                                    <span className="text-xs text-red-400 mt-1">Ungültiges Datum</span>
                                )}
                            </label>
                            <label className="block">
                                <span className={LABEL_CLASSES}>Wahlqualifikation</span>
                                <select className={SELECT_CLASSES}
                                    value={formData.wahlqualifikation} onChange={e => setFormData({ ...formData, wahlqualifikation: e.target.value as Wahlqualifikation })}>
                                    <option value="">Bitte wählen...</option>
                                    {WAHLQUALIFIKATIONEN.map(wq => (
                                        <option key={wq} value={wq}>{wq}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>

                    {/* Validierungsfehler-Anzeige (ersetzt alert() um Fokus-Probleme auf Windows zu vermeiden) */}
                    {validationError && (
                        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm flex items-center gap-2">
                            <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
                            <span>{validationError}</span>
                            <button
                                type="button"
                                onClick={() => setValidationError(null)}
                                className="ml-auto text-red-500 hover:text-red-300"
                            >
                                &times;
                            </button>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-2 sticky bottom-0 bg-gradient-to-t from-slate-800 to-slate-800/95 border-t border-slate-700 p-4 -mx-6 -mb-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors">Abbrechen</button>
                        <button type="submit" className="relative px-4 py-2 bg-gradient-to-b from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25">
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent via-white/10 to-white/20" />
                            <span className="relative z-10">Speichern</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
