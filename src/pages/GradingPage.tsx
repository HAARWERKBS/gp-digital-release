import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../lib/store';
import { calculateGrade, getGradeColor } from '../lib/grading';
import { ChevronRight, Calculator, FileCheck, Users, Trash2, UserPlus, AlertCircle, BookOpen, Scissors, GraduationCap, Medal } from 'lucide-react';
import { cn } from '../lib/utils';
import { ExaminerGrade, Grade, TheoryScore, GradingSheet, Pruefer } from '../lib/types';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ProtocolDocument } from '../components/ProtocolDocument';
import { GesamtNiederschrift } from '../components/GesamtNiederschrift';
import { PruefungsZeugnis } from '../components/PruefungsZeugnis';
import { DEFAULT_GRADE_SCALE, DEFAULT_INNUNG } from '../lib/types';
import GlobalExaminerSelector from '../components/GlobalExaminerSelector';

export default function GradingPage() {
    const { data, saveGrade, prueferpool, getGlobalExaminers } = useStore();
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [selectedSheetId, setSelectedSheetId] = useState<string>("part1");

    // State for multiple examiners (Arbeitsaufgaben)
    const [examiners, setExaminers] = useState<ExaminerGrade[]>([]);
    // State for exam piece examiners (Prüfungsstück)
    const [examPieceExaminers, setExamPieceExaminers] = useState<ExaminerGrade[]>([]);
    // State for theory scores (nur Teil 2)
    const [theoryScores, setTheoryScores] = useState<TheoryScore[]>([]);

    const student = data.students.find(s => s.id === selectedStudentId);
    const sheet = data.sheets.find(s => s.id === selectedSheetId) || data.sheets[0];

    // Load or Initialize
    useEffect(() => {
        if (selectedStudentId && sheet) {
            const existingGrade = data.grades.find(g => g.studentId === selectedStudentId && g.sheetId === sheet.id);
            if (existingGrade) {
                // Load existing data
                setExaminers(existingGrade.examiners || createDefaultExaminers());
                setExamPieceExaminers(existingGrade.examPieceExaminers || createDefaultExaminers());
                setTheoryScores(existingGrade.theoryScores || createDefaultTheoryScores());
            } else {
                // Initialize defaults
                setExaminers(createDefaultExaminers());
                setExamPieceExaminers(createDefaultExaminers());
                setTheoryScores(createDefaultTheoryScores());
            }
        }
    }, [selectedStudentId, sheet?.id, data.grades]);

    // Globale Prüfer für den aktuellen Teil abrufen
    const currentTeil = selectedSheetId === 'part1' ? 1 : 2;
    const globalExaminersForTeil = getGlobalExaminers(currentTeil as 1 | 2);

    const createDefaultExaminers = (): ExaminerGrade[] => {
        // Wenn globale Prüfer gesetzt sind, verwende diese
        if (globalExaminersForTeil && globalExaminersForTeil.examinerIds.length > 0) {
            return globalExaminersForTeil.examinerIds.map(id => {
                const pruefer = prueferpool.find(p => p.id === id);
                return {
                    id: crypto.randomUUID(),
                    name: pruefer?.name || `Prüfer (ID: ${id})`,
                    scores: {}
                };
            });
        }

        // Ansonsten Standard-Prüfer erstellen
        return [
            { id: crypto.randomUUID(), name: "Prüfer 1", scores: {} },
            { id: crypto.randomUUID(), name: "Prüfer 2", scores: {} },
            { id: crypto.randomUUID(), name: "Prüfer 3", scores: {} },
        ];
    };

    const createDefaultTheoryScores = (): TheoryScore[] => {
        if (!sheet?.theorySubjects) return [];
        return sheet.theorySubjects.map(subject => ({
            subjectId: subject.id,
            writtenPoints: 0,
            oralPoints: 0
        }));
    };

    // --- Arbeitsaufgaben Handlers ---
    const handleScoreChange = (examinerIndex: number, taskId: string, val: string) => {
        const num = Math.min(100, Math.max(0, Number(val) || 0));
        const newExaminers = [...examiners];
        newExaminers[examinerIndex] = {
            ...newExaminers[examinerIndex],
            scores: { ...newExaminers[examinerIndex].scores, [taskId]: num }
        };
        setExaminers(newExaminers);
    };

    // Prüfernamen synchronisieren zwischen Arbeitsaufgaben und Prüfungsstück
    const handleNameChange = (index: number, name: string) => {
        // Arbeitsaufgaben-Prüfer aktualisieren
        const newExaminers = [...examiners];
        newExaminers[index].name = name;
        setExaminers(newExaminers);

        // Prüfungsstück-Prüfer synchronisieren (Name)
        if (examPieceExaminers[index]) {
            const newExamPieceExaminers = [...examPieceExaminers];
            newExamPieceExaminers[index].name = name;
            setExamPieceExaminers(newExamPieceExaminers);
        }
    };

    const addExaminer = () => {
        if (examiners.length >= 5) return;
        const newName = `Prüfer ${examiners.length + 1}`;
        // Prüfer bei Arbeitsaufgaben hinzufügen
        setExaminers([...examiners, { id: crypto.randomUUID(), name: newName, scores: {} }]);
        // Prüfer beim Prüfungsstück hinzufügen (synchron)
        setExamPieceExaminers([...examPieceExaminers, { id: crypto.randomUUID(), name: newName, scores: {} }]);
    };

    const removeExaminer = (index: number) => {
        if (examiners.length <= 3) return;
        // Prüfer bei Arbeitsaufgaben entfernen
        setExaminers(examiners.filter((_, i) => i !== index));
        // Prüfer beim Prüfungsstück entfernen (synchron)
        setExamPieceExaminers(examPieceExaminers.filter((_, i) => i !== index));
    };

    // --- Prüfungsstück Handlers ---
    const handleExamPieceScoreChange = (examinerIndex: number, taskId: string, val: string) => {
        const num = Math.min(100, Math.max(0, Number(val) || 0));
        const newExaminers = [...examPieceExaminers];
        newExaminers[examinerIndex] = {
            ...newExaminers[examinerIndex],
            scores: { ...newExaminers[examinerIndex].scores, [taskId]: num }
        };
        setExamPieceExaminers(newExaminers);
    };

    // --- Theorie Handlers ---
    const handleTheoryChange = (subjectId: string, field: 'writtenPoints' | 'oralPoints', val: string) => {
        const num = Math.min(100, Math.max(0, Number(val) || 0));
        setTheoryScores(prev => prev.map(ts =>
            ts.subjectId === subjectId ? { ...ts, [field]: num } : ts
        ));
    };

    // --- Save ---
    const handleSave = () => {
        if (!student) return;
        if (examiners.length < 3) {
            alert("Es müssen mindestens 3 Prüfer für die Arbeitsaufgaben sein.");
            return;
        }
        if (sheet.examPiece && examPieceExaminers.length < 3) {
            alert("Es müssen mindestens 3 Prüfer für das Prüfungsstück sein.");
            return;
        }

        const grade: Grade = {
            studentId: student.id,
            sheetId: sheet.id,
            examiners,
            examPieceExaminers: sheet.examPiece ? examPieceExaminers : undefined,
            theoryScores: sheet.theorySubjects ? theoryScores : undefined,
            date: new Date().toISOString()
        };
        saveGrade(grade);
        alert("Benotung gespeichert!");
    };

    // --- Calculations ---
    const getAvgScoreForTask = (taskId: string, examinerList: ExaminerGrade[]) => {
        if (examinerList.length === 0) return 0;
        const sum = examinerList.reduce((acc, ex) => acc + (ex.scores[taskId] || 0), 0);
        return sum / examinerList.length;
    };

    // Arbeitsaufgaben Berechnung (70%)
    const workTasksMaxPoints = sheet.tasks.reduce((sum, task) => sum + (task.maxPoints * task.weight), 0);
    const workTasksCurrentPoints = sheet.tasks.reduce((sum, task) => {
        const avgScore = getAvgScoreForTask(task.id, examiners);
        return sum + (avgScore * task.weight);
    }, 0);
    const workTasksGrade = calculateGrade(workTasksCurrentPoints, workTasksMaxPoints);

    // Prüfungsstück Berechnung (30%)
    const examPieceMaxPoints = sheet.examPiece ? sheet.examPiece.maxPoints : 0;
    const examPieceCurrentPoints = sheet.examPiece
        ? getAvgScoreForTask(sheet.examPiece.id, examPieceExaminers)
        : 0;
    const examPieceGrade = sheet.examPiece ? calculateGrade(examPieceCurrentPoints, examPieceMaxPoints) : null;

    // Praxis Gesamt (70% Arbeitsaufgaben + 30% Prüfungsstück)
    const practicalTotalPoints = (workTasksCurrentPoints * sheet.workTaskWeight) +
        (examPieceCurrentPoints * sheet.examPieceWeight);
    const practicalMaxPoints = (workTasksMaxPoints * sheet.workTaskWeight) +
        (examPieceMaxPoints * sheet.examPieceWeight);
    const practicalGrade = calculateGrade(practicalTotalPoints, practicalMaxPoints);

    // Theorie Berechnung (nur Teil 2)
    // Mündlich ist optional: Wenn nicht eingetragen, zählt nur Schriftlich
    // Wenn eingetragen, kann es die Note nur verbessern (nicht verschlechtern)
    const calculateTheoryGrade = () => {
        if (!sheet.theorySubjects || theoryScores.length === 0) return null;

        let totalWeightedPoints = 0;
        let totalWeight = 0;

        sheet.theorySubjects.forEach(subject => {
            const score = theoryScores.find(ts => ts.subjectId === subject.id);
            if (score) {
                const writtenPoints = score.writtenPoints || 0;
                const oralPoints = score.oralPoints || 0;

                let subjectPoints: number;

                if (oralPoints === 0) {
                    // Keine mündliche Note eingetragen: nur schriftlich zählt
                    subjectPoints = writtenPoints;
                } else {
                    // Mündlich eingetragen: gewichteter Durchschnitt (Schriftlich ×2 + Mündlich ×1)
                    const weightedWithOral = (writtenPoints * subject.writtenWeight + oralPoints * subject.oralWeight) / (subject.writtenWeight + subject.oralWeight);
                    // Mündlich kann nur verbessern, nicht verschlechtern
                    subjectPoints = Math.max(writtenPoints, weightedWithOral);
                }

                totalWeightedPoints += subjectPoints;
                totalWeight += 1;
            }
        });

        const avgTheoryPoints = totalWeight > 0 ? totalWeightedPoints / totalWeight : 0;
        return calculateGrade(avgTheoryPoints, 100);
    };

    const theoryGrade = calculateTheoryGrade();

    // Check if student has grade for this sheet
    const hasGradeForSheet = (studentId: string, sheetId: string) => {
        return data.grades.some(g => g.studentId === studentId && g.sheetId === sheetId);
    };

    // Berechne Gesamtpunkte für beide Teile (für Bestanden-Anzeige)
    const calculateTotalPointsForStudent = (studentId: string) => {
        const gradePart1 = data.grades.find(g => g.studentId === studentId && g.sheetId === 'part1');
        const gradePart2 = data.grades.find(g => g.studentId === studentId && g.sheetId === 'part2');
        const sheetPart1 = data.sheets.find(s => s.id === 'part1');
        const sheetPart2 = data.sheets.find(s => s.id === 'part2');

        if (!gradePart1 || !gradePart2 || !sheetPart1 || !sheetPart2) return null;

        // Teil 1 Punkte berechnen
        const getAvgForGrade = (grade: Grade, tasks: typeof sheetPart1.tasks) => {
            return tasks.reduce((sum, task) => {
                const avgScore = grade.examiners.reduce((acc, ex) => acc + (ex.scores[task.id] || 0), 0) / grade.examiners.length;
                return sum + (avgScore * task.weight);
            }, 0);
        };

        const getExamPieceAvg = (grade: Grade, examPieceId: string) => {
            if (!grade.examPieceExaminers || grade.examPieceExaminers.length === 0) return 0;
            return grade.examPieceExaminers.reduce((acc, ex) => acc + (ex.scores[examPieceId] || 0), 0) / grade.examPieceExaminers.length;
        };

        // Teil 1: Arbeitsaufgaben (70%) + Prüfungsstück (30%)
        const part1WorkTasks = getAvgForGrade(gradePart1, sheetPart1.tasks);
        const part1ExamPiece = sheetPart1.examPiece ? getExamPieceAvg(gradePart1, sheetPart1.examPiece.id) : 0;
        const part1Total = (part1WorkTasks * sheetPart1.workTaskWeight) + (part1ExamPiece * sheetPart1.examPieceWeight);

        // Teil 2: Arbeitsaufgaben (70%) + Prüfungsstück (30%)
        const part2WorkTasks = getAvgForGrade(gradePart2, sheetPart2.tasks);
        const part2ExamPiece = sheetPart2.examPiece ? getExamPieceAvg(gradePart2, sheetPart2.examPiece.id) : 0;
        const part2Total = (part2WorkTasks * sheetPart2.workTaskWeight) + (part2ExamPiece * sheetPart2.examPieceWeight);

        // Gesamtpunkte: Teil 1 (25%) + Teil 2 (75%)
        // Teil 1 max = 100 Punkte, Teil 2 max = 100 Punkte
        // Gewichtet: 100 × 0.25 + 100 × 0.75 = 25 + 75 = 100 Punkte Maximum
        // Bestehensgrenze: 50 Punkte (50%) - "Wenn jeder Prüfer 50 gibt, besteht man"
        const totalPoints = (part1Total * 0.25) + (part2Total * 0.75);

        return {
            part1Points: part1Total,
            part2Points: part2Total,
            totalPoints: totalPoints,
            passed: totalPoints >= 50
        };
    };

    // Berechne für aktuellen Studenten
    const totalResult = student ? calculateTotalPointsForStudent(student.id) : null;

    // Berechne Top 3 Prüflinge für Medaillen (Gold, Silber, Bronze)
    const topStudents = useMemo(() => {
        const studentsWithPoints: { id: string; points: number }[] = [];

        data.students.filter(s => s.isActive).forEach(s => {
            const gradePart1 = data.grades.find(g => g.studentId === s.id && g.sheetId === 'part1');
            const gradePart2 = data.grades.find(g => g.studentId === s.id && g.sheetId === 'part2');
            const sheetPart1 = data.sheets.find(sh => sh.id === 'part1');
            const sheetPart2 = data.sheets.find(sh => sh.id === 'part2');

            // Mindestens Teil 1 muss benotet sein
            if (!gradePart1 || !sheetPart1) return;

            const getAvgForGrade = (grade: Grade, tasks: typeof sheetPart1.tasks) => {
                return tasks.reduce((sum, task) => {
                    const avgScore = grade.examiners.reduce((acc, ex) => acc + (ex.scores[task.id] || 0), 0) / grade.examiners.length;
                    return sum + (avgScore * task.weight);
                }, 0);
            };

            const getExamPieceAvg = (grade: Grade, examPieceId: string) => {
                if (!grade.examPieceExaminers || grade.examPieceExaminers.length === 0) return 0;
                return grade.examPieceExaminers.reduce((acc, ex) => acc + (ex.scores[examPieceId] || 0), 0) / grade.examPieceExaminers.length;
            };

            // Teil 1 Punkte
            const part1WorkTasks = getAvgForGrade(gradePart1, sheetPart1.tasks);
            const part1ExamPiece = sheetPart1.examPiece ? getExamPieceAvg(gradePart1, sheetPart1.examPiece.id) : 0;
            const part1Total = (part1WorkTasks * sheetPart1.workTaskWeight) + (part1ExamPiece * sheetPart1.examPieceWeight);

            let totalPoints = part1Total * 0.25; // Teil 1 = 25%

            // Teil 2 hinzufügen wenn vorhanden
            if (gradePart2 && sheetPart2) {
                const part2WorkTasks = getAvgForGrade(gradePart2, sheetPart2.tasks);
                const part2ExamPiece = sheetPart2.examPiece ? getExamPieceAvg(gradePart2, sheetPart2.examPiece.id) : 0;
                const part2Total = (part2WorkTasks * sheetPart2.workTaskWeight) + (part2ExamPiece * sheetPart2.examPieceWeight);
                totalPoints += part2Total * 0.75; // Teil 2 = 75%
            }

            studentsWithPoints.push({ id: s.id, points: totalPoints });
        });

        // Sortieren nach Punkten (höchste zuerst) und Top 3 nehmen
        const sorted = studentsWithPoints.sort((a, b) => b.points - a.points);
        const result: Record<string, 1 | 2 | 3> = {};

        if (sorted.length >= 1 && sorted[0].points > 0) result[sorted[0].id] = 1; // Gold
        if (sorted.length >= 2 && sorted[1].points > 0) result[sorted[1].id] = 2; // Silber
        if (sorted.length >= 3 && sorted[2].points > 0) result[sorted[2].id] = 3; // Bronze

        return result;
    }, [data.students, data.grades, data.sheets]);

    // Berechne alle Ergebnisse für das Prüfungszeugnis
    const calculateZeugnisResults = (studentId: string) => {
        const gradePart1 = data.grades.find(g => g.studentId === studentId && g.sheetId === 'part1');
        const gradePart2 = data.grades.find(g => g.studentId === studentId && g.sheetId === 'part2');
        const sheetPart1 = data.sheets.find(s => s.id === 'part1');
        const sheetPart2 = data.sheets.find(s => s.id === 'part2');

        if (!gradePart1 || !gradePart2 || !sheetPart1 || !sheetPart2) return null;

        // Helper functions
        const getAvgForGrade = (grade: Grade, tasks: typeof sheetPart1.tasks) => {
            return tasks.reduce((sum, task) => {
                const avgScore = grade.examiners.reduce((acc, ex) => acc + (ex.scores[task.id] || 0), 0) / grade.examiners.length;
                return sum + (avgScore * task.weight);
            }, 0);
        };

        const getExamPieceAvg = (grade: Grade, examPieceId: string) => {
            if (!grade.examPieceExaminers || grade.examPieceExaminers.length === 0) return 0;
            return grade.examPieceExaminers.reduce((acc, ex) => acc + (ex.scores[examPieceId] || 0), 0) / grade.examPieceExaminers.length;
        };

        const getGradeValue = (points: number, maxPoints: number) => {
            const percent = maxPoints > 0 ? (points / maxPoints) * 100 : 0;
            if (percent >= 92) return 1;
            if (percent >= 81) return 2;
            if (percent >= 67) return 3;
            if (percent >= 50) return 4;
            if (percent >= 30) return 5;
            return 6;
        };

        // Teil 1
        const part1WorkTasks = getAvgForGrade(gradePart1, sheetPart1.tasks);
        const part1ExamPiece = sheetPart1.examPiece ? getExamPieceAvg(gradePart1, sheetPart1.examPiece.id) : 0;
        const teil1Points = (part1WorkTasks * sheetPart1.workTaskWeight) + (part1ExamPiece * sheetPart1.examPieceWeight);
        const teil1Grade = getGradeValue(teil1Points, 100);

        // Teil 2 Praxis
        const part2WorkTasks = getAvgForGrade(gradePart2, sheetPart2.tasks);
        const part2ExamPiece = sheetPart2.examPiece ? getExamPieceAvg(gradePart2, sheetPart2.examPiece.id) : 0;
        const teil2PraxisPoints = (part2WorkTasks * sheetPart2.workTaskWeight) + (part2ExamPiece * sheetPart2.examPieceWeight);
        const teil2PraxisGrade = getGradeValue(teil2PraxisPoints, 100);

        // Wahlqualifikation (letzte Arbeitsaufgabe in Teil 2)
        const wahlqualifikationTask = sheetPart2.tasks.find(t => t.name.toLowerCase().includes('wahlqualifikation'));
        const wahlqualifikationPoints = wahlqualifikationTask
            ? gradePart2.examiners.reduce((acc, ex) => acc + (ex.scores[wahlqualifikationTask.id] || 0), 0) / gradePart2.examiners.length
            : 0;
        const wahlqualifikationGrade = getGradeValue(wahlqualifikationPoints, 100);

        // Theorie - Mündlich optional: nur verwenden wenn eingetragen und verbessert
        const getTheoryPoints = (subjectName: string) => {
            const subject = sheetPart2.theorySubjects?.find(s => s.name.toLowerCase().includes(subjectName.toLowerCase()));
            if (!subject || !gradePart2.theoryScores) return 0;
            const score = gradePart2.theoryScores.find(ts => ts.subjectId === subject.id);
            if (!score) return 0;

            const written = score.writtenPoints || 0;
            const oral = score.oralPoints || 0;

            if (oral === 0) {
                return written;
            } else {
                const weightedWithOral = (written * subject.writtenWeight + oral * subject.oralWeight) / (subject.writtenWeight + subject.oralWeight);
                return Math.max(written, weightedWithOral);
            }
        };

        const friseurtechnikenPoints = getTheoryPoints('friseurtechniken');
        const betriebsorgPoints = getTheoryPoints('betriebsorganisation');
        const wisoPoints = getTheoryPoints('wirtschafts');

        // Teil 2 Gesamt (Praxis + Theorie gemittelt)
        const theoryAvg = (friseurtechnikenPoints + betriebsorgPoints + wisoPoints) / 3;
        const teil2GesamtPoints = teil2PraxisPoints; // Vereinfacht: nur Praxis für Gesamtpunkte
        const teil2GesamtGrade = getGradeValue(teil2GesamtPoints, 100);

        // Gesamtergebnis
        const gesamtPoints = (teil1Points * 0.25) + (teil2GesamtPoints * 0.75);
        const gesamtGrade = getGradeValue(gesamtPoints, 100);
        const passed = gesamtPoints >= 50;

        return {
            teil1Points,
            teil1Grade,
            teil2PraxisPoints,
            teil2PraxisGrade,
            wahlqualifikationPoints,
            wahlqualifikationGrade,
            friseurtechnikenPoints,
            friseurtechnikenGrade: getGradeValue(friseurtechnikenPoints, 100),
            betriebsorgPoints,
            betriebsorgGrade: getGradeValue(betriebsorgPoints, 100),
            wisoPoints,
            wisoGrade: getGradeValue(wisoPoints, 100),
            teil2GesamtPoints,
            teil2GesamtGrade,
            gesamtPoints,
            gesamtGrade,
            passed
        };
    };

    const zeugnisResults = student ? calculateZeugnisResults(student.id) : null;

    if (!data.students.length) {
        return <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-xl border border-slate-700">Bitte legen Sie zuerst Prüflinge an.</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-100px)]">
            {/* Sidebar - Chrome Style */}
            <div className="lg:col-span-1 relative rounded-xl border border-slate-700 overflow-hidden flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl">
                {/* Chrome Shine */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="p-4 bg-gradient-to-b from-slate-700 to-slate-800 border-b border-slate-600 font-semibold text-slate-200 relative z-10">
                    Prüfling auswählen
                </div>
                <div className="flex-1 overflow-y-auto relative z-10">
                    {/* Active students first, then inactive - sorted by exam number */}
                    {[...data.students]
                        .sort((a, b) => {
                            // Active students first
                            if (a.isActive && !b.isActive) return -1;
                            if (!a.isActive && b.isActive) return 1;
                            // Then sort by exam number (numeric if possible)
                            const numA = parseInt(a.examNumber) || 0;
                            const numB = parseInt(b.examNumber) || 0;
                            if (numA !== numB) return numA - numB;
                            // Fallback to string comparison if same numeric value
                            return a.examNumber.localeCompare(b.examNumber);
                        })
                        .map(s => {
                        const hasGradePart1 = hasGradeForSheet(s.id, 'part1');
                        const hasGradePart2 = hasGradeForSheet(s.id, 'part2');
                        const studentResult = calculateTotalPointsForStudent(s.id);
                        const hasBothGrades = hasGradePart1 && hasGradePart2;
                        const notPassed = hasBothGrades && studentResult && !studentResult.passed;
                        return (
                            <button
                                key={s.id}
                                onClick={() => setSelectedStudentId(s.id)}
                                className={cn(
                                    "w-full text-left px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors group",
                                    selectedStudentId === s.id ? "bg-cyan-900/30 border-l-4 border-l-cyan-500" : "border-l-4 border-l-transparent",
                                    !s.isActive && "opacity-50"
                                )}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    {/* Links: Name + Infos */}
                                    <div className="flex-1 min-w-0">
                                        {/* Zeile 1: Name + Medaille */}
                                        <div className={cn(
                                            "font-semibold truncate flex items-center gap-1.5",
                                            s.isActive ? "text-slate-100" : "text-slate-500"
                                        )}>
                                            {topStudents[s.id] === 1 && <span className="text-yellow-400" title="1. Platz - Gold">🥇</span>}
                                            {topStudents[s.id] === 2 && <span className="text-slate-300" title="2. Platz - Silber">🥈</span>}
                                            {topStudents[s.id] === 3 && <span className="text-amber-600" title="3. Platz - Bronze">🥉</span>}
                                            {s.firstName} {s.lastName}
                                        </div>
                                        {/* Zeile 2: Prüfungsnummer + Salon */}
                                        <div className="flex items-center gap-2 text-xs mt-0.5">
                                            <span className="font-mono text-cyan-400 font-medium">{s.examNumber}</span>
                                            <span className="text-slate-600">•</span>
                                            <span className="text-slate-500 truncate">{s.salon}</span>
                                            {!s.isActive && <span className="text-slate-600">(pausiert)</span>}
                                        </div>
                                    </div>
                                    {/* Rechts: Status-Badges */}
                                    <div className="flex gap-1.5 items-center flex-shrink-0">
                                        {notPassed && (
                                            <AlertCircle size={14} className="text-red-400" title="Nicht bestanden" />
                                        )}
                                        {hasGradePart1 && <span className="text-xs bg-emerald-900/50 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">T1</span>}
                                        {hasGradePart2 && <span className="text-xs bg-blue-900/50 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">T2</span>}
                                        {!hasGradePart1 && !hasGradePart2 && <ChevronRight size={16} className="text-slate-600 opacity-0 group-hover:opacity-100" />}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Area */}
            <div className="lg:col-span-3 space-y-6 overflow-y-auto pr-2 pb-10">
                {student ? (
                    <>
                        {/* Header mit Prüfling Info und Teil-Auswahl - Chrome Style */}
                        <div className="relative p-6 rounded-xl border border-slate-700 shadow-xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900">
                            {/* Chrome Shine */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">{student.firstName} {student.lastName}</h2>
                                    <p className="text-slate-400">Prüfungsnummer: {student.examNumber}</p>
                                </div>

                                {/* Bestanden-Anzeige + Teil-Auswahl Tabs */}
                                <div className="flex items-center gap-4">
                                    {/* Bestanden/Nicht Bestanden Anzeige */}
                                    {totalResult && (
                                        <div className={cn(
                                            "px-4 py-2 rounded-lg font-bold text-sm border-2 shadow-lg",
                                            totalResult.passed
                                                ? "bg-gradient-to-b from-emerald-600/30 to-emerald-800/30 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20"
                                                : "bg-gradient-to-b from-red-600/30 to-red-800/30 text-red-300 border-red-500/50 shadow-red-500/20"
                                        )}>
                                            <div className="text-center">
                                                <span className="block text-lg">{totalResult.passed ? "BESTANDEN" : "NICHT BESTANDEN"}</span>
                                                <span className="block text-xs font-normal">{totalResult.totalPoints.toFixed(2)} / 100 Punkte</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Teil-Auswahl Tabs */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedSheetId('part1')}
                                            className={cn(
                                                "px-4 py-2 rounded-lg font-medium transition-all border",
                                                selectedSheetId === 'part1'
                                                    ? "bg-gradient-to-b from-cyan-500 to-blue-600 text-white border-cyan-400/30 shadow-lg shadow-cyan-500/25"
                                                    : "bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600"
                                            )}
                                        >
                                            Teil 1 (25%)
                                        </button>
                                        <button
                                            onClick={() => setSelectedSheetId('part2')}
                                            className={cn(
                                                "px-4 py-2 rounded-lg font-medium transition-all border",
                                                selectedSheetId === 'part2'
                                                    ? "bg-gradient-to-b from-cyan-500 to-blue-600 text-white border-cyan-400/30 shadow-lg shadow-cyan-500/25"
                                                    : "bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600"
                                            )}
                                        >
                                            Teil 2 (75%)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Globale Prüferzuweisung */}
                            <div className="relative z-10 mt-4 pt-4 border-t border-slate-700">
                                <GlobalExaminerSelector teil={currentTeil as 1 | 2} />
                            </div>

                            {/* Ergebnis-Übersicht */}
                            <div className="relative z-10 mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className={cn("p-3 rounded-lg border text-center bg-slate-800/50", getGradeColor(workTasksGrade.value))}>
                                    <span className="text-xs font-bold uppercase block text-slate-400">Arbeitsaufgaben</span>
                                    <span className="text-2xl font-black">{workTasksGrade.value}</span>
                                    <span className="text-sm block">{workTasksCurrentPoints.toFixed(2)} Pkt.</span>
                                    <span className="text-xs text-slate-500 block">= {(workTasksCurrentPoints * sheet.workTaskWeight).toFixed(2)} (×{(sheet.workTaskWeight * 100).toFixed(0)}%)</span>
                                </div>
                                {sheet.examPiece && examPieceGrade && (
                                    <div className={cn("p-3 rounded-lg border text-center bg-slate-800/50", getGradeColor(examPieceGrade.value))}>
                                        <span className="text-xs font-bold uppercase block text-slate-400">Prüfungsstück</span>
                                        <span className="text-2xl font-black">{examPieceGrade.value}</span>
                                        <span className="text-sm block">{examPieceCurrentPoints.toFixed(2)} Pkt.</span>
                                        <span className="text-xs text-slate-500 block">= {(examPieceCurrentPoints * sheet.examPieceWeight).toFixed(2)} (×{(sheet.examPieceWeight * 100).toFixed(0)}%)</span>
                                    </div>
                                )}
                                <div className={cn("p-3 rounded-lg border text-center bg-slate-800/50", getGradeColor(practicalGrade.value))}>
                                    <span className="text-xs font-bold uppercase block text-slate-400">Praxis Gesamt</span>
                                    <span className="text-2xl font-black">{practicalGrade.value}</span>
                                    <span className="text-sm font-bold block">{practicalTotalPoints.toFixed(2)} Pkt.</span>
                                    <span className="text-xs text-slate-500 block">(Summe gewichtet)</span>
                                </div>
                                {theoryGrade && (
                                    <div className={cn("p-3 rounded-lg border text-center bg-slate-800/50", getGradeColor(theoryGrade.value))}>
                                        <span className="text-xs font-bold uppercase block text-slate-400">Theorie</span>
                                        <span className="text-2xl font-black">{theoryGrade.value}</span>
                                        <span className="text-sm block">{theoryGrade.label}</span>
                                        <span className="text-xs text-slate-500 block">(Durchschnitt)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SECTION 1: Arbeitsaufgaben - Chrome Style */}
                        <div className="relative rounded-xl border border-slate-700 shadow-xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
                            {/* Chrome Shine */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                            <div className="p-4 bg-gradient-to-b from-cyan-900/50 to-cyan-950/50 border-b border-cyan-700/50 flex items-center gap-2 relative z-10">
                                <Scissors size={20} className="text-cyan-400" />
                                <h3 className="font-bold text-cyan-200">Arbeitsaufgaben (Gewichtung: {(sheet.workTaskWeight * 100).toFixed(0)}%)</h3>
                            </div>

                            {/* Prüfer Management - Arbeitsaufgaben */}
                            <div className="p-4 border-b border-slate-700/50 relative z-10">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                        <Users size={16} /> Prüfungskommission ({examiners.length})
                                    </span>
                                    <button onClick={addExaminer} disabled={examiners.length >= 5} className="text-xs flex items-center gap-1 bg-cyan-900/50 text-cyan-300 px-3 py-1 rounded-full disabled:opacity-50 hover:bg-cyan-800/50 border border-cyan-700/30 transition-colors">
                                        <UserPlus size={14} /> + Prüfer
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {examiners.map((ex, idx) => (
                                        <div key={ex.id} className="flex items-center gap-2 bg-slate-700/50 p-2 rounded-lg border border-slate-600/50">
                                            <span className="text-xs font-bold text-slate-500 w-5">#{idx + 1}</span>
                                            {prueferpool.filter(p => p.isActive).length > 0 ? (
                                                <select
                                                    className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none min-w-32"
                                                    value={ex.name}
                                                    onChange={(e) => handleNameChange(idx, e.target.value)}
                                                >
                                                    <option value="">-- Prüfer wählen --</option>
                                                    {prueferpool.filter(p => p.isActive).map(p => (
                                                        <option key={p.id} value={p.name}>
                                                            {p.name} {p.rolle ? `(${p.rolle})` : ''}
                                                        </option>
                                                    ))}
                                                    {/* Falls der aktuelle Wert nicht im Pool ist, zeige ihn trotzdem */}
                                                    {ex.name && !prueferpool.find(p => p.name === ex.name && p.isActive) && (
                                                        <option value={ex.name}>{ex.name} (nicht im Pool)</option>
                                                    )}
                                                </select>
                                            ) : (
                                                <input
                                                    className="bg-transparent border-b border-slate-500 focus:border-cyan-400 outline-none text-sm w-28 text-slate-200"
                                                    value={ex.name}
                                                    placeholder="Name eingeben"
                                                    onChange={(e) => handleNameChange(idx, e.target.value)}
                                                />
                                            )}
                                            {examiners.length > 3 && (
                                                <button onClick={() => removeExaminer(idx)} className="text-slate-500 hover:text-red-400 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {examiners.length < 3 && <div className="mt-2 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} /> Min. 3 Prüfer erforderlich</div>}
                                {prueferpool.filter(p => p.isActive).length === 0 && (
                                    <div className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                                        <AlertCircle size={12} /> Tipp: Prüfer im Prüferpool (Einstellungen) anlegen für schnellere Auswahl
                                    </div>
                                )}
                            </div>

                            {/* Arbeitsaufgaben Tabelle */}
                            <div className="overflow-x-auto relative z-10">
                                <table className="w-full text-left min-w-[700px]">
                                    <thead className="bg-slate-800/80 border-b border-slate-700 text-xs uppercase text-slate-400">
                                        <tr>
                                            <th className="p-3 w-10">#</th>
                                            <th className="p-3 min-w-[180px]">Aufgabe</th>
                                            <th className="p-3 text-center w-14">Faktor</th>
                                            {examiners.map((ex) => (
                                                <th key={ex.id} className="p-2 text-center w-20 bg-cyan-900/20 border-l border-slate-700">
                                                    <div className="truncate text-cyan-300" title={ex.name}>{ex.name}</div>
                                                </th>
                                            ))}
                                            <th className="p-3 text-right w-16 border-l border-slate-700">Ø</th>
                                            <th className="p-3 text-right w-16">Gew.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {sheet.tasks.map((task, i) => {
                                            const avgScore = getAvgScoreForTask(task.id, examiners);
                                            const weighted = avgScore * task.weight;
                                            return (
                                                <tr key={task.id} className="hover:bg-slate-800/50">
                                                    <td className="p-3 text-slate-500 font-mono text-sm">{i + 1}</td>
                                                    <td className="p-3 font-medium text-slate-200 text-sm">{task.name}</td>
                                                    <td className="p-3 text-center text-slate-500 text-xs">×{task.weight}</td>
                                                    {examiners.map((ex, exIdx) => (
                                                        <td key={ex.id} className="p-1 text-center border-l border-slate-700/50">
                                                            <input
                                                                type="number"
                                                                min="0" max="100"
                                                                className="w-full p-1.5 bg-slate-700 border border-slate-600 rounded text-center text-sm font-medium text-slate-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none"
                                                                value={ex.scores[task.id] ?? ""}
                                                                placeholder="-"
                                                                onChange={(e) => handleScoreChange(exIdx, task.id, e.target.value)}
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="p-3 text-right font-mono text-slate-400 border-l border-slate-700 text-sm">{avgScore.toFixed(2)}</td>
                                                    <td className="p-3 text-right font-mono font-bold text-slate-200 text-sm">{weighted.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-slate-800/80 border-t border-slate-700">
                                        <tr className="border-b border-slate-700">
                                            <td colSpan={3 + examiners.length} className="p-3 text-right font-medium text-slate-400">Summe Arbeitsaufgaben</td>
                                            <td colSpan={2} className="p-3 text-right border-l border-slate-700 font-mono text-slate-200">{workTasksCurrentPoints.toFixed(2)}</td>
                                        </tr>
                                        <tr className="bg-cyan-900/30">
                                            <td colSpan={3 + examiners.length} className="p-3 text-right font-bold text-cyan-300">
                                                × {sheet.workTaskWeight} (Gewichtung {(sheet.workTaskWeight * 100).toFixed(0)}%)
                                            </td>
                                            <td colSpan={2} className="p-3 text-right border-l border-cyan-700/30 font-mono font-bold text-cyan-300">
                                                {(workTasksCurrentPoints * sheet.workTaskWeight).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* SECTION 2: Prüfungsstück - Chrome Style */}
                        {sheet.examPiece && (
                            <div className="relative rounded-xl border border-slate-700 shadow-xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
                                {/* Chrome Shine */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                <div className="p-4 bg-gradient-to-b from-amber-900/50 to-amber-950/50 border-b border-amber-700/50 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap size={20} className="text-amber-400" />
                                        <h3 className="font-bold text-amber-200">Prüfungsstück (Gewichtung: {(sheet.examPieceWeight * 100).toFixed(0)}%)</h3>
                                    </div>
                                    <span className="text-xs text-amber-300 bg-amber-900/50 px-2 py-1 rounded border border-amber-700/30">Gleiche Prüfungskommission</span>
                                </div>

                                {/* Prüfungsstück Tabelle */}
                                <div className="overflow-x-auto relative z-10">
                                    <table className="w-full text-left min-w-[600px]">
                                        <thead className="bg-slate-800/80 border-b border-slate-700 text-xs uppercase text-slate-400">
                                            <tr>
                                                <th className="p-3 min-w-[200px]">Prüfungsstück</th>
                                                {examPieceExaminers.map((ex) => (
                                                    <th key={ex.id} className="p-2 text-center w-20 bg-amber-900/20 border-l border-slate-700">
                                                        <div className="truncate text-amber-300" title={ex.name}>{ex.name}</div>
                                                    </th>
                                                ))}
                                                <th className="p-3 text-right w-20 border-l border-slate-700">Ø Punkte</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="hover:bg-slate-800/50">
                                                <td className="p-3 font-medium text-slate-200">{sheet.examPiece.name}</td>
                                                {examPieceExaminers.map((ex, exIdx) => (
                                                    <td key={ex.id} className="p-1 text-center border-l border-slate-700/50">
                                                        <input
                                                            type="number"
                                                            min="0" max="100"
                                                            className="w-full p-1.5 bg-slate-700 border border-slate-600 rounded text-center text-sm font-medium text-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                                            value={ex.scores[sheet.examPiece!.id] ?? ""}
                                                            placeholder="-"
                                                            onChange={(e) => handleExamPieceScoreChange(exIdx, sheet.examPiece!.id, e.target.value)}
                                                        />
                                                    </td>
                                                ))}
                                                <td className="p-3 text-right font-mono text-slate-200 border-l border-slate-700">
                                                    {examPieceCurrentPoints.toFixed(2)}
                                                </td>
                                            </tr>
                                        </tbody>
                                        <tfoot className="bg-slate-800/80 border-t border-slate-700">
                                            <tr className="bg-amber-900/30">
                                                <td colSpan={1 + examPieceExaminers.length} className="p-3 text-right font-bold text-amber-300">
                                                    × {sheet.examPieceWeight} (Gewichtung {(sheet.examPieceWeight * 100).toFixed(0)}%)
                                                </td>
                                                <td className="p-3 text-right border-l border-amber-700/30 font-mono font-bold text-amber-300">
                                                    {(examPieceCurrentPoints * sheet.examPieceWeight).toFixed(2)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* SECTION 3: Theorie (nur Teil 2) - Chrome Style */}
                        {sheet.theorySubjects && sheet.theorySubjects.length > 0 && (
                            <div className="relative rounded-xl border border-slate-700 shadow-xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
                                {/* Chrome Shine */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                <div className="p-4 bg-gradient-to-b from-emerald-900/50 to-emerald-950/50 border-b border-emerald-700/50 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={20} className="text-emerald-400" />
                                        <h3 className="font-bold text-emerald-200">Theorieprüfung</h3>
                                    </div>
                                    <span className="text-xs text-emerald-300 bg-emerald-900/50 px-2 py-1 rounded border border-emerald-700/30">Mündlich optional - kann nur verbessern</span>
                                </div>

                                <div className="overflow-x-auto relative z-10">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-800/80 border-b border-slate-700 text-xs uppercase text-slate-400">
                                            <tr>
                                                <th className="p-3 min-w-[200px]">Prüfungsbereich</th>
                                                <th className="p-3 text-center w-32">Schriftlich (×2)</th>
                                                <th className="p-3 text-center w-32">Mündlich (×1)</th>
                                                <th className="p-3 text-right w-24">Ø Punkte</th>
                                                <th className="p-3 text-right w-20">Note</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/50">
                                            {sheet.theorySubjects.map((subject) => {
                                                const score = theoryScores.find(ts => ts.subjectId === subject.id);
                                                const written = score?.writtenPoints || 0;
                                                const oral = score?.oralPoints || 0;
                                                // Mündlich optional: nur verwenden wenn eingetragen und verbessert
                                                let finalPoints: number;
                                                if (oral === 0) {
                                                    finalPoints = written;
                                                } else {
                                                    const weightedWithOral = (written * subject.writtenWeight + oral * subject.oralWeight) / (subject.writtenWeight + subject.oralWeight);
                                                    finalPoints = Math.max(written, weightedWithOral);
                                                }
                                                const grade = calculateGrade(finalPoints, 100);
                                                return (
                                                    <tr key={subject.id} className="hover:bg-slate-800/50">
                                                        <td className="p-3 font-medium text-slate-200">{subject.name}</td>
                                                        <td className="p-1 text-center">
                                                            <input
                                                                type="number"
                                                                min="0" max="100"
                                                                className="w-24 p-1.5 bg-slate-700 border border-slate-600 rounded text-center text-sm font-medium text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                                                value={score?.writtenPoints || ""}
                                                                placeholder="-"
                                                                onChange={(e) => handleTheoryChange(subject.id, 'writtenPoints', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="p-1 text-center">
                                                            <input
                                                                type="number"
                                                                min="0" max="100"
                                                                className="w-24 p-1.5 bg-slate-700 border border-slate-600 rounded text-center text-sm font-medium text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                                                value={score?.oralPoints || ""}
                                                                placeholder="-"
                                                                onChange={(e) => handleTheoryChange(subject.id, 'oralPoints', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="p-3 text-right font-mono text-slate-400">{finalPoints.toFixed(2)}</td>
                                                        <td className={cn("p-3 text-right font-bold", getGradeColor(grade.value))}>{grade.value}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        {theoryGrade && (
                                            <tfoot className="bg-slate-800/80 border-t border-slate-700 font-bold">
                                                <tr>
                                                    <td colSpan={3} className="p-3 text-right text-slate-300">Theorie Gesamtnote</td>
                                                    <td className="p-3 text-right"></td>
                                                    <td className={cn("p-3 text-right text-lg", getGradeColor(theoryGrade.value))}>{theoryGrade.value}</td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* SECTION 4: Zusammenfassung Teil - Chrome Style */}
                        <div className="relative rounded-xl border border-slate-700 shadow-xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
                            {/* Chrome Shine */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                            <div className="p-4 bg-gradient-to-b from-slate-700 to-slate-800 border-b border-slate-600 relative z-10">
                                <h3 className="font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Zusammenfassung {sheet.name}</h3>
                            </div>
                            <div className="p-4 relative z-10">
                                <table className="w-full text-sm">
                                    <tbody>
                                        <tr className="border-b border-slate-700/50">
                                            <td className="py-2 text-slate-400">Arbeitsaufgaben (Summe)</td>
                                            <td className="py-2 text-right font-mono text-slate-200">{workTasksCurrentPoints.toFixed(2)}</td>
                                            <td className="py-2 text-center text-slate-500 px-2">×</td>
                                            <td className="py-2 text-center font-mono text-slate-200">{sheet.workTaskWeight}</td>
                                            <td className="py-2 text-center text-slate-500 px-2">=</td>
                                            <td className="py-2 text-right font-mono font-bold text-cyan-400">{(workTasksCurrentPoints * sheet.workTaskWeight).toFixed(2)}</td>
                                        </tr>
                                        {sheet.examPiece && (
                                            <tr className="border-b border-slate-700/50">
                                                <td className="py-2 text-slate-400">Prüfungsstück (Ø)</td>
                                                <td className="py-2 text-right font-mono text-slate-200">{examPieceCurrentPoints.toFixed(2)}</td>
                                                <td className="py-2 text-center text-slate-500 px-2">×</td>
                                                <td className="py-2 text-center font-mono text-slate-200">{sheet.examPieceWeight}</td>
                                                <td className="py-2 text-center text-slate-500 px-2">=</td>
                                                <td className="py-2 text-right font-mono font-bold text-amber-400">{(examPieceCurrentPoints * sheet.examPieceWeight).toFixed(2)}</td>
                                            </tr>
                                        )}
                                        <tr className="bg-slate-800/50 font-bold">
                                            <td colSpan={5} className="py-3 text-right pr-4 text-slate-300">Teil {sheet.part} Gesamt:</td>
                                            <td className="py-3 text-right font-mono text-lg text-white">{practicalTotalPoints.toFixed(2)} Pkt.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Action Buttons - Chrome Style */}
                        <div className="relative p-6 rounded-xl border border-slate-700 shadow-xl flex flex-wrap justify-end gap-4 sticky bottom-4 z-20 overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
                            {/* Chrome Shine */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                            <button
                                onClick={handleSave}
                                className="relative px-6 py-2.5 bg-gradient-to-b from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all font-medium shadow-lg shadow-cyan-500/25 flex items-center gap-2 z-10"
                            >
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent via-white/10 to-white/20" />
                                <FileCheck size={20} className="relative z-10" />
                                <span className="relative z-10">Benotung speichern</span>
                            </button>
                            {student && (
                                <PDFDownloadLink
                                    document={
                                        <ProtocolDocument
                                            student={student}
                                            sheet={sheet}
                                            grade={{
                                                studentId: student.id,
                                                sheetId: sheet.id,
                                                examiners,
                                                examPieceExaminers: sheet.examPiece ? examPieceExaminers : undefined,
                                                theoryScores: sheet.theorySubjects ? theoryScores : undefined,
                                                date: new Date().toISOString()
                                            }}
                                            innung={data.innung}
                                        />
                                    }
                                    fileName={`niederschrift_${sheet.part === 1 ? 'teil1' : 'teil2'}_${student.lastName}_${student.firstName}.pdf`}
                                    className="relative px-6 py-2.5 bg-gradient-to-b from-slate-600 to-slate-700 text-slate-200 rounded-lg hover:from-slate-500 hover:to-slate-600 transition-all font-medium flex items-center gap-2 border border-slate-500/30 z-10"
                                >
                                    {({ loading }) => (loading ? 'Lade PDF...' : `Niederschrift Teil ${sheet.part} (PDF)`)}
                                </PDFDownloadLink>
                            )}
                            {/* Gesamtniederschrift - nur wenn beide Teile bewertet */}
                            {student && totalResult && (
                                <PDFDownloadLink
                                    document={
                                        <GesamtNiederschrift
                                            student={student}
                                            sheets={data.sheets}
                                            grades={data.grades}
                                            innung={data.innung}
                                        />
                                    }
                                    fileName={`gesamtniederschrift_${student.lastName}_${student.firstName}.pdf`}
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-lg min-w-[220px] text-center"
                                >
                                    {({ loading }) => loading ? 'Lade PDF...' : 'Gesamtniederschrift (PDF)'}
                                </PDFDownloadLink>
                            )}
                            {/* Prüfungszeugnis - nur wenn beide Teile bewertet */}
                            {student && zeugnisResults && (
                                <PDFDownloadLink
                                    document={
                                        <PruefungsZeugnis
                                            student={student}
                                            results={zeugnisResults}
                                            innung={data.innung || DEFAULT_INNUNG}
                                            gradeScale={data.gradeScale || DEFAULT_GRADE_SCALE}
                                        />
                                    }
                                    fileName={`pruefungszeugnis_${student.lastName}_${student.firstName}.pdf`}
                                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium shadow-lg min-w-[200px] text-center"
                                >
                                    {({ loading }) => loading ? 'Lade PDF...' : 'Prüfungszeugnis (PDF)'}
                                </PDFDownloadLink>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <Calculator size={64} className="mb-4 text-slate-600" />
                        <p>Wählen Sie links einen Prüfling aus, um die Benotung zu starten.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
