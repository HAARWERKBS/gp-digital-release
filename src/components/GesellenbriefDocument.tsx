import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Student, Innung, CertificatePositions, DEFAULT_CERTIFICATE_POSITIONS, CustomTextField } from '../lib/types';

// Styles für den Gesellenbrief ohne Hintergrundbild
const styles = StyleSheet.create({
    page: {
        padding: 50,
        fontFamily: 'Helvetica',
        position: 'relative',
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    },
    content: {
        position: 'relative',
        zIndex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    // Standard Design (ohne Hintergrundbild)
    header: {
        textAlign: 'center',
        marginBottom: 40,
        paddingTop: 30,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 80,
        height: 80,
        objectFit: 'contain',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a365d',
        marginBottom: 10,
        letterSpacing: 3,
    },
    subtitle: {
        fontSize: 14,
        color: '#4a5568',
        marginBottom: 5,
    },
    innungName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2d3748',
        marginTop: 10,
    },
    innungAddress: {
        fontSize: 10,
        color: '#718096',
        marginTop: 2,
    },
    mainContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    certifyText: {
        fontSize: 12,
        color: '#4a5568',
        textAlign: 'center',
        marginBottom: 20,
    },
    nameContainer: {
        marginVertical: 30,
        textAlign: 'center',
    },
    gender: {
        fontSize: 14,
        color: '#4a5568',
        marginBottom: 5,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a365d',
        marginBottom: 10,
    },
    salonLabel: {
        fontSize: 11,
        color: '#718096',
        marginTop: 15,
    },
    salon: {
        fontSize: 14,
        color: '#2d3748',
        marginTop: 3,
    },
    passedText: {
        fontSize: 14,
        color: '#2d3748',
        textAlign: 'center',
        marginTop: 30,
        lineHeight: 1.6,
    },
    passedHighlight: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#166534',
    },
    footer: {
        marginTop: 'auto',
        paddingBottom: 30,
    },
    dateLocation: {
        textAlign: 'right',
        fontSize: 11,
        color: '#4a5568',
        marginBottom: 40,
    },
    signatures: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    signatureLine: {
        width: 150,
        borderTopWidth: 1,
        borderTopColor: '#a0aec0',
        paddingTop: 5,
        textAlign: 'center',
    },
    signatureLabel: {
        fontSize: 9,
        color: '#718096',
    },
    decorativeLine: {
        height: 3,
        backgroundColor: '#4f46e5',
        marginVertical: 20,
        borderRadius: 2,
    },
    decorativeLineGold: {
        height: 2,
        backgroundColor: '#d69e2e',
        marginVertical: 15,
        width: '60%',
        alignSelf: 'center',
        borderRadius: 1,
    },
    footerText: {
        position: 'absolute',
        bottom: 15,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 7,
        color: '#a0aec0',
    },
});

// mm zu pt Umrechnung (1mm = 2.83465pt)
const MM_TO_PT = 2.83465;

interface GesellenbriefDocumentProps {
    student: Student;
    innung?: Innung;
    backgroundImage?: string;
    date?: string;
    positions?: CertificatePositions;
    customTextFields?: CustomTextField[];
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
        return new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
    }
};

// Hilfsfunktion um den Ort aus zipCity zu extrahieren (z.B. "30159 Hannover" -> "Hannover")
const extractCity = (zipCity?: string): string => {
    if (!zipCity) return '';
    // Format: "PLZ Stadt" - wir nehmen alles nach dem ersten Leerzeichen
    const parts = zipCity.trim().split(' ');
    if (parts.length > 1) {
        return parts.slice(1).join(' ');
    }
    return zipCity;
};

// Komponente mit Hintergrundbild - nur Name, Salon und Datum als Overlay
const GesellenbriefWithBackground: React.FC<GesellenbriefDocumentProps> = ({ student, innung, backgroundImage, date, positions = DEFAULT_CERTIFICATE_POSITIONS, customTextFields = [] }) => {
    // A4 Breite = 210mm
    const pageWidthMM = 210;
    const pageWidthPT = pageWidthMM * MM_TO_PT;

    // Berechne die Position basierend auf Ausrichtung
    const getPositionStyle = (pos: typeof positions.name): any => {
        const baseStyle: any = {
            position: 'absolute',
            top: pos.y * MM_TO_PT,
        };

        // Position-Logik basierend auf Ausrichtung:
        // - Linksbündig: X ist linke Kante, Text geht nach rechts
        // - Zentriert: Volle Breite mit textAlign center (X wird ignoriert, immer Seitenmitte)
        // - Rechtsbündig: X ist rechte Kante, Text endet bei X
        if (pos.align === 'center') {
            // Zentriert: Volle Seitenbreite, Text wird mittig ausgerichtet
            baseStyle.left = 0;
            baseStyle.width = pageWidthPT;
            baseStyle.textAlign = 'center';
        } else if (pos.align === 'left') {
            // Linksbündig: linke Kante bei X
            baseStyle.left = pos.x * MM_TO_PT;
            baseStyle.textAlign = 'left';
        } else {
            // Rechtsbündig: rechte Kante bei X, Text endet bei X
            baseStyle.left = 0;
            baseStyle.width = pos.x * MM_TO_PT;
            baseStyle.textAlign = 'right';
        }

        return baseStyle;
    };

    return (
        <Page size="A4" style={{ position: 'relative' }}>
            {/* Container für alle Elemente */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                {/* Hintergrundbild */}
                {backgroundImage && (
                    <Image
                        src={backgroundImage}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                        }}
                    />
                )}

                {/* Name Overlay */}
                <View style={getPositionStyle(positions.name)}>
                    <Text style={{ fontSize: positions.name.fontSize, color: positions.name.color, fontWeight: 'bold' }}>
                        {student.gender} {student.firstName} {student.lastName}
                    </Text>
                </View>

                {/* Salon Overlay */}
                <View style={getPositionStyle(positions.salon)}>
                    <Text style={{ fontSize: positions.salon.fontSize, color: positions.salon.color }}>
                        {student.salon}
                    </Text>
                </View>

                {/* Datum Overlay - mit Ort der Innung */}
                <View style={getPositionStyle(positions.date)}>
                    <Text style={{ fontSize: positions.date.fontSize, color: positions.date.color }}>
                        {extractCity(innung?.zipCity)}{extractCity(innung?.zipCity) ? ', den ' : ''}{formatDate(date)}
                    </Text>
                </View>

                {/* Custom Text Fields Overlay */}
                {customTextFields.filter(field => field.enabled && field.text).map((field) => {
                    // A4 Breite = 210mm
                    const pageWidthMM = 210;
                    const pageWidthPT = pageWidthMM * MM_TO_PT;

                    // Position-Logik basierend auf Ausrichtung:
                    // - Linksbündig: X ist linke Kante, Text geht nach rechts
                    // - Zentriert: Volle Breite mit textAlign center (X wird bei center ignoriert, immer Seitenmitte)
                    // - Rechtsbündig: X ist rechte Kante, Text endet bei X
                    const fieldStyle: any = {
                        position: 'absolute',
                        top: field.y * MM_TO_PT,
                    };

                    // X ist immer die linke Kante des Textfelds
                    fieldStyle.left = field.x * MM_TO_PT;
                    fieldStyle.textAlign = field.align;

                    // Font-Familie basierend auf Bold/Italic
                    let fontFamily = 'Helvetica';
                    if (field.bold && field.italic) {
                        fontFamily = 'Helvetica-BoldOblique';
                    } else if (field.bold) {
                        fontFamily = 'Helvetica-Bold';
                    } else if (field.italic) {
                        fontFamily = 'Helvetica-Oblique';
                    }

                    // Zeilenumbrüche unterstützen
                    const textLines = field.text.split('\n');

                    return (
                        <View key={field.id} style={fieldStyle}>
                            {textLines.map((line, lineIndex) => (
                                <Text key={lineIndex} style={{
                                    fontSize: field.fontSize,
                                    color: field.color,
                                    fontFamily: fontFamily,
                                }}>
                                    {line}
                                </Text>
                            ))}
                        </View>
                    );
                })}
            </View>
        </Page>
    );
};

// Komponente ohne Hintergrundbild - vollständiges Design
const GesellenbriefStandard: React.FC<GesellenbriefDocumentProps> = ({ student, innung, date }) => (
    <Page size="A4" style={styles.page}>
        <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                {innung?.logo && (
                    <View style={styles.logoContainer}>
                        <Image src={innung.logo} style={styles.logo} />
                    </View>
                )}
                <Text style={styles.title}>GESELLENBRIEF</Text>
                <Text style={styles.subtitle}>im Friseurhandwerk</Text>

                {innung?.name && (
                    <>
                        <Text style={styles.innungName}>{innung.name}</Text>
                        {innung.street && <Text style={styles.innungAddress}>{innung.street}</Text>}
                        {innung.zipCity && <Text style={styles.innungAddress}>{innung.zipCity}</Text>}
                    </>
                )}
            </View>

            <View style={styles.decorativeLine} />

            {/* Main Content */}
            <View style={styles.mainContent}>
                <Text style={styles.certifyText}>
                    Hiermit wird bescheinigt, dass
                </Text>

                <View style={styles.nameContainer}>
                    {student.gender && (
                        <Text style={styles.gender}>{student.gender}</Text>
                    )}
                    <Text style={styles.name}>
                        {student.firstName} {student.lastName}
                    </Text>

                    <View style={styles.decorativeLineGold} />

                    <Text style={styles.salonLabel}>Ausbildungsbetrieb</Text>
                    <Text style={styles.salon}>{student.salon}</Text>
                </View>

                <Text style={styles.passedText}>
                    die Gesellenprüfung im Friseurhandwerk{'\n'}
                    <Text style={styles.passedHighlight}>erfolgreich bestanden</Text>{'\n'}
                    hat und somit berechtigt ist, den Gesellentitel zu führen.
                </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.dateLocation}>
                    {innung?.zipCity?.split(' ').pop() || 'Ort'}, den {formatDate(date)}
                </Text>

                <View style={styles.signatures}>
                    <View style={styles.signatureLine}>
                        <Text style={styles.signatureLabel}>Vorsitzender des</Text>
                        <Text style={styles.signatureLabel}>Prüfungsausschusses</Text>
                    </View>
                    <View style={styles.signatureLine}>
                        <Text style={styles.signatureLabel}>Obermeister/in</Text>
                        <Text style={styles.signatureLabel}>der Innung</Text>
                    </View>
                    <View style={styles.signatureLine}>
                        <Text style={styles.signatureLabel}>Geschäftsführer/in</Text>
                        <Text style={styles.signatureLabel}>der Innung</Text>
                    </View>
                </View>
            </View>
        </View>

        <Text style={styles.footerText}>Erstellt mit Gesellenprüfung Digital</Text>
    </Page>
);

// Haupt-Export Komponente
export const GesellenbriefDocument: React.FC<GesellenbriefDocumentProps> = (props) => {
    return (
        <Document>
            {props.backgroundImage ? (
                <GesellenbriefWithBackground {...props} positions={props.positions} />
            ) : (
                <GesellenbriefStandard {...props} />
            )}
        </Document>
    );
};

// Multi-Dokument für Seriendruck
interface GesellenbriefSeriendruckProps {
    students: Student[];
    innung?: Innung;
    backgroundImage?: string;
    date?: string;
    positions?: CertificatePositions;
    customTextFields?: CustomTextField[];
}

export const GesellenbriefSeriendruck: React.FC<GesellenbriefSeriendruckProps> = ({
    students,
    innung,
    backgroundImage,
    date,
    positions,
    customTextFields
}) => {
    return (
        <Document>
            {students.map((student) =>
                backgroundImage ? (
                    <GesellenbriefWithBackground
                        key={student.id}
                        student={student}
                        innung={innung}
                        backgroundImage={backgroundImage}
                        date={date}
                        positions={positions}
                        customTextFields={customTextFields}
                    />
                ) : (
                    <GesellenbriefStandard
                        key={student.id}
                        student={student}
                        innung={innung}
                        date={date}
                    />
                )
            )}
        </Document>
    );
};
