export type Gender = 'Frau' | 'Herr' | 'Divers';

export type Wahlqualifikation = 'Kosmetik' | 'Langhaarfrisuren' | 'Nageldesign/-modelage' | 'Haarersatz' | 'Coloration';

// Innung (Guild) configuration
export type Innung = {
    name: string;
    street: string;
    zipCity: string;
    phone?: string;
    email?: string;
    logo?: string; // Base64-encoded logo image
};

// Notenschlüssel (Grade scale) - defines the point thresholds for each grade
export type GradeScale = {
    sehrGut: { min: number; max: number };      // Note 1: sehr gut
    gut: { min: number; max: number };          // Note 2: gut
    befriedigend: { min: number; max: number }; // Note 3: befriedigend
    ausreichend: { min: number; max: number };  // Note 4: ausreichend
    mangelhaft: { min: number; max: number };   // Note 5: mangelhaft
    ungenuegend: { min: number; max: number };  // Note 6: ungenügend
};

export const DEFAULT_GRADE_SCALE: GradeScale = {
    sehrGut: { min: 92, max: 100 },
    gut: { min: 81, max: 91 },
    befriedigend: { min: 67, max: 80 },
    ausreichend: { min: 50, max: 66 },
    mangelhaft: { min: 30, max: 49 },
    ungenuegend: { min: 0, max: 29 }
};

export const DEFAULT_INNUNG: Innung = {
    name: '',
    street: '',
    zipCity: '',
    phone: '',
    email: ''
};

// Prüfer (Examiner) im Prüferpool
export type Pruefer = {
    id: string;
    name: string;
    rolle?: 'Vorsitzender' | 'Prüfer' | 'Beisitzer';
    isActive: boolean; // Aktiv = kann für Prüfungen ausgewählt werden
};

export type Student = {
    id: string;
    firstName: string;
    lastName: string;
    examNumber: string;
    gender?: Gender;

    // Salon/Betrieb
    salon: string;
    salonStreet?: string;
    salonZipCity?: string;
    salonPhone?: string;
    company: string;
    instructor: string;

    // Private Adresse
    street?: string;
    houseNumber?: string;
    zip?: string;
    city?: string;

    // Geburt
    dob?: string;
    birthPlace?: string;
    birthCountry?: string;

    // Contact
    email?: string;
    mobile?: string;

    // Ausbildung
    trainingStart?: string;
    trainingEnd?: string;

    // Prüfung
    examDatePart1?: string;
    examDatePart2?: string;
    wahlqualifikation?: Wahlqualifikation;

    // Status
    isActive: boolean; // true = nimmt an Prüfung teil, false = pausiert/nicht teilnehmend

    createdAt: string;
};

export type GradingTask = {
    id: string;
    name: string;
    maxPoints: number;
    weight: number; // Faktor für gewichtete Punkte
};

export type TheorySubject = {
    id: string;
    name: string;
    maxPoints: number;
    writtenWeight: number; // Faktor schriftlich (meist 2)
    oralWeight: number;    // Faktor mündlich (meist 1)
};

export type GradingSheet = {
    id: string;
    name: string;
    part: 1 | 2;
    tasks: GradingTask[];           // Arbeitsaufgaben
    examPiece?: GradingTask;        // Prüfungsstück
    theorySubjects?: TheorySubject[]; // Nur Teil 2
    workTaskWeight: number;         // Gewichtung Arbeitsaufgaben (0.7)
    examPieceWeight: number;        // Gewichtung Prüfungsstück (0.3)
};

export type ExaminerGrade = {
    id: string;
    name: string;
    scores: Record<string, number>; // taskId -> Punkte (0-100)
};

export type TheoryScore = {
    subjectId: string;
    writtenPoints: number;  // 0-100
    oralPoints: number;     // 0-100
};

export type Grade = {
    studentId: string;
    sheetId: string;
    examiners: ExaminerGrade[];
    examPieceExaminers?: ExaminerGrade[]; // Prüfungsstück-Bewertung
    theoryScores?: TheoryScore[];         // Nur Teil 2
    date: string;
};

export type AppData = {
    students: Student[];
    sheets: GradingSheet[];
    grades: Grade[];
    certificateBackgroundImage?: string;
    examinerCount: number; // Anzahl der Prüfer (Standard: 3)
    innung?: Innung; // Innung (Guild) configuration
    gradeScale?: GradeScale; // Configurable grade scale (Notenschlüssel)
    _dataVersion?: number; // Interne Versionsnummer für Migrationen
};

// Jahrgang (Cohort) - Ein vollständiger Prüfungsjahrgang
export type Jahrgang = {
    id: string;
    name: string; // z.B. "Sommer 2024", "Winter 2024/25"
    description?: string; // Optionale Beschreibung
    createdAt: string;
    updatedAt: string;
    data: AppData; // Die eigentlichen Prüfungsdaten
    // NEU: Globale Prüferzuweisung für diesen Jahrgang
    globalExaminers?: GlobalExaminerAssignment;
};

// Positionierung für Gesellenbrief-Textfelder (in mm von oben-links)
export type CertificateFieldPosition = {
    x: number;      // Position von links in mm
    y: number;      // Position von oben in mm
    fontSize: number; // Schriftgröße in pt
    align: 'left' | 'center' | 'right';
    color: string;  // Hex-Farbe z.B. "#000000"
};

export type CertificatePositions = {
    name: CertificateFieldPosition;
    salon: CertificateFieldPosition;
    date: CertificateFieldPosition;
};

export const DEFAULT_CERTIFICATE_POSITIONS: CertificatePositions = {
    name: { x: 105, y: 100, fontSize: 24, align: 'center', color: '#1a1a1a' },
    salon: { x: 105, y: 120, fontSize: 14, align: 'center', color: '#333333' },
    date: { x: 170, y: 250, fontSize: 11, align: 'right', color: '#333333' },
};

// Individuelles Textfeld für den Gesellenbrief
export type CustomTextField = {
    id: string;
    text: string;           // Der anzuzeigende Text
    x: number;              // Position von links in mm
    y: number;              // Position von oben in mm
    fontSize: number;       // Schriftgröße in pt
    align: 'left' | 'center' | 'right';
    color: string;          // Hex-Farbe z.B. "#000000"
    bold: boolean;          // Fettschrift
    italic: boolean;        // Kursiv
    enabled: boolean;       // Ob das Feld angezeigt wird
};

// Standard 5 Textfelder (alle leer und deaktiviert)
export const DEFAULT_CUSTOM_TEXT_FIELDS: CustomTextField[] = [
    { id: 'custom1', text: '', x: 105, y: 30, fontSize: 18, align: 'center', color: '#1a1a1a', bold: true, italic: false, enabled: false },
    { id: 'custom2', text: '', x: 105, y: 50, fontSize: 14, align: 'center', color: '#333333', bold: false, italic: false, enabled: false },
    { id: 'custom3', text: '', x: 105, y: 70, fontSize: 12, align: 'center', color: '#333333', bold: false, italic: false, enabled: false },
    { id: 'custom4', text: '', x: 105, y: 200, fontSize: 12, align: 'center', color: '#333333', bold: false, italic: false, enabled: false },
    { id: 'custom5', text: '', x: 105, y: 220, fontSize: 10, align: 'center', color: '#666666', bold: false, italic: false, enabled: false },
    { id: 'custom6', text: '', x: 105, y: 240, fontSize: 10, align: 'center', color: '#666666', bold: false, italic: false, enabled: false },
    { id: 'custom7', text: '', x: 105, y: 260, fontSize: 10, align: 'center', color: '#666666', bold: false, italic: false, enabled: false },
];

// Globale App-Einstellungen (jahrgangsübergreifend)
export type GlobalSettings = {
    currentJahrgangId: string | null;
    jahrgaenge: Jahrgang[];
    // Globale Einstellungen die für alle Jahrgänge gelten
    innung?: Innung;
    gradeScale?: GradeScale;
    certificateBackgroundImage?: string;
    certificatePositions?: CertificatePositions; // Positionen der Textfelder auf dem Gesellenbrief
    customTextFields?: CustomTextField[]; // Individuelle Textfelder für den Gesellenbrief
    // Prüferpool - zentrale Verwaltung aller Prüfer
    prueferpool?: Pruefer[];
    // Passwort-Schutz für destruktive Aktionen (Hash des Admin-Passworts)
    adminPasswordHash?: string;
    // NEU: Mitarbeiter-Passwort (eingeschränkter Zugriff)
    mitarbeiterPasswordHash?: string;
    // NEU: Flag ob Ersteinrichtung abgeschlossen
    isFirstTimeSetupComplete?: boolean;
    _globalVersion?: number;
};

// Master-Admin-Passwort (nur für Entwickler/Support)
export const MASTER_ADMIN_PASSWORD = 'FriseurInnung2024!';

// ============================================
// AUTHENTICATION & AUTHORIZATION SYSTEM
// ============================================

// Benutzerrollen
export type UserRole = 'admin' | 'mitarbeiter';

// Sitzungsinformationen
export type AuthSession = {
    isAuthenticated: boolean;
    role: UserRole | null;
    loginTime: string | null;
    lastActivity: string | null; // Für Inaktivitäts-Timeout
};

// Session Storage Key
export const SESSION_STORAGE_KEY = 'hair_grading_app_session';

// Timeout in Millisekunden (30 Minuten)
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
// Warnung vor Timeout (5 Minuten)
export const SESSION_WARNING_MS = 5 * 60 * 1000;

// Organisations-Informationen für Willkommensseite
export const ORGANIZATION_INFO = {
    title: 'Das Prüfungstool zur Abnahme der Gesellenprüfung Teil 1 und Teil 2',
    subtitle: 'Das Tool des Landesinnungsverbandes des niedersächsischen Friseurhandwerks',
    name: 'Landesinnungsverband des niedersächsischen Friseurhandwerks',
    street: 'Ricklinger Stadtweg 92',
    zipCity: '30459 Hannover',
    phone: '0511 / 42 72 31',
    fax: '0511 / 42 25 73',
    email: 'info@liv-friseure-nds.de',
    website: 'www.friseure-nds.de'
};

// Globale Prüferzuweisung pro Jahrgang
export type GlobalExaminerAssignment = {
    teil1: {
        examinerIds: string[];  // Referenzen zu Pruefer.id aus prueferpool
        date?: string;          // Prüfungsdatum für Teil 1
    };
    teil2: {
        examinerIds: string[];  // Referenzen zu Pruefer.id aus prueferpool
        date?: string;          // Prüfungsdatum für Teil 2
    };
};

// ============================================
// LICENSE SYSTEM
// ============================================

export type LicenseInfo = {
    key: string;
    activatedAt: string;
    expiresAt: string; // Ablaufdatum der Lizenz (aus dem Schlüssel extrahiert)
    isPermanent: boolean; // true wenn unbegrenzte Lizenz (9999)
    innungName?: string; // Optional: Für welche Innung die Lizenz gilt
};

// Prüft ob eine Lizenz noch gültig ist (nicht abgelaufen)
export function isLicenseValid(licenseInfo: LicenseInfo | null): boolean {
    if (!licenseInfo) return false;

    // Unbegrenzte Lizenzen sind immer gültig
    if (licenseInfo.isPermanent) return true;

    const now = new Date();
    const expiresAt = new Date(licenseInfo.expiresAt);

    return now < expiresAt;
}

// Berechnet die verbleibenden Tage bis zum Ablauf
export function getLicenseRemainingDays(licenseInfo: LicenseInfo | null): number {
    if (!licenseInfo) return 0;

    // Unbegrenzte Lizenzen haben "unendlich" Tage (wir geben 9999 zurück)
    if (licenseInfo.isPermanent) return 9999;

    const now = new Date();
    const expiresAt = new Date(licenseInfo.expiresAt);
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
}

// Extrahiert das Ablaufdatum aus dem Lizenzschlüssel (Format: GPDIG-YYMM-XXXXX-CHECKSUM)
export function extractExpiryFromKey(key: string): { expiresAt: string; isPermanent: boolean } {
    const parts = key.toUpperCase().split('-');
    if (parts.length !== 4) {
        return { expiresAt: new Date().toISOString(), isPermanent: false };
    }

    const datePart = parts[1]; // YYMM oder 9999

    // Unbegrenzte Lizenz
    if (datePart === '9999') {
        return { expiresAt: '', isPermanent: true };
    }

    // Datum dekodieren: YYMM -> Ende des Monats
    const yy = parseInt(datePart.slice(0, 2));
    const mm = parseInt(datePart.slice(2, 4));

    if (isNaN(yy) || isNaN(mm) || mm < 1 || mm > 12) {
        return { expiresAt: new Date().toISOString(), isPermanent: false };
    }

    const year = 2000 + yy;
    // Letzter Tag des Monats (durch Setzen auf Tag 0 des Folgemonats)
    const expiresAt = new Date(year, mm, 0, 23, 59, 59);

    return { expiresAt: expiresAt.toISOString(), isPermanent: false };
}

export const LICENSE_STORAGE_KEY = 'gp_digital_license';

// Lizenz-Präfix für Validierung
export const LICENSE_PREFIX = 'GPDIG';

// Lizenzschlüssel-Validierung
// Neues Format: GPDIG-YYMM-XXXXX-CHECKSUM (YYMM = Ablaufdatum, 9999 = unbegrenzt)
// Altes Format: GPDIG-XXXXX-XXXXX-XXXXX (wird noch unterstützt für Rückwärtskompatibilität)
export function validateLicenseKey(key: string): boolean {
    const upperKey = key.toUpperCase();

    // Neues Format prüfen: GPDIG-YYMM-XXXXX-XXXXX (4 Zeichen + 5 Zeichen + 5 Zeichen)
    const newPattern = /^GPDIG-[0-9]{4}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
    if (newPattern.test(upperKey)) {
        return validateNewFormat(upperKey);
    }

    // Altes Format prüfen: GPDIG-XXXXX-XXXXX-XXXXX (für Rückwärtskompatibilität)
    const oldPattern = /^GPDIG-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
    if (oldPattern.test(upperKey)) {
        return validateOldFormat(upperKey);
    }

    return false;
}

// Validierung für neues Format (mit Ablaufdatum)
function validateNewFormat(key: string): boolean {
    const parts = key.split('-');
    // parts[0] = "GPDIG" (Präfix)
    // parts[1] = YYMM (Ablaufdatum) oder 9999 (unbegrenzt)
    // parts[2] = Zufallsteil
    // parts[3] = Prüfsumme

    const datePart = parts[1];
    const randomPart = parts[2];
    const checksum = parts[3];

    // Prüfe Datum-Format (YYMM oder 9999)
    if (datePart !== '9999') {
        const mm = parseInt(datePart.slice(2, 4));
        if (mm < 1 || mm > 12) {
            return false;
        }
    }

    // Berechne erwartete Prüfsumme
    const expectedChecksum = calculateChecksum(datePart, randomPart);

    return checksum === expectedChecksum;
}

// Validierung für altes Format (Rückwärtskompatibilität)
function validateOldFormat(key: string): boolean {
    const parts = key.split('-');
    const part1 = parts[1];
    const part2 = parts[2];
    const checksum = parts[3];

    const expectedChecksum = calculateChecksum(part1, part2);
    return checksum === expectedChecksum;
}

// Prüft ob ein Schlüssel das neue Format hat (mit kodiertem Ablaufdatum)
export function isNewLicenseFormat(key: string): boolean {
    const newPattern = /^GPDIG-[0-9]{4}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
    return newPattern.test(key.toUpperCase());
}

// Prüfsumme berechnen (einfacher Algorithmus)
function calculateChecksum(part1: string, part2: string): string {
    const combined = part1 + part2;
    let sum = 0;

    for (let i = 0; i < combined.length; i++) {
        const charCode = combined.charCodeAt(i);
        sum += charCode * (i + 1);
    }

    // Konvertiere zu 5-stelligem alphanumerischem Code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Ohne I, O, 0, 1 (Verwechslungsgefahr)
    let result = '';

    for (let i = 0; i < 5; i++) {
        const index = (sum + i * 7) % chars.length;
        result += chars[index];
        sum = Math.floor(sum / chars.length) + sum;
    }

    return result;
}

// Gültige Lizenzschlüssel generieren (neues Format mit Ablaufdatum)
export function generateLicenseKey(expiryYYMM: string = '9999'): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    const generatePart = (): string => {
        let part = '';
        for (let i = 0; i < 5; i++) {
            part += chars[Math.floor(Math.random() * chars.length)];
        }
        return part;
    };

    const randomPart = generatePart();
    const checksum = calculateChecksum(expiryYYMM, randomPart);

    return `GPDIG-${expiryYYMM}-${randomPart}-${checksum}`;
}

export const INITIAL_DATA: AppData = {
    students: [],
    examinerCount: 3,
    innung: DEFAULT_INNUNG,
    gradeScale: DEFAULT_GRADE_SCALE,
    sheets: [
        {
            id: "part1",
            name: "Teil 1 der Gesellenprüfung",
            part: 1,
            workTaskWeight: 0.7,
            examPieceWeight: 0.3,
            tasks: [
                { id: "p1_t1", name: "Haar und Kopfhaut beurteilen, reinigen und pflegen", maxPoints: 100, weight: 0.05 },
                { id: "p1_t2", name: "Augenbrauen formen und färben", maxPoints: 100, weight: 0.05 },
                { id: "p1_t3", name: "Haare mit verschiedenen Techniken dauerwellen", maxPoints: 100, weight: 0.20 },
                { id: "p1_t4", name: "Haare mit klassischen Techniken schneiden", maxPoints: 100, weight: 0.40 },
                { id: "p1_t5", name: "Frisurengestaltung mit zwei verschiedenen Einlegetechniken", maxPoints: 100, weight: 0.10 },
                { id: "p1_t6", name: "Arbeitsschutz und Kundenbetreuung (Situativ)", maxPoints: 100, weight: 0.20 },
            ],
            examPiece: { id: "p1_ep", name: "Klassische Friseurarbeit am Herren", maxPoints: 100, weight: 0.30 }
        },
        {
            id: "part2",
            name: "Teil 2 der Gesellenprüfung",
            part: 2,
            workTaskWeight: 0.7,
            examPieceWeight: 0.3,
            tasks: [
                { id: "p2_t1", name: "Beratungsgespräch", maxPoints: 100, weight: 0.05 },
                { id: "p2_t2", name: "Modische Haarfarbe", maxPoints: 100, weight: 0.25 },
                { id: "p2_t3", name: "Modischer Damenhaarschnitt", maxPoints: 100, weight: 0.40 },
                { id: "p2_t4", name: "Modische Föhnfrisur mit verschiedenen Techniken", maxPoints: 100, weight: 0.05 },
                { id: "p2_t5", name: "Kosmetische Behandlung / Make-up", maxPoints: 100, weight: 0.05 },
                { id: "p2_t6", name: "Wahlqualifikation", maxPoints: 100, weight: 0.20 },
            ],
            examPiece: { id: "p2_ep", name: "Modische Friseurarbeit am Herren", maxPoints: 100, weight: 0.30 },
            theorySubjects: [
                { id: "th1", name: "Friseurtechniken", maxPoints: 100, writtenWeight: 2, oralWeight: 1 },
                { id: "th2", name: "Betriebsorganisation und Kundenmanagement", maxPoints: 100, writtenWeight: 2, oralWeight: 1 },
                { id: "th3", name: "Wirtschafts- und Sozialkunde", maxPoints: 100, writtenWeight: 2, oralWeight: 1 },
            ]
        }
    ],
    grades: []
};
