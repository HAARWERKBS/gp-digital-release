import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Student, GradingSheet, Grade, DEFAULT_GRADE_SCALE } from '../lib/types';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
        textDecoration: 'underline',
    },
    subtitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        textDecoration: 'underline',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    label: {
        width: 150,
    },
    value: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 2,
    },
    studentBox: {
        borderWidth: 1,
        borderColor: '#000',
        padding: 10,
        marginBottom: 25,
        marginTop: 5,
    },
    studentName: {
        fontSize: 11,
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#000',
        backgroundColor: '#f0f0f0',
    },
    tableHeaderCell: {
        padding: 6,
        fontWeight: 'bold',
        fontSize: 10,
    },
    tableHeaderTask: {
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: '#000',
    },
    tableHeaderPoints: {
        width: 100,
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#000',
    },
    tableCell: {
        padding: 6,
        fontSize: 10,
    },
    tableCellTask: {
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: '#000',
    },
    tableCellPoints: {
        width: 100,
        textAlign: 'center',
    },
    taskNumber: {
        fontWeight: 'bold',
        marginRight: 8,
    },
    theorySection: {
        paddingLeft: 20,
        paddingTop: 4,
        paddingBottom: 4,
    },
    theoryItem: {
        fontSize: 9,
        marginBottom: 2,
    },
    sumRow: {
        flexDirection: 'row',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#000',
        backgroundColor: '#f5f5f5',
    },
    sumLabel: {
        flex: 1,
        padding: 6,
        fontWeight: 'bold',
        borderRightWidth: 1,
        borderRightColor: '#000',
    },
    sumValue: {
        width: 100,
        padding: 6,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    footnote: {
        marginTop: 15,
        fontSize: 8,
        fontStyle: 'italic',
    },
    gradeTable: {
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#000',
    },
    gradeTableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    gradeTableRowLast: {
        flexDirection: 'row',
    },
    gradeTableCell: {
        flex: 1,
        padding: 4,
        textAlign: 'center',
        fontSize: 8,
        borderRightWidth: 1,
        borderRightColor: '#000',
    },
    gradeTableCellLast: {
        flex: 1,
        padding: 4,
        textAlign: 'center',
        fontSize: 8,
    },
    gradeTableHeader: {
        fontWeight: 'bold',
        backgroundColor: '#f0f0f0',
    },
});

interface AnlageBescheinigungProps {
    student: Student;
    sheet: GradingSheet;
    grade: Grade;
    part: 1 | 2;
}

export const AnlageBescheinigung: React.FC<AnlageBescheinigungProps> = ({
    student,
    sheet,
    grade,
    part,
}) => {
    // Berechne Punkte für jede Arbeitsaufgabe (Durchschnitt aller Prüfer)
    const getTaskPoints = (taskId: string): number => {
        if (!grade.examiners || grade.examiners.length === 0) return 0;
        const sum = grade.examiners.reduce((acc, ex) => acc + (ex.scores[taskId] || 0), 0);
        return sum / grade.examiners.length;
    };

    // Berechne Prüfungsstück-Punkte
    const getExamPiecePoints = (): number => {
        if (!sheet.examPiece || !grade.examPieceExaminers || grade.examPieceExaminers.length === 0) return 0;
        const sum = grade.examPieceExaminers.reduce((acc, ex) => acc + (ex.scores[sheet.examPiece!.id] || 0), 0);
        return sum / grade.examPieceExaminers.length;
    };

    // Berechne gewichtete Punkte für Arbeitsaufgaben
    const getWeightedTaskPoints = (): number => {
        return sheet.tasks.reduce((sum, task) => {
            const points = getTaskPoints(task.id);
            return sum + (points * task.weight);
        }, 0);
    };

    // Berechne Theorie-Punkte (nur Teil 2)
    const getTheoryPoints = (): number => {
        if (!sheet.theorySubjects || !grade.theoryScores) return 0;

        let totalPoints = 0;
        let subjectCount = 0;

        sheet.theorySubjects.forEach(subject => {
            const score = grade.theoryScores?.find(ts => ts.subjectId === subject.id);
            if (score) {
                const written = score.writtenPoints || 0;
                const oral = score.oralPoints || 0;

                let subjectPoints: number;
                if (oral === 0) {
                    subjectPoints = written;
                } else {
                    const weighted = (written * subject.writtenWeight + oral * subject.oralWeight) / (subject.writtenWeight + subject.oralWeight);
                    subjectPoints = Math.max(written, weighted);
                }
                totalPoints += subjectPoints;
                subjectCount++;
            }
        });

        return subjectCount > 0 ? totalPoints / subjectCount : 0;
    };

    // Gesamtpunkte für diesen Teil
    const workTasksPoints = getWeightedTaskPoints();
    const examPiecePoints = getExamPiecePoints();

    // Gewichtete Summe: Arbeitsaufgaben (70%) + Prüfungsstück (30%)
    const totalPartPoints = (workTasksPoints * sheet.workTaskWeight) + (examPiecePoints * sheet.examPieceWeight);

    // Anrechnung auf Gesamtprüfung
    const weightFactor = part === 1 ? 0.25 : 0.75;
    const contributionPoints = totalPartPoints * weightFactor;

    // Adresse formatieren
    const formatAddress = () => {
        const parts = [];
        if (student.street || student.houseNumber) {
            parts.push(`${student.street || ''} ${student.houseNumber || ''}`.trim());
        }
        if (student.zip || student.city) {
            parts.push(`${student.zip || ''} ${student.city || ''}`.trim());
        }
        return parts;
    };

    const theorySubjectNames = part === 1
        ? [
            "1. Arbeitsschutz",
            "2. Kundenbetreuung",
            "3. Haar- und Kopfhautpflege",
            "4. Frisurenempfehlung und Frisurengestaltung",
            "5. Haarschnitt",
            "6. Dauerhafte Umformung"
        ]
        : sheet.theorySubjects?.map((s, i) => `${i + 1}. ${s.name}`) || [];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Titel */}
                <Text style={styles.title}>Anlage zur Bescheinigung Gesellenprüfung Teil {part}</Text>
                <Text style={styles.subtitle}>im Friseurhandwerk</Text>

                {/* Prüfungsnummer */}
                <View style={styles.row}>
                    <Text style={styles.label}>Prüfungs-Nr. des Prüflings:</Text>
                    <Text style={styles.value}>{student.examNumber}</Text>
                </View>

                {/* Auszubildende/r Box */}
                <Text style={{ marginTop: 10, marginBottom: 5 }}>Auszubildende/r</Text>
                <View style={styles.studentBox}>
                    <Text style={styles.studentName}>{student.gender === 'Frau' ? 'Frau' : student.gender === 'Herr' ? 'Herr' : ''}</Text>
                    <Text style={styles.studentName}>{student.firstName} {student.lastName}</Text>
                    {formatAddress().map((line, i) => (
                        <Text key={i} style={styles.studentName}>{line}</Text>
                    ))}
                </View>

                {/* Tabelle Arbeitsaufgaben */}
                <View style={styles.table}>
                    {/* Header */}
                    <View style={styles.tableHeader}>
                        <View style={[styles.tableHeaderCell, styles.tableHeaderTask]}>
                            <Text>Arbeitsaufgabe</Text>
                        </View>
                        <View style={[styles.tableHeaderCell, styles.tableHeaderPoints]}>
                            <Text>erreichte Punkte *)</Text>
                        </View>
                    </View>

                    {/* Arbeitsaufgaben */}
                    {sheet.tasks.map((task, index) => (
                        <View key={task.id} style={styles.tableRow}>
                            <View style={[styles.tableCell, styles.tableCellTask]}>
                                <Text>
                                    <Text style={styles.taskNumber}>{index + 1}</Text>
                                    {task.name}
                                </Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableCellPoints]}>
                                <Text>{getTaskPoints(task.id).toFixed(2)}</Text>
                            </View>
                        </View>
                    ))}

                    {/* Theorie-Sektion nur bei Teil 2 mit Theorie-Noten */}
                    {part === 2 && sheet.theorySubjects && (
                        <View style={styles.tableRow}>
                            <View style={[styles.tableCell, styles.tableCellTask]}>
                                <Text style={{ fontWeight: 'bold' }}>Theorie:</Text>
                                <View style={styles.theorySection}>
                                    {sheet.theorySubjects.map((subject, i) => (
                                        <Text key={i} style={styles.theoryItem}>{i + 1}. {subject.name}</Text>
                                    ))}
                                </View>
                            </View>
                            <View style={[styles.tableCell, styles.tableCellPoints]}>
                                <Text>{getTheoryPoints().toFixed(2)}</Text>
                            </View>
                        </View>
                    )}

                    {/* Prüfungsstück */}
                    {sheet.examPiece && (
                        <View style={styles.tableRow}>
                            <View style={[styles.tableCell, styles.tableCellTask]}>
                                <Text style={{ fontWeight: 'bold' }}>Prüfungsstück:</Text>
                                <Text>{sheet.examPiece.name}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableCellPoints]}>
                                <Text>{examPiecePoints.toFixed(2)}</Text>
                            </View>
                        </View>
                    )}

                    {/* Summe */}
                    <View style={styles.sumRow}>
                        <Text style={styles.sumLabel}>Summe der Höchstpunkte für Teil {part} der Gesellenprüfung *)</Text>
                        <Text style={styles.sumValue}>{totalPartPoints.toFixed(2)}</Text>
                    </View>

                    {/* Anrechnung */}
                    <View style={styles.sumRow}>
                        <Text style={styles.sumLabel}>Anrechnung von {part === 1 ? '25' : '75'} % auf die gesamte Gesellenprüfung</Text>
                        <Text style={styles.sumValue}>{contributionPoints.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Fußnote */}
                <Text style={styles.footnote}>
                    *) Die Summe der Höchstpunkte ergibt sich aus der Gewichtung der Prüfungsleistungen gemäß Ausbildungsordnung.
                </Text>

                {/* Notenschlüssel */}
                <View style={styles.gradeTable}>
                    <View style={[styles.gradeTableRow, styles.gradeTableHeader]}>
                        <View style={styles.gradeTableCell}><Text>Punkte</Text></View>
                        <View style={styles.gradeTableCell}><Text>100 – 92{'\n'}Punkte</Text></View>
                        <View style={styles.gradeTableCell}><Text>unter 92 – 81{'\n'}Punkte</Text></View>
                        <View style={styles.gradeTableCell}><Text>unter 81 – 67{'\n'}Punkte</Text></View>
                        <View style={styles.gradeTableCell}><Text>unter 67 – 50{'\n'}Punkte</Text></View>
                        <View style={styles.gradeTableCell}><Text>unter 50 – 30{'\n'}Punkte</Text></View>
                        <View style={styles.gradeTableCellLast}><Text>unter 30 – 0{'\n'}Punkte</Text></View>
                    </View>
                    <View style={styles.gradeTableRowLast}>
                        <View style={styles.gradeTableCell}><Text>Note</Text></View>
                        <View style={styles.gradeTableCell}><Text>sehr gut{'\n'}1</Text></View>
                        <View style={styles.gradeTableCell}><Text>gut{'\n'}2</Text></View>
                        <View style={styles.gradeTableCell}><Text>befriedigend{'\n'}3</Text></View>
                        <View style={styles.gradeTableCell}><Text>ausreichend{'\n'}4</Text></View>
                        <View style={styles.gradeTableCell}><Text>mangelhaft{'\n'}5</Text></View>
                        <View style={styles.gradeTableCellLast}><Text>ungenügend{'\n'}6</Text></View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default AnlageBescheinigung;
