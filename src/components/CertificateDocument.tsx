import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Student } from '../lib/types';
import defaultBg from '../assets/gesellenbrief_bg.jpg';

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontFamily: 'Helvetica',
        textAlign: 'center',
    },
    background: {
        position: 'absolute',
        minWidth: '100%',
        minHeight: '100%',
        height: '100%',
        width: '100%',
    },
    content: {
        position: 'relative',
        height: '100%',
        width: '100%',
    },
    name: {
        position: 'absolute',
        top: 110, // Approx based on visual
        left: 0,
        right: 0,
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: 'Helvetica-BoldOblique',
        color: '#333'
    },
    salon: {
        position: 'absolute',
        top: 195,
        left: 150, // "bei..."
        right: 0,
        textAlign: 'left',
        fontSize: 14,
        fontStyle: 'italic',
        fontFamily: 'Helvetica-Oblique',
        width: 400
    },
    date: {
        position: 'absolute',
        bottom: 185, // "Braunschweig, den..."
        left: 280,
        fontSize: 12,
    },
    signatureLeft: {
        position: 'absolute',
        bottom: 100,
        left: 90,
        width: 150,
        textAlign: 'center',
        fontSize: 12,
        fontFamily: 'Helvetica-Oblique'
    },
    signatureRight: {
        position: 'absolute',
        bottom: 100,
        right: 90,
        width: 150,
        textAlign: 'center',
        fontSize: 12,
        fontFamily: 'Helvetica-Oblique'
    }
});

const formatDate = (dateStr: string) => {
    try {
        return new Date(dateStr).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

export const CertificateDocument: React.FC<{ student: Student, backgroundImage?: string }> = ({ student, backgroundImage }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Background Image */}
            <Image src={backgroundImage || defaultBg} style={styles.background} />

            {/* Overlay Text */}
            <View style={styles.content}>

                {/* Name */}
                <Text style={styles.name}>
                    {student.firstName} {student.lastName}
                </Text>

                {/* Salon */}
                <Text style={styles.salon}>
                    {student.company || student.salon}
                </Text>

                {/* Date */}
                <Text style={styles.date}>
                    {formatDate(new Date().toISOString())}
                </Text>

                {/* Signatures Placeholder (if digital signature needed later) */}
                {/* 
          <Text style={styles.signatureLeft}>
             Unterschrift 1
          </Text>
          <Text style={styles.signatureRight}>
             Unterschrift 2
          </Text>
           */}

            </View>
        </Page>
    </Document>
);
