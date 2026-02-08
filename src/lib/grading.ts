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
 * Prüft ob die Prüfung bestanden ist
 * Bestanden wenn:
 * - Gesamtnote mindestens 4 (ausreichend)
 * - Keine Teilnote schlechter als 5
 */
export const isPassed = (finalGrade: number, partGrades: number[]) => {
    if (finalGrade > 4) return false;
    if (partGrades.some(g => g > 5)) return false;
    return true;
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
 * Schriftlich x2 + Mündlich x1, dann Durchschnitt
 */
export const calculateTheoryTotal = (
    scores: Array<{ written: number; oral: number }>
) => {
    let totalWeighted = 0;
    let totalWeight = 0;

    scores.forEach(s => {
        totalWeighted += s.written * 2 + s.oral * 1;
        totalWeight += 3; // 2 + 1
    });

    const avgPoints = totalWeight > 0 ? totalWeighted / totalWeight : 0;
    return {
        totalWeighted,
        avgPoints,
        percent: avgPoints, // Punkte sind bereits 0-100
        grade: calculateGradeFromPercent(avgPoints)
    };
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
