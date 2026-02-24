/**
 * Export-Utilities für Multi-Sheet Excel Export
 * Berechnet Prüfungsergebnisse und erstellt Daten für 3 Tabellenblätter:
 * 1. Stammdaten (Reimport-kompatibel)
 * 2. Ergebnisse (Noten-Übersicht)
 * 3. Detail-Bewertung (Prüfer-Einzelpunkte)
 *
 * Berechnungslogik basiert auf GradingPage.tsx calculateTotalPointsForStudent()
 * und ist GPO-konform (Gesellenprüfungsordnung).
 */

import { calculateGradeFromPercent, isPassed } from './grading';
import type { Student, Grade, GradingSheet, ExaminerGrade } from './types';

// ============================================
// Typen
// ============================================

export type StudentExportResult = {
    hasGrades: boolean;
    hasPart1: boolean;
    hasPart2: boolean;
    // Teil 1
    part1WorkTaskPoints: number;
    part1ExamPiecePoints: number;
    part1Total: number;
    part1Grade: { value: number; label: string };
    // Teil 2 Praxis
    part2WorkTaskPoints: number;
    part2ExamPiecePoints: number;
    part2Praxis: number;
    part2PraxisGrade: { value: number; label: string };
    // Teil 2 Theorie
    theorySubjectResults: Array<{
        subjectId: string;
        name: string;
        written: number;
        oral: number;
        percent: number;
        grade: { value: number; label: string };
    }>;
    theoryPercent: number;
    theoryGrade: { value: number; label: string };
    // Teil 2 Gesamt
    part2Total: number;
    part2Grade: { value: number; label: string };
    // Gesamt
    totalPoints: number;
    finalGrade: { value: number; label: string };
    // Bestanden
    passed: boolean;
    failReasons: string[];
};

// ============================================
// Hilfsfunktionen
// ============================================

/** Runden auf 2 Dezimalstellen */
export const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Durchschnittspunkte aller Prüfer für eine Aufgabe */
export const getAvgScore = (grade: Grade, taskId: string): number => {
    if (!grade.examiners || grade.examiners.length === 0) return 0;
    const sum = grade.examiners.reduce((acc, ex) => acc + (ex.scores[taskId] || 0), 0);
    return sum / grade.examiners.length;
};

/** Durchschnittspunkte aller Prüfer für das Prüfungsstück */
export const getExamPieceAvg = (grade: Grade, examPieceId: string): number => {
    if (!grade.examPieceExaminers || grade.examPieceExaminers.length === 0) return 0;
    return grade.examPieceExaminers.reduce((acc, ex) => acc + (ex.scores[examPieceId] || 0), 0) / grade.examPieceExaminers.length;
};

// ============================================
// Hauptberechnung pro Prüfling
// ============================================

/**
 * Berechnet alle Prüfungsergebnisse für einen Prüfling.
 * Repliziert die Logik aus GradingPage.tsx (calculateTotalPointsForStudent, Zeilen 242-334)
 * GPO-konform: Teil 1 × 25% + Teil 2 × 75%, Sperrfach-Prüfung etc.
 */
export function calculateStudentResults(
    student: Student,
    grades: Grade[],
    sheets: GradingSheet[]
): StudentExportResult {
    const gradePart1 = grades.find(g => g.studentId === student.id && g.sheetId === 'part1');
    const gradePart2 = grades.find(g => g.studentId === student.id && g.sheetId === 'part2');
    const sheetPart1 = sheets.find(s => s.id === 'part1');
    const sheetPart2 = sheets.find(s => s.id === 'part2');

    const emptyGrade = { value: 0, label: '' };
    const emptyResult: StudentExportResult = {
        hasGrades: false, hasPart1: false, hasPart2: false,
        part1WorkTaskPoints: 0, part1ExamPiecePoints: 0, part1Total: 0, part1Grade: emptyGrade,
        part2WorkTaskPoints: 0, part2ExamPiecePoints: 0, part2Praxis: 0, part2PraxisGrade: emptyGrade,
        theorySubjectResults: [], theoryPercent: 0, theoryGrade: emptyGrade,
        part2Total: 0, part2Grade: emptyGrade,
        totalPoints: 0, finalGrade: emptyGrade,
        passed: false, failReasons: [],
    };

    const hasPart1 = !!(gradePart1 && sheetPart1);
    const hasPart2 = !!(gradePart2 && sheetPart2);

    if (!hasPart1 && !hasPart2) return emptyResult;

    // === Teil 1: Arbeitsaufgaben (70%) + Prüfungsstück (30%) ===
    let part1WorkTaskPoints = 0;
    let part1ExamPiecePoints = 0;
    let part1Total = 0;
    let part1Grade = emptyGrade;

    if (hasPart1) {
        part1WorkTaskPoints = sheetPart1!.tasks.reduce(
            (sum, t) => sum + (getAvgScore(gradePart1!, t.id) * t.weight), 0
        );
        part1ExamPiecePoints = sheetPart1!.examPiece
            ? getExamPieceAvg(gradePart1!, sheetPart1!.examPiece.id)
            : 0;
        part1Total = (part1WorkTaskPoints * sheetPart1!.workTaskWeight) + (part1ExamPiecePoints * sheetPart1!.examPieceWeight);
        part1Grade = calculateGradeFromPercent(part1Total);
    }

    // === Teil 2: Praxis (60%) + Theorie (40%) ===
    let part2WorkTaskPoints = 0;
    let part2ExamPiecePoints = 0;
    let part2Praxis = 0;
    let part2PraxisGrade = emptyGrade;
    let part2Total = 0;
    let part2Grade = emptyGrade;

    // Theorie
    const theorySubjectResults: StudentExportResult['theorySubjectResults'] = [];
    let theoryPercent = 0;
    let theoryGrade = emptyGrade;

    if (hasPart2) {
        // Praxis
        part2WorkTaskPoints = sheetPart2!.tasks.reduce(
            (sum, t) => sum + (getAvgScore(gradePart2!, t.id) * t.weight), 0
        );
        part2ExamPiecePoints = sheetPart2!.examPiece
            ? getExamPieceAvg(gradePart2!, sheetPart2!.examPiece.id)
            : 0;
        part2Praxis = (part2WorkTaskPoints * sheetPart2!.workTaskWeight) + (part2ExamPiecePoints * sheetPart2!.examPieceWeight);
        part2PraxisGrade = calculateGradeFromPercent(part2Praxis);

        // Theorie: Schnitt der Fächer (je: schriftl.×2 + mündl.×1, /3 bzw. nur schriftl.)
        // Excel: Z107: =(2*I107+I108)/IF(H108>0,3,2)
        if (sheetPart2!.theorySubjects && gradePart2!.theoryScores) {
            const subjectPercents: number[] = [];
            sheetPart2!.theorySubjects.forEach(subject => {
                const score = gradePart2!.theoryScores?.find(ts => ts.subjectId === subject.id);
                if (score) {
                    const written = score.writtenPoints || 0;
                    const oral = score.oralPoints || 0;
                    const hasOral = oral > 0;
                    const subjectPercent = hasOral
                        ? (written * 2 + oral * 1) / 3
                        : written;
                    subjectPercents.push(subjectPercent);
                    theorySubjectResults.push({
                        subjectId: subject.id,
                        name: subject.name,
                        written,
                        oral,
                        percent: subjectPercent,
                        grade: calculateGradeFromPercent(subjectPercent),
                    });
                }
            });
            if (subjectPercents.length > 0) {
                theoryPercent = subjectPercents.reduce((a, b) => a + b, 0) / subjectPercents.length;
            }
        }
        theoryGrade = calculateGradeFromPercent(theoryPercent);

        // Teil 2 Gesamt: Praxis × 0.6 + Theorie × 0.4
        part2Total = (part2Praxis * 0.6) + (theoryPercent * 0.4);
        part2Grade = calculateGradeFromPercent(part2Total);
    }

    // === Gesamtpunkte: Teil 1 (25%) + Teil 2 (75%) ===
    let totalPoints = 0;
    let finalGrade = emptyGrade;
    let passed = false;
    let failReasons: string[] = [];

    if (hasPart1 && hasPart2) {
        totalPoints = (part1Total * 0.25) + (part2Total * 0.75);
        finalGrade = calculateGradeFromPercent(totalPoints);

        // Sperrfach-Prüfung gemäß GPO
        const allPartGrades = [
            part1Grade.value,
            part2PraxisGrade.value,
            ...theorySubjectResults.map(t => t.grade.value),
        ];
        const passResult = isPassed(finalGrade.value, allPartGrades);
        passed = passResult.passed;
        failReasons = passResult.failReasons;
    }

    return {
        hasGrades: hasPart1 || hasPart2,
        hasPart1,
        hasPart2,
        part1WorkTaskPoints, part1ExamPiecePoints, part1Total, part1Grade,
        part2WorkTaskPoints, part2ExamPiecePoints, part2Praxis, part2PraxisGrade,
        theorySubjectResults, theoryPercent, theoryGrade,
        part2Total, part2Grade,
        totalPoints, finalGrade,
        passed, failReasons,
    };
}

// ============================================
// Sheet-Builder Funktionen
// ============================================

/** Sortiert Prüflinge nach Prüfungsnummer (numerisch, dann alphabetisch) */
function sortStudents(students: Student[]): Student[] {
    return [...students].sort((a, b) => {
        const numA = parseInt(a.examNumber) || 0;
        const numB = parseInt(b.examNumber) || 0;
        if (numA !== numB) return numA - numB;
        return a.examNumber.localeCompare(b.examNumber);
    });
}

/** Datum formatieren (ISO → DD.MM.YYYY) */
function formatDate(d?: string): string {
    return d ? new Date(d).toLocaleDateString('de-DE') : '';
}

/**
 * Blatt 1: Stammdaten (identisch zum bisherigen Export, reimport-kompatibel)
 */
export function buildStammdatenRows(students: Student[]): Record<string, string | number>[] {
    return sortStudents(students).map(s => ({
        'Anrede': s.gender || '',
        'Vorname': s.firstName,
        'Nachname': s.lastName,
        'Prüfungsnummer': s.examNumber,
        'Geburtsdatum': formatDate(s.dob),
        'Geburtsort': s.birthPlace || '',
        'Geburtsland': s.birthCountry || '',
        'Straße': s.street || '',
        'Hausnummer': s.houseNumber || '',
        'PLZ': s.zip || '',
        'Stadt': s.city || '',
        'E-Mail': s.email || '',
        'Handy': s.mobile || '',
        'Betrieb': s.salon,
        'Betrieb Straße': s.salonStreet || '',
        'Betrieb PLZ Ort': s.salonZipCity || '',
        'Betrieb Telefon': s.salonPhone || '',
        'Firma': s.company || '',
        'Lehrzeit Von': formatDate(s.trainingStart),
        'Lehrzeit Bis': formatDate(s.trainingEnd),
        'Prüfungsdatum Teil 1': formatDate(s.examDatePart1),
        'Prüfungsdatum Teil 2': formatDate(s.examDatePart2),
        'Wahlqualifikation': s.wahlqualifikation || '',
    }));
}

/**
 * Blatt 2: Ergebnisse (Noten-Übersicht pro Prüfling)
 */
export function buildErgebnisseRows(
    students: Student[],
    grades: Grade[],
    sheets: GradingSheet[]
): Record<string, string | number>[] {
    return sortStudents(students).map(s => {
        const r = calculateStudentResults(s, grades, sheets);

        const row: Record<string, string | number> = {
            'Prüfungsnummer': s.examNumber,
            'Nachname': s.lastName,
            'Vorname': s.firstName,
            'Status': s.isActive ? 'Aktiv' : 'Pausiert',
        };

        if (r.hasPart1) {
            row['Teil 1 Punkte'] = round2(r.part1Total);
            row['Teil 1 Note'] = r.part1Grade.value;
            row['Teil 1 Bezeichnung'] = r.part1Grade.label;
        } else {
            row['Teil 1 Punkte'] = '';
            row['Teil 1 Note'] = '';
            row['Teil 1 Bezeichnung'] = '';
        }

        if (r.hasPart2) {
            row['Teil 2 Praxis Punkte'] = round2(r.part2Praxis);
            row['Teil 2 Praxis Note'] = r.part2PraxisGrade.value;
            row['Teil 2 Theorie Punkte'] = round2(r.theoryPercent);
            row['Teil 2 Theorie Note'] = r.theoryGrade.value;
            row['Teil 2 Gesamt Punkte'] = round2(r.part2Total);
            row['Teil 2 Note'] = r.part2Grade.value;
            row['Teil 2 Bezeichnung'] = r.part2Grade.label;
        } else {
            row['Teil 2 Praxis Punkte'] = '';
            row['Teil 2 Praxis Note'] = '';
            row['Teil 2 Theorie Punkte'] = '';
            row['Teil 2 Theorie Note'] = '';
            row['Teil 2 Gesamt Punkte'] = '';
            row['Teil 2 Note'] = '';
            row['Teil 2 Bezeichnung'] = '';
        }

        if (r.hasPart1 && r.hasPart2) {
            row['Gesamtpunkte'] = round2(r.totalPoints);
            row['Gesamtnote'] = r.finalGrade.value;
            row['Gesamtbezeichnung'] = r.finalGrade.label;
            row['Bestanden'] = r.passed ? 'Ja' : 'Nein';
            row['Bemerkung'] = r.failReasons.join('; ');
        } else {
            row['Gesamtpunkte'] = '';
            row['Gesamtnote'] = '';
            row['Gesamtbezeichnung'] = '';
            row['Bestanden'] = '';
            row['Bemerkung'] = '';
        }

        return row;
    });
}

/**
 * Blatt 3: Detail-Bewertung (alle Prüfer-Einzelpunkte)
 */
export function buildDetailRows(
    students: Student[],
    grades: Grade[],
    sheets: GradingSheet[]
): Record<string, string | number>[] {
    const sheetPart1 = sheets.find(s => s.id === 'part1');
    const sheetPart2 = sheets.find(s => s.id === 'part2');

    // Maximale Prüfer-Anzahl ermitteln (Standard: 3)
    let maxExaminers = 3;
    grades.forEach(g => {
        if (g.examiners?.length > maxExaminers) maxExaminers = g.examiners.length;
        if (g.examPieceExaminers && g.examPieceExaminers.length > maxExaminers) maxExaminers = g.examPieceExaminers.length;
    });

    return sortStudents(students).map(s => {
        const gradePart1 = grades.find(g => g.studentId === s.id && g.sheetId === 'part1');
        const gradePart2 = grades.find(g => g.studentId === s.id && g.sheetId === 'part2');
        const result = calculateStudentResults(s, grades, sheets);

        const row: Record<string, string | number> = {
            'Prüfungsnummer': s.examNumber,
            'Nachname': s.lastName,
            'Vorname': s.firstName,
        };

        // --- Teil 1 Arbeitsaufgaben ---
        if (sheetPart1) {
            sheetPart1.tasks.forEach(task => {
                const shortName = truncateTaskName(task.name);
                for (let i = 0; i < maxExaminers; i++) {
                    const key = `T1 ${shortName} P${i + 1}`;
                    row[key] = gradePart1?.examiners?.[i]?.scores?.[task.id] ?? '';
                }
                row[`T1 ${shortName} Ø`] = gradePart1
                    ? round2(getAvgScore(gradePart1, task.id))
                    : '';
            });

            // Teil 1 Prüfungsstück
            if (sheetPart1.examPiece) {
                for (let i = 0; i < maxExaminers; i++) {
                    row[`T1 Prüfungsstück P${i + 1}`] = gradePart1?.examPieceExaminers?.[i]?.scores?.[sheetPart1.examPiece.id] ?? '';
                }
                row['T1 Prüfungsstück Ø'] = gradePart1
                    ? round2(getExamPieceAvg(gradePart1, sheetPart1.examPiece.id))
                    : '';
            }

            row['Teil 1 Punkte'] = result.hasPart1 ? round2(result.part1Total) : '';
            row['Teil 1 Note'] = result.hasPart1 ? result.part1Grade.value : '';
            row['Teil 1 Bezeichnung'] = result.hasPart1 ? result.part1Grade.label : '';
        }

        // --- Teil 2 Arbeitsaufgaben ---
        if (sheetPart2) {
            sheetPart2.tasks.forEach(task => {
                const shortName = truncateTaskName(task.name);
                for (let i = 0; i < maxExaminers; i++) {
                    const key = `T2 ${shortName} P${i + 1}`;
                    row[key] = gradePart2?.examiners?.[i]?.scores?.[task.id] ?? '';
                }
                row[`T2 ${shortName} Ø`] = gradePart2
                    ? round2(getAvgScore(gradePart2, task.id))
                    : '';
            });

            // Teil 2 Prüfungsstück
            if (sheetPart2.examPiece) {
                for (let i = 0; i < maxExaminers; i++) {
                    row[`T2 Prüfungsstück P${i + 1}`] = gradePart2?.examPieceExaminers?.[i]?.scores?.[sheetPart2.examPiece.id] ?? '';
                }
                row['T2 Prüfungsstück Ø'] = gradePart2
                    ? round2(getExamPieceAvg(gradePart2, sheetPart2.examPiece.id))
                    : '';
            }

            row['Teil 2 Praxis Punkte'] = result.hasPart2 ? round2(result.part2Praxis) : '';
            row['Teil 2 Praxis Note'] = result.hasPart2 ? result.part2PraxisGrade.value : '';

            // Teil 2 Theorie
            if (sheetPart2.theorySubjects) {
                sheetPart2.theorySubjects.forEach(subject => {
                    const score = gradePart2?.theoryScores?.find(ts => ts.subjectId === subject.id);
                    row[`${subject.name} Schriftl.`] = score?.writtenPoints ?? '';
                    row[`${subject.name} Mündl.`] = score?.oralPoints ?? '';
                    // Ergebnis pro Fach
                    const subjectResult = result.theorySubjectResults.find(r => r.subjectId === subject.id);
                    row[`${subject.name} Ergebnis`] = subjectResult ? round2(subjectResult.percent) : '';
                    row[`${subject.name} Note`] = subjectResult ? subjectResult.grade.value : '';
                });
            }

            row['Theorie Ø'] = result.hasPart2 ? round2(result.theoryPercent) : '';
            row['Theorie Note'] = result.hasPart2 ? result.theoryGrade.value : '';
            row['Teil 2 Gesamt Punkte'] = result.hasPart2 ? round2(result.part2Total) : '';
            row['Teil 2 Gesamt Note'] = result.hasPart2 ? result.part2Grade.value : '';
        }

        // --- Gesamtergebnis ---
        if (result.hasPart1 && result.hasPart2) {
            row['Gesamtpunkte'] = round2(result.totalPoints);
            row['Gesamtnote'] = result.finalGrade.value;
            row['Gesamtbezeichnung'] = result.finalGrade.label;
            row['Bestanden'] = result.passed ? 'Ja' : 'Nein';
        } else {
            row['Gesamtpunkte'] = '';
            row['Gesamtnote'] = '';
            row['Gesamtbezeichnung'] = '';
            row['Bestanden'] = '';
        }

        return row;
    });
}

/**
 * Kürzt Aufgabennamen für Excel-Spaltenüberschriften
 * z.B. "Haar und Kopfhaut beurteilen, reinigen und pflegen" → "Haar/Kopfhaut"
 */
function truncateTaskName(name: string): string {
    // Maximal 25 Zeichen, am Wortende abschneiden
    if (name.length <= 25) return name;
    const truncated = name.substring(0, 25);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 10 ? truncated.substring(0, lastSpace) + '…' : truncated + '…';
}
