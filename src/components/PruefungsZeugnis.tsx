import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Student, GradeScale, Innung, DEFAULT_GRADE_SCALE, DEFAULT_INNUNG } from '../lib/types';
import { getGradeLabel } from '../lib/grading';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: '#000'
    },
    header: {
        textAlign: 'center',
        marginBottom: 15
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 3,
        textTransform: 'uppercase',
        letterSpacing: 2
    },
    subtitle: {
        fontSize: 12,
        marginBottom: 2
    },
    innungName: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 1
    },
    innungAddress: {
        fontSize: 8,
        color: '#444'
    },
    section: {
        marginBottom: 15
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4
    },
    label: {
        width: 130,
        fontWeight: 'bold'
    },
    value: {
        flex: 1
    },
    table: {
        marginTop: 15,
        marginBottom: 15
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#333',
        paddingVertical: 5,
        paddingHorizontal: 8,
        fontWeight: 'bold'
    },
    tableRow: {
        flexDirection: 'row',
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: '#333',
        paddingVertical: 4,
        paddingHorizontal: 8
    },
    tableRowAlt: {
        backgroundColor: '#fafafa'
    },
    colBereich: {
        flex: 3
    },
    colNote: {
        width: 140,
        textAlign: 'center'
    },
    resultSection: {
        marginTop: 15,
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 4
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5
    },
    resultLabel: {
        fontWeight: 'bold',
        fontSize: 10
    },
    resultValue: {
        fontSize: 10
    },
    finalResult: {
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 2,
        borderTopColor: '#333',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    finalLabel: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    finalValue: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    passed: {
        marginTop: 15,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: 'bold'
    },
    passedYes: {
        color: '#166534'
    },
    passedNo: {
        color: '#dc2626'
    },
    gradeScaleSection: {
        marginTop: 20,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#ccc'
    },
    gradeScaleTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center'
    },
    gradeScaleTable: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 0
    },
    gradeScaleCell: {
        width: 65,
        borderWidth: 1,
        borderColor: '#333',
        padding: 3,
        textAlign: 'center'
    },
    gradeScaleCellHeader: {
        backgroundColor: '#e5e5e5',
        fontWeight: 'bold',
        fontSize: 7
    },
    gradeScaleCellValue: {
        fontSize: 6
    },
    signatures: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    signatureLine: {
        width: 150,
        borderTopWidth: 1,
        borderTopColor: '#666',
        paddingTop: 4,
        textAlign: 'center',
        fontSize: 7
    },
    footerText: {
        marginTop: 10,
        textAlign: 'center',
        fontSize: 7,
        color: '#666'
    },
    dateLocation: {
        marginTop: 20,
        textAlign: 'right',
        fontSize: 9
    }
});

interface PruefungsZeugnisProps {
    student: Student;
    results: {
        teil1Points: number;
        teil1Grade: number;
        teil2PraxisPoints: number;
        teil2PraxisGrade: number;
        wahlqualifikationPoints: number;
        wahlqualifikationGrade: number;
        friseurtechnikenPoints: number;
        friseurtechnikenGrade: number;
        betriebsorgPoints: number;
        betriebsorgGrade: number;
        wisoPoints: number;
        wisoGrade: number;
        teil2GesamtPoints: number;
        teil2GesamtGrade: number;
        gesamtPoints: number;
        gesamtGrade: number;
        passed: boolean;
    };
    innung?: Innung;
    gradeScale?: GradeScale;
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '________________';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '________________';
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return '________________';
    }
};

export const PruefungsZeugnis: React.FC<PruefungsZeugnisProps> = ({
    student,
    results,
    innung = DEFAULT_INNUNG,
    gradeScale = DEFAULT_GRADE_SCALE
}) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header with Innung */}
                <View style={styles.header}>
                    {innung.logo && (
                        <Image src={innung.logo} style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 8, alignSelf: 'center' }} />
                    )}
                    <Text style={styles.title}>Prüfungszeugnis</Text>
                    <Text style={styles.subtitle}>Gesellenprüfung im Friseurhandwerk</Text>
                    {innung.name && (
                        <>
                            <Text style={styles.innungName}>{innung.name}</Text>
                            {innung.street && <Text style={styles.innungAddress}>{innung.street}</Text>}
                            {innung.zipCity && <Text style={styles.innungAddress}>{innung.zipCity}</Text>}
                        </>
                    )}
                </View>

                {/* Student Info */}
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Name:</Text>
                        <Text style={styles.value}>{student.gender} {student.firstName} {student.lastName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>geb. am:</Text>
                        <Text style={styles.value}>{formatDate(student.dob)}{student.birthPlace ? ` in ${student.birthPlace}` : ''}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Prüfungsnummer:</Text>
                        <Text style={styles.value}>{student.examNumber}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Ausbildungsbetrieb:</Text>
                        <Text style={styles.value}>{student.salon}</Text>
                    </View>
                </View>

                {/* Results Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.colBereich}>Prüfungsbereich</Text>
                        <Text style={styles.colNote}>Note (Punkte)</Text>
                    </View>

                    {/* Teil 1 */}
                    <View style={styles.tableRow}>
                        <Text style={styles.colBereich}>Teil 1: Klassische Friseurarbeit</Text>
                        <Text style={styles.colNote}>{getGradeLabel(results.teil1Grade)} ({results.teil1Points.toFixed(2)} Pkt.)</Text>
                    </View>

                    {/* Teil 2 Header */}
                    <View style={[styles.tableRow, styles.tableRowAlt]}>
                        <Text style={[styles.colBereich, { fontWeight: 'bold' }]}>Teil 2 der Gesellenprüfung</Text>
                        <Text style={styles.colNote}></Text>
                    </View>

                    {/* Teil 2 - Praxis */}
                    <View style={styles.tableRow}>
                        <Text style={styles.colBereich}>  Friseur- und Kosmetikdienstleistungen</Text>
                        <Text style={styles.colNote}>{getGradeLabel(results.teil2PraxisGrade)} ({results.teil2PraxisPoints.toFixed(2)} Pkt.)</Text>
                    </View>

                    {/* Wahlqualifikation */}
                    <View style={[styles.tableRow, styles.tableRowAlt]}>
                        <Text style={styles.colBereich}>  Wahlqualifikation: {student.wahlqualifikation || 'nicht angegeben'}</Text>
                        <Text style={styles.colNote}>{getGradeLabel(results.wahlqualifikationGrade)} ({results.wahlqualifikationPoints.toFixed(2)} Pkt.)</Text>
                    </View>

                    {/* Theory subjects */}
                    <View style={styles.tableRow}>
                        <Text style={styles.colBereich}>  Friseurtechniken</Text>
                        <Text style={styles.colNote}>{getGradeLabel(results.friseurtechnikenGrade)} ({results.friseurtechnikenPoints.toFixed(2)} Pkt.)</Text>
                    </View>

                    <View style={[styles.tableRow, styles.tableRowAlt]}>
                        <Text style={styles.colBereich}>  Betriebsorganisation und Kundenmanagement</Text>
                        <Text style={styles.colNote}>{getGradeLabel(results.betriebsorgGrade)} ({results.betriebsorgPoints.toFixed(2)} Pkt.)</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <Text style={styles.colBereich}>  Wirtschafts- und Sozialkunde</Text>
                        <Text style={styles.colNote}>{getGradeLabel(results.wisoGrade)} ({results.wisoPoints.toFixed(2)} Pkt.)</Text>
                    </View>

                    {/* Teil 2 Gesamtergebnis */}
                    <View style={[styles.tableRow, { backgroundColor: '#e8e8e8' }]}>
                        <Text style={[styles.colBereich, { fontWeight: 'bold' }]}>Teil 2 Gesamtergebnis</Text>
                        <Text style={[styles.colNote, { fontWeight: 'bold' }]}>{getGradeLabel(results.teil2GesamtGrade)} ({results.teil2GesamtPoints.toFixed(2)} Pkt.)</Text>
                    </View>
                </View>

                {/* Final Result */}
                <View style={styles.resultSection}>
                    <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Teil 1 (25%)</Text>
                        <Text style={styles.resultValue}>{results.teil1Points.toFixed(2)} Punkte - {getGradeLabel(results.teil1Grade)}</Text>
                    </View>
                    <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Teil 2 (75%)</Text>
                        <Text style={styles.resultValue}>{results.teil2GesamtPoints.toFixed(2)} Punkte - {getGradeLabel(results.teil2GesamtGrade)}</Text>
                    </View>
                    <View style={styles.finalResult}>
                        <Text style={styles.finalLabel}>Gesamtergebnis</Text>
                        <Text style={styles.finalValue}>{results.gesamtPoints.toFixed(2)} Punkte - {getGradeLabel(results.gesamtGrade)}</Text>
                    </View>
                </View>

                {/* Passed/Failed */}
                <Text style={[styles.passed, results.passed ? styles.passedYes : styles.passedNo]}>
                    Die Gesellenprüfung wurde {results.passed ? 'BESTANDEN' : 'NICHT BESTANDEN'}
                </Text>

                {/* Date and Location */}
                <View style={styles.dateLocation}>
                    <Text>Braunschweig, den {new Date().toLocaleDateString('de-DE')}</Text>
                </View>

                {/* Signatures */}
                <View style={styles.signatures}>
                    <View style={styles.signatureLine}>
                        <Text>Vorsitzender des</Text>
                        <Text>Prüfungsausschusses</Text>
                    </View>
                    <View style={styles.signatureLine}>
                        <Text>Mitglied des</Text>
                        <Text>Prüfungsausschusses</Text>
                    </View>
                    <View style={styles.signatureLine}>
                        <Text>Mitglied des</Text>
                        <Text>Prüfungsausschusses</Text>
                    </View>
                </View>

                {/* Grade Scale - at the bottom after signatures */}
                <View style={styles.gradeScaleSection}>
                    <Text style={styles.gradeScaleTitle}>Notenschlüssel (Punktegrenzen)</Text>
                    <View style={styles.gradeScaleTable}>
                        <View style={[styles.gradeScaleCell, styles.gradeScaleCellHeader]}>
                            <Text>sehr gut (1)</Text>
                            <Text style={styles.gradeScaleCellValue}>{gradeScale.sehrGut.min}-{gradeScale.sehrGut.max}</Text>
                        </View>
                        <View style={[styles.gradeScaleCell, styles.gradeScaleCellHeader]}>
                            <Text>gut (2)</Text>
                            <Text style={styles.gradeScaleCellValue}>{gradeScale.gut.min}-{gradeScale.gut.max}</Text>
                        </View>
                        <View style={[styles.gradeScaleCell, styles.gradeScaleCellHeader]}>
                            <Text>befriedigend (3)</Text>
                            <Text style={styles.gradeScaleCellValue}>{gradeScale.befriedigend.min}-{gradeScale.befriedigend.max}</Text>
                        </View>
                        <View style={[styles.gradeScaleCell, styles.gradeScaleCellHeader]}>
                            <Text>ausreichend (4)</Text>
                            <Text style={styles.gradeScaleCellValue}>{gradeScale.ausreichend.min}-{gradeScale.ausreichend.max}</Text>
                        </View>
                        <View style={[styles.gradeScaleCell, styles.gradeScaleCellHeader]}>
                            <Text>mangelhaft (5)</Text>
                            <Text style={styles.gradeScaleCellValue}>{gradeScale.mangelhaft.min}-{gradeScale.mangelhaft.max}</Text>
                        </View>
                        <View style={[styles.gradeScaleCell, styles.gradeScaleCellHeader]}>
                            <Text>ungenügend (6)</Text>
                            <Text style={styles.gradeScaleCellValue}>{gradeScale.ungenuegend.min}-{gradeScale.ungenuegend.max}</Text>
                        </View>
                    </View>

                    {/* Footer Text - directly below grade scale */}
                    <Text style={styles.footerText}>Erstellt mit Gesellenprüfung Digital</Text>
                </View>
            </Page>
        </Document>
    );
};
