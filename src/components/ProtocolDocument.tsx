import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Grade, GradingSheet, Student, Innung } from '../lib/types';
import { calculateGrade } from '../lib/grading';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        paddingBottom: 60,
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: '#333'
    },
    // Header
    headerBox: {
        flexDirection: 'row',
        marginBottom: 30,
        borderBottom: '2px solid #4f46e5',
        paddingBottom: 10,
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        textTransform: 'uppercase'
    },
    subTitle: {
        fontSize: 10,
        color: '#6b7280',
        marginTop: 2
    },
    innungName: {
        fontSize: 9,
        color: '#4f46e5',
        marginTop: 4,
        fontWeight: 'bold'
    },
    innungAddress: {
        fontSize: 7,
        color: '#6b7280'
    },
    dateText: {
        fontSize: 10,
        color: '#6b7280'
    },

    // Prüflingsdaten - freistehend ohne Box
    studentInfo: {
        marginBottom: 30
    },
    studentRow: {
        flexDirection: 'row',
        marginBottom: 4
    },
    studentLabel: {
        width: 130,
        fontWeight: 'bold',
        color: '#000',
        fontSize: 9
    },
    studentValue: {
        flex: 1,
        color: '#000',
        fontSize: 9
    },

    // Tabelle
    table: {
        marginBottom: 20
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#4f46e5',
        color: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 6,
        fontWeight: 'bold',
        fontSize: 8
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e5e7eb',
        paddingVertical: 8,
        paddingHorizontal: 6,
        alignItems: 'center',
        minHeight: 28
    },
    tableRowAlt: {
        backgroundColor: '#fafafa'
    },
    colId: { width: '5%', textAlign: 'center', fontSize: 9 },
    colName: { width: '38%', fontSize: 9 },
    colWeight: { width: '12%', textAlign: 'center', fontSize: 9 },
    colExaminer: { width: '12%', textAlign: 'center', fontSize: 9 },
    colTotal: { width: '9%', textAlign: 'right', fontWeight: 'bold', fontSize: 9 },

    // Ergebnis-Box rechts
    resultSection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 40
    },
    resultBox: {
        width: 220,
        padding: 12
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    resultLabel: {
        fontSize: 9,
        color: '#000'
    },
    resultValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#000'
    },
    resultDivider: {
        height: 1,
        backgroundColor: '#000',
        marginVertical: 8
    },
    gradeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4f46e5',
        textAlign: 'right'
    },

    // Unterschriften - 3 oben, 1 unten links
    signaturesTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30
    },
    signaturesBottom: {
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    signatureBlock: {
        width: 150
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 6,
        marginBottom: 2
    },
    signatureName: {
        fontSize: 8,
        color: '#000',
        textAlign: 'center'
    },
    signatureRole: {
        fontSize: 7,
        color: '#666',
        textAlign: 'center'
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 25,
        left: 40,
        fontSize: 8,
        color: '#9ca3af'
    }
});

interface ProtocolDocumentProps {
    student: Student;
    sheet: GradingSheet;
    grade: Grade;
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
}

export const ProtocolDocument: React.FC<ProtocolDocumentProps> = ({ student, sheet, grade, innung }) => {
    const { examiners } = grade;

    // Calculate final based on average of all examiners
    const totalMaxPoints = sheet.tasks.reduce((sum, t) => sum + (t.maxPoints * t.weight), 0);

    // Helper to get average score for a task across all examiners
    const getAvgScore = (taskId: string) => {
        if (examiners.length === 0) return 0;
        const sum = examiners.reduce((acc, ex) => acc + (ex.scores[taskId] || 0), 0);
        return sum / examiners.length;
    };

    const finalPoints = sheet.tasks.reduce((sum, t) => sum + (getAvgScore(t.id) * t.weight), 0);
    const finalGrade = calculateGrade(finalPoints, totalMaxPoints);

    // Bestimme den Prüfungsteil aus der Sheet-ID
    const teilNumber = sheet.id === 'part1' ? '1' : sheet.id === 'part2' ? '2' : '';

    // Prüfernamen für Unterschriften
    const examinerNames = examiners.map((ex, i) => ex.name && !/^Prüfer\s*\d+$/i.test(ex.name) ? ex.name : (i === 0 ? 'Herr Prüfer' : 'Frau Prüfer'));

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerBox}>
                    <View style={styles.headerLeft}>
                        {innung?.logo && (
                            <Image src={innung.logo} style={{ width: 50, height: 50, objectFit: 'contain' }} />
                        )}
                        <View>
                            <Text style={styles.title}>GESELLENPRÜFUNG TEIL {teilNumber}</Text>
                            <Text style={styles.subTitle}>Niederschrift - Teil {teilNumber} der Gesellenprüfung</Text>
                            {innung?.name && (
                                <Text style={styles.innungName}>{innung.name}</Text>
                            )}
                            {innung?.street && innung?.zipCity && (
                                <Text style={styles.innungAddress}>{innung.street}, {innung.zipCity}</Text>
                            )}
                        </View>
                    </View>
                    <Text style={styles.dateText}>{new Date().toLocaleDateString('de-DE')}</Text>
                </View>

                {/* Prüflingsdaten - freistehend */}
                <View style={styles.studentInfo}>
                    <View style={styles.studentRow}>
                        <Text style={styles.studentLabel}>Prüfungsnummer:</Text>
                        <Text style={styles.studentValue}>{student.examNumber}</Text>
                    </View>
                    <View style={styles.studentRow}>
                        <Text style={styles.studentLabel}>Prüfling:</Text>
                        <Text style={styles.studentValue}>{student.firstName} {student.lastName}</Text>
                    </View>
                    <View style={styles.studentRow}>
                        <Text style={styles.studentLabel}>Geboren am:</Text>
                        <Text style={styles.studentValue}>{formatDate(student.dob)}</Text>
                    </View>
                    <View style={styles.studentRow}>
                        <Text style={styles.studentLabel}>Ausbildungsbetrieb:</Text>
                        <Text style={styles.studentValue}>{student.salon} ({student.company})</Text>
                    </View>
                    <View style={styles.studentRow}>
                        <Text style={styles.studentLabel}>Lehrzeit:</Text>
                        <Text style={styles.studentValue}>{formatDate(student.trainingStart)}  bis  {formatDate(student.trainingEnd)}</Text>
                    </View>
                </View>

                {/* Tabelle */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.colId}>#</Text>
                        <Text style={styles.colName}>Aufgabe</Text>
                        <Text style={styles.colWeight}>Faktor</Text>
                        <Text style={styles.colExaminer}>Prüfer 1</Text>
                        <Text style={styles.colExaminer}>Prüfer 2</Text>
                        <Text style={styles.colExaminer}>Prüfer 3</Text>
                        <Text style={styles.colTotal}>Ø Pkt.</Text>
                    </View>

                    {sheet.tasks.map((task, i) => {
                        const avg = getAvgScore(task.id);
                        return (
                            <View key={task.id} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
                                <Text style={styles.colId}>{i + 1}</Text>
                                <Text style={styles.colName}>{task.name}</Text>
                                <Text style={styles.colWeight}>x {task.weight}</Text>
                                {examiners.slice(0, 3).map((ex, idx) => (
                                    <Text key={idx} style={styles.colExaminer}>{ex.scores[task.id] || 0}</Text>
                                ))}
                                {/* Leere Spalten wenn weniger als 3 Prüfer */}
                                {Array.from({ length: Math.max(0, 3 - examiners.length) }).map((_, idx) => (
                                    <Text key={`empty-${idx}`} style={styles.colExaminer}>-</Text>
                                ))}
                                <Text style={styles.colTotal}>{(avg * task.weight).toFixed(2)}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Ergebnis-Box rechts */}
                <View style={styles.resultSection}>
                    <View style={styles.resultBox}>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Summe Punkte (Max: {totalMaxPoints})</Text>
                            <Text style={styles.resultValue}>{finalPoints.toFixed(2)}</Text>
                        </View>
                        <View style={styles.resultDivider} />
                        <Text style={styles.gradeText}>
                            {finalGrade.label} ({finalGrade.value})
                        </Text>
                    </View>
                </View>

                {/* Unterschriften - 3 nebeneinander */}
                <View style={styles.signaturesTop}>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureRole}>Vorsitzende/r</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureRole}>1. Prüfer/in</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureRole}>2. Prüfer/in</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Erstellt mit GP Digital</Text>
                </View>
            </Page>
        </Document>
    );
};
