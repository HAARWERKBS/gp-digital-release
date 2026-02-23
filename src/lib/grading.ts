/**
 * Notenberechnung basierend auf Prozent (Standard für Einzelaufgaben)
 * Aus Excel: IF(I<30,6,IF(I<50,5,IF(I<67,4,IF(I<81,3,IF(I<92,2,1)))))
 */
export const calculateGradeFromPercent = (percent: number) => {
    if (percent >= 92) return { value: 1, label: "sehr gut" };
    if (percent >= 81) return { value: 2, label: "gut" };
    if (percent >= 67) return { value: 3, label: "befriedigend" };
    if (percent >= 50) return { value: 4, label: "ausreichend" };
    if (percent >= 30) return { value: 5, label: "mangelhaft" };
    return { value: 6, label: "ungenügend" };
};

/**
 * Standard-Notenberechnung: Punkte zu Prozent, dann Note
 */
export const calculateGrade = (points: number, maxPoints: number) => {
    if (maxPoints === 0) return { value: 6, label: "ungenügend" };
    const percent = (points / maxPoints) * 100;
    return calculateGradeFromPercent(percent);
};

/**
 * Spezielle Berechnung für gewichtete Arbeitsaufgaben (Teil 1 & 2)
 * Excel: IF(K<21,6,IF(K<35,5,IF(K<47,4,IF(K<57,3,IF(K<64,2,1)))))
 * Basis: Max 70 Punkte (bei 0.7 Gewichtung)
 */
export const calculateWorkTaskGrade = (weightedPoints: number) => {
    if (weightedPoints >= 64) return { value: 1, label: "sehr gut" };
    if (weightedPoints >= 57) return { value: 2, label: "gut" };
    if (weightedPoints >= 47) return { value: 3, label: "befriedigend" };
    if (weightedPoints >= 35) return { value: 4, label: "ausreichend" };
    if (weightedPoints >= 21) return { value: 5, label: "mangelhaft" };
    return { value: 6, label: "ungenügend" };
};

/**
 * Prüft ob die Prüfung bestanden ist (gemäß GPO)
 * Bestanden wenn:
 * - Gesamtnote mindestens 4 (ausreichend), d.h. >= 50 Punkte
 * - Kein Prüfungsbereich mit Note 6 (ungenügend) bewertet
 *
 * Prüfungsbereiche für Sperrfach-Check:
 * - Teil 1 Gesamt
 * - Teil 2 Praxis (Friseur- und Kosmetikdienstleistungen)
 * - Teil 2 Theorie: Friseurtechniken
 * - Teil 2 Theorie: Betriebsorganisation
 * - Teil 2 Theorie: WiSo
 */
export const isPassed = (finalGrade: number, partGrades: number[]): { passed: boolean; failReasons: string[] } => {
    const failReasons: string[] = [];

    if (finalGrade > 4) {
        failReasons.push('Gesamtnote schlechter als "ausreichend"');
    }

    if (partGrades.some(g => g >= 6)) {
        failReasons.push('Note "ungenügend" (6) in einem Prüfungsbereich');
    }

    return { passed: failReasons.length === 0, failReasons };
};

/**
 * Berechnet das Ergebnis von Teil 2 der Gesellenprüfung
 * Gemäß GPO/Prüfungsrechner: Praxis 60% + Theorie 40%
 *
 * Quelle: Mail Sebastian Kunde/LIV Niedersachsen 16.06.2023:
 * "Der Faktor: Praxis: 60% => Faktor: 0.6 und Theorie: 40% => Faktor 0.4
 *  bezieht sich auf den 75% Anteil am Gesamtergebnis der Gesellenprüfung."
 *
 * Quelle: Excel GP Software 2024.xlsm, Zeile K116:
 * =PRODUCT(D116,0.6)+PRODUCT(K114,0.4)
 */
export const calculatePart2Total = (praxisPoints: number, theoryPercent: number) => {
    const praxisWeighted = praxisPoints * 0.6;
    const theoryWeighted = theoryPercent * 0.4;
    const total = praxisWeighted + theoryWeighted;
    return {
        praxisPoints,
        theoryPercent,
        praxisWeighted,
        theoryWeighted,
        total,
        grade: calculateGradeFromPercent(total)
    };
};

/**
 * Berechnet Gesamtergebnis aus Teil 1 (25%) und Teil 2 (75%)
 */
export const calculateFinalResult = (part1Points: number, part2Points: number) => {
    const part1Weighted = part1Points * 0.25;  // 25%
    const part2Weighted = part2Points * 0.75;  // 75%
    const totalPoints = part1Weighted + part2Weighted;
    return {
        part1Weighted,
        part2Weighted,
        totalPoints,
        grade: calculateGradeFromPercent(totalPoints)
    };
};

/**
 * Berechnet Theorie-Gesamtpunkte
 * Pro Fach: Schriftlich ×2 + Mündlich ×1, dann Durchschnitt
 * Wenn keine mündliche Prüfung (oral === 0 und hasOral false): nur durch 2 teilen
 *
 * Excel-Formel: Z107: =(2*I107+I108)/IF(H108>0,3,2)
 * D.h. wenn mündliche Punkte > 0, dann /3, sonst /2
 */
export const calculateTheoryTotal = (
    scores: Array<{ written: number; oral: number; hasOral?: boolean }>
) => {
    let totalWeighted = 0;
    let totalWeight = 0;

    scores.forEach(s => {
        // Mündliche Prüfung ist optional (wie in Excel: IF(H108>0,3,2))
        const hasOralExam = s.hasOral !== undefined ? s.hasOral : (s.oral > 0);
        if (hasOralExam) {
            totalWeighted += s.written * 2 + s.oral * 1;
            totalWeight += 3; // 2 + 1
        } else {
            totalWeighted += s.written * 2;
            totalWeight += 2; // nur schriftlich
        }
    });

    const avgPoints = totalWeight > 0 ? totalWeighted / totalWeight : 0;
    return {
        totalWeighted,
        avgPoints,
        percent: avgPoints, // Punkte sind bereits 0-100
        grade: calculateGradeFromPercent(avgPoints)
    };
};

/**
 * Berechnet Theorie-Note pro Einzelfach
 * Schriftlich ×2 + Mündlich ×1, dann Durchschnitt → Note
 * Excel: Z107: =(2*I107+I108)/IF(H108>0,3,2)
 */
export const calculateTheorySubjectPercent = (written: number, oral: number, hasOral?: boolean) => {
    const hasOralExam = hasOral !== undefined ? hasOral : (oral > 0);
    if (hasOralExam) {
        return (written * 2 + oral * 1) / 3;
    }
    return (written * 2) / 2; // = written, aber für Konsistenz
};

export const getGradeColor = (grade: number) => {
    switch (grade) {
        case 1: return "text-green-600 bg-green-50 border-green-200";
        case 2: return "text-emerald-600 bg-emerald-50 border-emerald-200";
        case 3: return "text-blue-600 bg-blue-50 border-blue-200";
        case 4: return "text-yellow-600 bg-yellow-50 border-yellow-200";
        case 5: return "text-orange-600 bg-orange-50 border-orange-200";
        case 6: return "text-red-600 bg-red-50 border-red-200";
        default: return "text-gray-600 bg-gray-50";
    }
};

export const getGradeLabel = (grade: number) => {
    switch (grade) {
        case 1: return "sehr gut";
        case 2: return "gut";
        case 3: return "befriedigend";
        case 4: return "ausreichend";
        case 5: return "mangelhaft";
        case 6: return "ungenügend";
        default: return "-";
    }
};
