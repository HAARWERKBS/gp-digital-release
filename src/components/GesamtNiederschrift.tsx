import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Grade, GradingSheet, Student, Innung } from '../lib/types';
import { calculateGrade, calculateGradeFromPercent, isPassed } from '../lib/grading';

const styles = StyleSheet.create({
    page: {
        padding: 20,
        paddingBottom: 30,
        fontFamily: 'Helvetica',
        fontSize: 7,
        color: '#333'
    },
    headerBox: {
        flexDirection: 'row',
        marginBottom: 10,
        borderBottom: '2px solid #4f46e5',
        paddingBottom: 6,
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
        textTransform: 'uppercase'
    },
    subTitle: {
        fontSize: 7,
        color: '#6b7280'
    },
    // Prüflingsdaten mit schwarzem Rahmen
    studentInfoBox: {
        marginBottom: 10,
        padding: 8,
        borderWidth: 1,
        borderColor: '#000'
    },
    row: {
        flexDirection: 'row',
        marginBottom: 1
    },
    label: {
        width: 90,
        fontWeight: 'bold',
        color: '#000',
        fontSize: 7
    },
    value: {
        flex: 1,
        color: '#000',
        fontSize: 7
    },
    // Teil-Sektionen
    teilSection: {
        marginBottom: 8
    },
    teilTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4
    },
    // Tabellen
    table: {
        marginBottom: 4
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#4f46e5',
        color: '#fff',
        paddingVertical: 3,
        paddingHorizontal: 3,
        fontWeight: 'bold',
        fontSize: 6
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e5e7eb',
        paddingVertical: 2,
        paddingHorizontal: 3,
        alignItems: 'center'
    },
    tableRowAlt: {
        backgroundColor: '#f9fafb'
    },
    colId: { width: '4%', textAlign: 'center', fontSize: 6 },
    colName: { width: '44%', fontSize: 6 },
    colWeight: { width: '9%', textAlign: 'center', fontSize: 6 },
    colExaminer: { width: '10%', textAlign: 'center', fontSize: 6 },
    colTotal: { width: '13%', textAlign: 'right', fontWeight: 'bold', fontSize: 6 },

    // Prüfungsstück
    examPieceLabel: {
        fontSize: 6,
        fontWeight: 'bold',
        color: '#000',
        marginTop: 2,
        marginBottom: 1
    },
    examPieceRow: {
        flexDirection: 'row',
        paddingVertical: 2,
        paddingHorizontal: 3,
        alignItems: 'center'
    },

    // Zusammenfassungs-Box mit lila Rand links
    resultBox: {
        marginTop: 4,
        padding: 4,
        borderLeftWidth: 2,
        borderLeftColor: '#4f46e5',
        backgroundColor: '#fff'
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 1
    },
    resultLabel: {
        fontSize: 6,
        color: '#000'
    },
    resultValue: {
        fontSize: 6,
        fontWeight: 'bold',
        color: '#000'
    },
    resultTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 2,
        paddingTop: 2,
        borderTopWidth: 0.5,
        borderTopColor: '#d1d5db'
    },
    resultTotalLabel: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#000'
    },
    resultTotalValue: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#4f46e5'
    },

    // BESTANDEN Box
    gesamtBox: {
        marginTop: 8,
        padding: 10,
        borderWidth: 2,
        backgroundColor: '#f0fdf4'
    },
    passedBox: {
        borderColor: '#22c55e'
    },
    failedBox: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2'
    },
    gesamtTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 6
    },
    passedTitle: {
        color: '#166534'
    },
    failedTitle: {
        color: '#991b1b'
    },
    gesamtRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2
    },
    gesamtLabel: {
        fontSize: 7,
        color: '#000'
    },
    gesamtValue: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#000'
    },
    gesamtDivider: {
        height: 1,
        backgroundColor: '#000',
        marginVertical: 4
    },
    gesamtTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2
    },
    gesamtTotalLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#000'
    },
    gesamtTotalValue: {
        fontSize: 10,
        fontWeight: 'bold'
    },
    bestehensgrenze: {
        fontSize: 6,
        color: '#6b7280',
        marginTop: 4,
        textAlign: 'center'
    },

    // Unterschriften
    signaturesContainer: {
        marginTop: 60
    },
    signaturesTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 70
    },
    signaturesBottom: {
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    signatureBlock: {
        width: 120
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 3
    },
    signatureName: {
        fontSize: 7,
        color: '#000',
        textAlign: 'center'
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 12,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontSize: 6,
        color: '#9ca3af'
    }
});

interface GesamtNiederschriftProps {
    student: Student;
    sheets: GradingSheet[];
    grades: Grade[];
    innung?: Innung;
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return '-';
    }
};

export const GesamtNiederschrift: React.FC<GesamtNiederschriftProps> = ({ student, sheets, grades, innung }) => {
    const sheetPart1 = sheets.find(s => s.id === 'part1');
    const sheetPart2 = sheets.find(s => s.id === 'part2');
    const gradePart1 = grades.find(g => g.studentId === student.id && g.sheetId === 'part1');
    const gradePart2 = grades.find(g => g.studentId === student.id && g.sheetId === 'part2');

    // Helper functions
    const getAvgScore = (grade: Grade, taskId: string) => {
        if (!grade.examiners || grade.examiners.length === 0) return 0;
        const sum = grade.examiners.reduce((acc, ex) => acc + (ex.scores[taskId] || 0), 0);
        return sum / grade.examiners.length;
    };

    const getExamPieceAvg = (grade: Grade, examPieceId: string) => {
        if (!grade.examPieceExaminers || grade.examPieceExaminers.length === 0) return 0;
        return grade.examPieceExaminers.reduce((acc, ex) => acc + (ex.scores[examPieceId] || 0), 0) / grade.examPieceExaminers.length;
    };

    // Calculate Teil 1
    let part1WorkTaskPoints = 0;
    let part1ExamPiecePoints = 0;
    let part1Total = 0;
    if (sheetPart1 && gradePart1) {
        part1WorkTaskPoints = sheetPart1.tasks.reduce((sum, t) => sum + (getAvgScore(gradePart1, t.id) * t.weight), 0);
        part1ExamPiecePoints = sheetPart1.examPiece ? getExamPieceAvg(gradePart1, sheetPart1.examPiece.id) : 0;
        part1Total = (part1WorkTaskPoints * sheetPart1.workTaskWeight) + (part1ExamPiecePoints * sheetPart1.examPieceWeight);
    }

    // Calculate Teil 2: Praxis (60%) + Theorie (40%) gemäß GPO
    let part2WorkTaskPoints = 0;
    let part2ExamPiecePoints = 0;
    let part2Praxis = 0;
    let theoryPercent = 0;
    const theorySubjectGrades: { name: string; percent: number; grade: number }[] = [];
    let part2Total = 0;

    if (sheetPart2 && gradePart2) {
        // Praxis: Arbeitsaufgaben (70%) + Prüfungsstück (30%)
        part2WorkTaskPoints = sheetPart2.tasks.reduce((sum, t) => sum + (getAvgScore(gradePart2, t.id) * t.weight), 0);
        part2ExamPiecePoints = sheetPart2.examPiece ? getExamPieceAvg(gradePart2, sheetPart2.examPiece.id) : 0;
        part2Praxis = (part2WorkTaskPoints * sheetPart2.workTaskWeight) + (part2ExamPiecePoints * sheetPart2.examPieceWeight);

        // Theorie: Schnitt der 3 Fächer (schriftl.×2 + mündl.×1, /3 bzw. /2)
        if (sheetPart2.theorySubjects && gradePart2.theoryScores) {
            const subjectPercents: number[] = [];
            sheetPart2.theorySubjects.forEach(subject => {
                const score = gradePart2.theoryScores?.find(ts => ts.subjectId === subject.id);
                if (score) {
                    const written = score.writtenPoints || 0;
                    const oral = score.oralPoints || 0;
                    const subjectPct = oral > 0 ? (written * 2 + oral) / 3 : written;
                    subjectPercents.push(subjectPct);
                    theorySubjectGrades.push({
                        name: subject.name,
                        percent: subjectPct,
                        grade: calculateGradeFromPercent(subjectPct).value
                    });
                }
            });
            if (subjectPercents.length > 0) {
                theoryPercent = subjectPercents.reduce((a, b) => a + b, 0) / subjectPercents.length;
            }
        }

        // Teil 2 Gesamt: Praxis × 0.6 + Theorie × 0.4
        part2Total = (part2Praxis * 0.6) + (theoryPercent * 0.4);
    }

    // Gesamtergebnis: Teil 1 (25%) + Teil 2 (75%)
    const totalPoints = (part1Total * 0.25) + (part2Total * 0.75);

    const part1Grade = calculateGrade(part1Total, 100);
    const part2PraxisGrade = calculateGrade(part2Praxis, 100);
    const part2Grade = calculateGrade(part2Total, 100);
    const finalGrade = calculateGrade(totalPoints, 100);

    // Sperrfach-Prüfung gemäß GPO: kein Bereich darf Note 6 haben
    const allPartGrades = [
        part1Grade.value,
        part2PraxisGrade.value,
        ...theorySubjectGrades.map(t => t.grade)
    ];
    const passResult = isPassed(finalGrade.value, allPartGrades);
    const passed = passResult.passed;

    // Get all unique examiners
    const isDefaultExaminerName = (name: string) => /^Prüfer\s*\d+$/i.test(name.trim());
    const allExaminers: string[] = [];
    const seenNames = new Set<string>();

    const addExaminer = (name: string) => {
        if (name && !isDefaultExaminerName(name) && !seenNames.has(name)) {
            seenNames.add(name);
            allExaminers.push(name);
        }
    };

    if (gradePart1) {
        gradePart1.examiners.forEach(ex => addExaminer(ex.name));
        gradePart1.examPieceExaminers?.forEach(ex => addExaminer(ex.name));
    }
    if (gradePart2) {
        gradePart2.examiners.forEach(ex => addExaminer(ex.name));
        gradePart2.examPieceExaminers?.forEach(ex => addExaminer(ex.name));
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {innung?.logo && (
                            <Image src={innung.logo} style={{ width: 35, height: 35, objectFit: 'contain' }} />
                        )}
                        <View>
                            <Text style={styles.title}>GESAMTNIEDERSCHRIFT</Text>
                            <Text style={styles.subTitle}>Gesellenprüfung Friseur/in - Teil 1 & Teil 2</Text>
                            {innung?.name && (
                                <Text style={{ fontSize: 7, color: '#4f46e5', marginTop: 1, fontWeight: 'bold' }}>{innung.name}</Text>
                            )}
                            {innung?.street && innung?.zipCity && (
                                <Text style={{ fontSize: 6, color: '#6b7280' }}>{innung.street}, {innung.zipCity}</Text>
                            )}
                        </View>
                    </View>
                    <Text style={{ fontSize: 7, color: '#6b7280' }}>{new Date().toLocaleDateString('de-DE')}</Text>
                </View>

                {/* Prüfling Info */}
                <View style={styles.studentInfoBox}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Prüfungsnummer:</Text>
                        <Text style={styles.value}>{student.examNumber}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Prüfling:</Text>
                        <Text style={styles.value}>{student.firstName} {student.lastName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Geboren am:</Text>
                        <Text style={styles.value}>{formatDate(student.dob)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Ausbildungsbetrieb:</Text>
                        <Text style={styles.value}>{student.salon} ({student.company})</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Lehrzeit:</Text>
                        <Text style={styles.value}>{formatDate(student.trainingStart)} bis {formatDate(student.trainingEnd)}</Text>
                    </View>
                </View>

                {/* Teil 1 */}
                {sheetPart1 && gradePart1 && (
                    <View style={styles.teilSection}>
                        <Text style={styles.teilTitle}>Teil 1 der Gesellenprüfung (Gewichtung: 25%)</Text>

                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={styles.colId}>#</Text>
                                <Text style={styles.colName}>Arbeitsaufgabe</Text>
                                <Text style={styles.colWeight}>Faktor</Text>
                                <Text style={styles.colExaminer}>P1</Text>
                                <Text style={styles.colExaminer}>P2</Text>
                                <Text style={styles.colExaminer}>P3</Text>
                                <Text style={styles.colTotal}>Ø gew.</Text>
                            </View>
                            {sheetPart1.tasks.map((task, i) => {
                                const avg = getAvgScore(gradePart1, task.id);
                                return (
                                    <View key={task.id} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
                                        <Text style={styles.colId}>{i + 1}</Text>
                                        <Text style={styles.colName}>{task.name}</Text>
                                        <Text style={styles.colWeight}>×{task.weight}</Text>
                                        {gradePart1.examiners.slice(0, 3).map((ex, idx) => (
                                            <Text key={idx} style={styles.colExaminer}>{ex.scores[task.id] || 0}</Text>
                                        ))}
                                        {Array.from({ length: Math.max(0, 3 - gradePart1.examiners.length) }).map((_, idx) => (
                                            <Text key={`empty-${idx}`} style={styles.colExaminer}>-</Text>
                                        ))}
                                        <Text style={styles.colTotal}>{(avg * task.weight).toFixed(2)}</Text>
                                    </View>
                                );
                            })}
                        </View>

                        {sheetPart1.examPiece && (
                            <View>
                                <Text style={styles.examPieceLabel}>Prüfungsstück:</Text>
                                <View style={styles.examPieceRow}>
                                    <Text style={[styles.colName, { width: '53%' }]}>{sheetPart1.examPiece.name}</Text>
                                    {gradePart1.examPieceExaminers?.slice(0, 3).map((ex, idx) => (
                                        <Text key={idx} style={styles.colExaminer}>{ex.scores[sheetPart1.examPiece!.id] || 0}</Text>
                                    ))}
                                    {Array.from({ length: Math.max(0, 3 - (gradePart1.examPieceExaminers?.length || 0)) }).map((_, idx) => (
                                        <Text key={`empty-ep-${idx}`} style={styles.colExaminer}>-</Text>
                                    ))}
                                    <Text style={styles.colTotal}>{part1ExamPiecePoints.toFixed(2)}</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.resultBox}>
                            <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>Arbeitsaufgaben ({(sheetPart1.workTaskWeight * 100).toFixed(0)}%)</Text>
                                <Text style={styles.resultValue}>{part1WorkTaskPoints.toFixed(2)} Pkt.</Text>
                            </View>
                            <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>Prüfungsstück ({(sheetPart1.examPieceWeight * 100).toFixed(0)}%)</Text>
                                <Text style={styles.resultValue}>{part1ExamPiecePoints.toFixed(2)} Pkt.</Text>
                            </View>
                            <View style={styles.resultTotalRow}>
                                <Text style={styles.resultTotalLabel}>Teil 1 Gesamt</Text>
                                <Text style={styles.resultTotalValue}>{part1Total.toFixed(2)} Pkt. = Note {part1Grade.value} ({part1Grade.label})</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Teil 2 */}
                {sheetPart2 && gradePart2 && (
                    <View style={styles.teilSection}>
                        <Text style={styles.teilTitle}>Teil 2 der Gesellenprüfung (Gewichtung: 75%)</Text>

                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={styles.colId}>#</Text>
                                <Text style={styles.colName}>Arbeitsaufgabe</Text>
                                <Text style={styles.colWeight}>Faktor</Text>
                                <Text style={styles.colExaminer}>P1</Text>
                                <Text style={styles.colExaminer}>P2</Text>
                                <Text style={styles.colExaminer}>P3</Text>
                                <Text style={styles.colTotal}>Ø gew.</Text>
                            </View>
                            {sheetPart2.tasks.map((task, i) => {
                                const avg = getAvgScore(gradePart2, task.id);
                                return (
                                    <View key={task.id} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
                                        <Text style={styles.colId}>{i + 1}</Text>
                                        <Text style={styles.colName}>{task.name}</Text>
                                        <Text style={styles.colWeight}>×{task.weight}</Text>
                                        {gradePart2.examiners.slice(0, 3).map((ex, idx) => (
                                            <Text key={idx} style={styles.colExaminer}>{ex.scores[task.id] || 0}</Text>
                                        ))}
                                        {Array.from({ length: Math.max(0, 3 - gradePart2.examiners.length) }).map((_, idx) => (
                                            <Text key={`empty-${idx}`} style={styles.colExaminer}>-</Text>
                                        ))}
                                        <Text style={styles.colTotal}>{(avg * task.weight).toFixed(2)}</Text>
                                    </View>
                                );
                            })}
                        </View>

                        {sheetPart2.examPiece && (
                            <View>
                                <Text style={styles.examPieceLabel}>Prüfungsstück:</Text>
                                <View style={styles.examPieceRow}>
                                    <Text style={[styles.colName, { width: '53%' }]}>{sheetPart2.examPiece.name}</Text>
                                    {gradePart2.examPieceExaminers?.slice(0, 3).map((ex, idx) => (
                                        <Text key={idx} style={styles.colExaminer}>{ex.scores[sheetPart2.examPiece!.id] || 0}</Text>
                                    ))}
                                    {Array.from({ length: Math.max(0, 3 - (gradePart2.examPieceExaminers?.length || 0)) }).map((_, idx) => (
                                        <Text key={`empty-ep-${idx}`} style={styles.colExaminer}>-</Text>
                                    ))}
                                    <Text style={styles.colTotal}>{part2ExamPiecePoints.toFixed(2)}</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.resultBox}>
                            <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>Arbeitsaufgaben ({(sheetPart2.workTaskWeight * 100).toFixed(0)}%)</Text>
                                <Text style={styles.resultValue}>{part2WorkTaskPoints.toFixed(2)} Pkt.</Text>
                            </View>
                            <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>Prüfungsstück ({(sheetPart2.examPieceWeight * 100).toFixed(0)}%)</Text>
                                <Text style={styles.resultValue}>{part2ExamPiecePoints.toFixed(2)} Pkt.</Text>
                            </View>
                            <View style={styles.resultRow}>
                                <Text style={[styles.resultLabel, { fontWeight: 'bold' }]}>Praxis gesamt (×0.6)</Text>
                                <Text style={styles.resultValue}>{part2Praxis.toFixed(2)} × 0.6 = {(part2Praxis * 0.6).toFixed(2)} Pkt.</Text>
                            </View>
                            {theorySubjectGrades.length > 0 && (
                                <>
                                    {theorySubjectGrades.map((t, idx) => (
                                        <View key={idx} style={styles.resultRow}>
                                            <Text style={styles.resultLabel}>{t.name}</Text>
                                            <Text style={styles.resultValue}>{t.percent.toFixed(2)} Pkt. = Note {t.grade}</Text>
                                        </View>
                                    ))}
                                    <View style={styles.resultRow}>
                                        <Text style={[styles.resultLabel, { fontWeight: 'bold' }]}>Theorie gesamt (×0.4)</Text>
                                        <Text style={styles.resultValue}>{theoryPercent.toFixed(2)} × 0.4 = {(theoryPercent * 0.4).toFixed(2)} Pkt.</Text>
                                    </View>
                                </>
                            )}
                            <View style={styles.resultTotalRow}>
                                <Text style={styles.resultTotalLabel}>Teil 2 Gesamt (Praxis 60% + Theorie 40%)</Text>
                                <Text style={styles.resultTotalValue}>{part2Total.toFixed(2)} Pkt. = Note {part2Grade.value} ({part2Grade.label})</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Gesamtergebnis Box */}
                <View style={[styles.gesamtBox, passed ? styles.passedBox : styles.failedBox]}>
                    <Text style={[styles.gesamtTitle, passed ? styles.passedTitle : styles.failedTitle]}>
                        {passed ? 'BESTANDEN' : 'NICHT BESTANDEN'}
                    </Text>

                    <View style={styles.gesamtRow}>
                        <Text style={styles.gesamtLabel}>Teil 1 (25%)</Text>
                        <Text style={styles.gesamtValue}>{part1Total.toFixed(2)} × 0.25 = {(part1Total * 0.25).toFixed(2)} Pkt.</Text>
                    </View>
                    <View style={styles.gesamtRow}>
                        <Text style={styles.gesamtLabel}>Teil 2 (75%)</Text>
                        <Text style={styles.gesamtValue}>{part2Total.toFixed(2)} × 0.75 = {(part2Total * 0.75).toFixed(2)} Pkt.</Text>
                    </View>

                    <View style={styles.gesamtDivider} />

                    <View style={styles.gesamtTotalRow}>
                        <Text style={styles.gesamtTotalLabel}>Gesamtpunkte (Max: 100)</Text>
                        <Text style={[styles.gesamtTotalValue, { color: passed ? '#166534' : '#991b1b' }]}>{totalPoints.toFixed(2)} Punkte</Text>
                    </View>
                    <View style={styles.gesamtTotalRow}>
                        <Text style={styles.gesamtLabel}>Gesamtnote</Text>
                        <Text style={[styles.gesamtTotalValue, { color: passed ? '#166534' : '#991b1b' }]}>Note {finalGrade.value} ({finalGrade.label})</Text>
                    </View>

                    <Text style={styles.bestehensgrenze}>
                        Bestehensgrenze: 50 von 100 Punkten (50%) — kein Prüfungsbereich mit Note 6
                    </Text>
                    {!passed && passResult.failReasons.length > 0 && (
                        <Text style={{ fontSize: 6, color: '#991b1b', marginTop: 2 }}>
                            Grund: {passResult.failReasons.join('; ')}
                        </Text>
                    )}
                </View>

                {/* Unterschriften - 3 nebeneinander */}
                <View style={styles.signaturesContainer}>
                    <View style={styles.signaturesTop}>
                        <View style={styles.signatureBlock}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureName}>Vorsitzende/r</Text>
                        </View>
                        <View style={styles.signatureBlock}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureName}>1. Prüfer/in</Text>
                        </View>
                        <View style={styles.signatureBlock}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureName}>2. Prüfer/in</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Erstellt mit GP Digital</Text>
                    <Text>Seite 1 von 1</Text>
                </View>
            </Page>
        </Document>
    );
};
