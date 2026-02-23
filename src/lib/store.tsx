import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
    AppData, INITIAL_DATA, Student, GradingSheet, Grade, Innung, GradeScale,
    DEFAULT_INNUNG, DEFAULT_GRADE_SCALE, Jahrgang, GlobalSettings, Pruefer,
    CertificatePositions, DEFAULT_CERTIFICATE_POSITIONS, UserRole, AuthSession,
    SESSION_STORAGE_KEY, SESSION_TIMEOUT_MS, SESSION_WARNING_MS, validateMasterPassword, LEGACY_MASTER_PASSWORD,
    GlobalExaminerAssignment, LICENSE_STORAGE_KEY, LicenseInfo, isLicenseValid,
    getLicenseRemainingDays, CustomTextField, DEFAULT_CUSTOM_TEXT_FIELDS
} from './types';
import { hashPassword } from '../components/PasswordDialog';

interface StoreContextType {
    data: AppData;
    addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'isActive'>) => void;
    addStudents: (students: Omit<Student, 'id' | 'createdAt' | 'isActive'>[]) => void;
    updateStudent: (id: string, updates: Partial<Student>) => void;
    updateStudents: (updates: { id: string; data: Partial<Student> }[]) => void;
    deleteStudent: (id: string) => void;
    deleteAllStudents: () => void;
    updateSheet: (sheet: GradingSheet) => void;
    saveGrade: (grade: Grade) => void;
    updateInnung: (innung: Innung) => void;
    updateGradeScale: (gradeScale: GradeScale) => void;
    resetData: () => void;
    importData: (data: AppData) => void;
    // Jahrgangs-Verwaltung
    jahrgaenge: Jahrgang[];
    currentJahrgangId: string | null;
    currentJahrgang: Jahrgang | null;
    createJahrgang: (name: string, description?: string) => string;
    switchJahrgang: (id: string) => void;
    updateJahrgang: (id: string, updates: Partial<Pick<Jahrgang, 'name' | 'description'>>) => void;
    deleteJahrgang: (id: string) => void;
    duplicateJahrgang: (id: string, newName: string) => string;
    moveStudentToJahrgang: (studentId: string, targetJahrgangId: string) => void;
    // Passwort-Verwaltung (Admin)
    adminPasswordHash: string | undefined;
    setAdminPassword: (passwordHash: string) => void;
    removeAdminPassword: () => void;
    // Passwort-Verwaltung (Mitarbeiter)
    mitarbeiterPasswordHash: string | undefined;
    setMitarbeiterPassword: (passwordHash: string) => void;
    removeMitarbeiterPassword: () => void;
    // Gesellenbrief-Hintergrundbild
    certificateBackgroundImage: string | undefined;
    setCertificateBackgroundImage: (image: string | undefined) => void;
    // Gesellenbrief-Positionen
    certificatePositions: CertificatePositions;
    setCertificatePositions: (positions: CertificatePositions) => void;
    // Individuelle Textfelder für Gesellenbrief
    customTextFields: CustomTextField[];
    setCustomTextFields: (fields: CustomTextField[]) => void;
    updateCustomTextField: (id: string, updates: Partial<CustomTextField>) => void;
    // Prüferpool-Verwaltung
    prueferpool: Pruefer[];
    addPruefer: (name: string, rolle?: Pruefer['rolle']) => string;
    updatePruefer: (id: string, updates: Partial<Pruefer>) => void;
    deletePruefer: (id: string) => void;
    // === AUTHENTICATION ===
    authSession: AuthSession;
    isFirstTimeSetup: boolean;
    login: (password: string) => Promise<{ success: boolean; role: UserRole | null; error?: string }>;
    logout: () => void;
    completeFirstTimeSetup: (adminPassword: string) => void;
    updateActivity: () => void;
    sessionTimeRemaining: number | null; // Millisekunden bis Timeout, null wenn nicht eingeloggt
    showTimeoutWarning: boolean;
    // === BERECHTIGUNGEN ===
    canDeleteData: () => boolean;
    canModifyStudents: () => boolean;
    canModifySettings: () => boolean;
    canManagePasswords: () => boolean;
    canEnterGrades: () => boolean;
    canPrintCertificates: () => boolean;
    canManageExaminers: () => boolean;
    // === GLOBALE PRÜFER ===
    setGlobalExaminers: (teil: 1 | 2, examinerIds: string[], date?: string) => void;
    getGlobalExaminers: (teil: 1 | 2) => { examinerIds: string[]; date?: string } | null;
    // === LIZENZ ===
    licenseInfo: LicenseInfo | null;
    isLicensed: boolean;
    licenseRemainingDays: number; // Verbleibende Tage bis Ablauf
    activateLicense: (licenseInfo: LicenseInfo) => void;
    // Globale Einstellungen (für FeedbackDialog etc.)
    globalSettings: GlobalSettings;
}

const StoreContext = createContext<StoreContextType | null>(null);

// Version für Datenbank-Migrationen (erhöhen bei Strukturänderungen)
const DATA_VERSION = 4;
const GLOBAL_VERSION = 1;

// LocalStorage Keys
const GLOBAL_SETTINGS_KEY = 'hair_grading_app_global';
const LEGACY_DATA_KEY = 'hair_grading_app_data';

// Erstelle initiale GlobalSettings
const createInitialGlobalSettings = (): GlobalSettings => {
    const initialJahrgang: Jahrgang = {
        id: crypto.randomUUID(),
        name: `Jahrgang ${new Date().getFullYear()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: { ...INITIAL_DATA, _dataVersion: DATA_VERSION }
    };

    return {
        currentJahrgangId: initialJahrgang.id,
        jahrgaenge: [initialJahrgang],
        innung: DEFAULT_INNUNG,
        gradeScale: DEFAULT_GRADE_SCALE,
        _globalVersion: GLOBAL_VERSION
    };
};

// Migration von alter Single-Jahrgang Struktur zu neuer Multi-Jahrgang Struktur
const migrateToMultiJahrgang = (): GlobalSettings => {
    try {
        const legacyData = localStorage.getItem(LEGACY_DATA_KEY);

        if (legacyData) {
            // Alte Daten vorhanden -> migrieren
            const parsed = JSON.parse(legacyData);
            const migratedData = migrateAppData(parsed);

            const defaultJahrgang: Jahrgang = {
                id: crypto.randomUUID(),
                name: 'Jahrgang (migriert)',
                description: 'Automatisch aus bestehenden Daten erstellt',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                data: migratedData
            };

            const globalSettings: GlobalSettings = {
                currentJahrgangId: defaultJahrgang.id,
                jahrgaenge: [defaultJahrgang],
                innung: migratedData.innung || DEFAULT_INNUNG,
                gradeScale: migratedData.gradeScale || DEFAULT_GRADE_SCALE,
                certificateBackgroundImage: migratedData.certificateBackgroundImage,
                _globalVersion: GLOBAL_VERSION
            };

            return globalSettings;
        }
    } catch (error) {
        console.error('Fehler bei Migration:', error);
    }

    // Keine Daten oder Fehler -> neue Struktur mit leerem Jahrgang
    return createInitialGlobalSettings();
};

// Migriere einzelne AppData (alte Logik)
const migrateAppData = (parsed: any): AppData => {
    const savedVersion = parsed._dataVersion || 1;

    if (savedVersion < 2) {
        parsed = {
            ...parsed,
            sheets: INITIAL_DATA.sheets,
            innung: DEFAULT_INNUNG,
            gradeScale: DEFAULT_GRADE_SCALE,
            _dataVersion: DATA_VERSION
        };
    }

    if (savedVersion < 3) {
        parsed = {
            ...parsed,
            innung: parsed.innung || DEFAULT_INNUNG,
            gradeScale: parsed.gradeScale || DEFAULT_GRADE_SCALE,
            students: parsed.students.map((s: any) => ({ ...s, isActive: s.isActive ?? true })),
            _dataVersion: DATA_VERSION
        };
    }

    if (savedVersion < 4) {
        parsed = {
            ...parsed,
            students: parsed.students.map((s: any) => ({ ...s, isActive: s.isActive ?? true })),
            _dataVersion: DATA_VERSION
        };
    }

    return { ...parsed, _dataVersion: DATA_VERSION };
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Lizenz-Status
    const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(() => {
        try {
            const saved = localStorage.getItem(LICENSE_STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch {
            // Ignoriere Fehler
        }
        return null;
    });

    // Lizenz ist nur gültig wenn vorhanden UND nicht abgelaufen
    const isLicensed = isLicenseValid(licenseInfo);
    const licenseRemainingDays = getLicenseRemainingDays(licenseInfo);

    // Lizenz aktivieren (speichert in localStorage UND aktualisiert State)
    const activateLicense = (newLicenseInfo: LicenseInfo) => {
        localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(newLicenseInfo));
        setLicenseInfo(newLicenseInfo);
    };

    // Globale Einstellungen mit allen Jahrgängen
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(() => {
        try {
            const saved = localStorage.getItem(GLOBAL_SETTINGS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validiere dass die Daten gültig sind
                if (parsed && parsed.jahrgaenge && Array.isArray(parsed.jahrgaenge) && parsed.jahrgaenge.length > 0) {
                    // Stelle sicher dass currentJahrgangId gültig ist
                    const validJahrgangId = parsed.jahrgaenge.some((j: Jahrgang) => j.id === parsed.currentJahrgangId);
                    if (!validJahrgangId) {
                        parsed.currentJahrgangId = parsed.jahrgaenge[0].id;
                    }
                    // Merge mit Defaults um fehlende Felder zu ergänzen
                    const defaults = createInitialGlobalSettings();
                    return {
                        ...defaults,
                        ...parsed,
                        // Stelle sicher dass innung und gradeScale erhalten bleiben
                        innung: parsed.innung || defaults.innung,
                        gradeScale: parsed.gradeScale || defaults.gradeScale,
                        // Behalte andere wichtige Felder
                        prueferpool: parsed.prueferpool || defaults.prueferpool,
                        customTextFields: parsed.customTextFields || defaults.customTextFields,
                        certificatePositions: parsed.certificatePositions || defaults.certificatePositions,
                        certificateBackgroundImage: parsed.certificateBackgroundImage,
                    };
                }
            }
            // Migration von alter Struktur oder neu anlegen
            return migrateToMultiJahrgang();
        } catch (error) {
            console.error('Fehler beim Laden der Daten:', error);
            return createInitialGlobalSettings();
        }
    });

    // Aktueller Jahrgang
    const currentJahrgang = globalSettings.jahrgaenge.find(j => j.id === globalSettings.currentJahrgangId) || globalSettings.jahrgaenge[0] || null;

    // Aktuelle Daten (aus aktuellem Jahrgang, mit globalen Einstellungen überschrieben)
    const data: AppData = currentJahrgang && currentJahrgang.data ? {
        ...currentJahrgang.data,
        students: currentJahrgang.data.students || [],
        sheets: currentJahrgang.data.sheets || INITIAL_DATA.sheets,
        grades: currentJahrgang.data.grades || [],
        innung: globalSettings.innung || DEFAULT_INNUNG,
        gradeScale: globalSettings.gradeScale || DEFAULT_GRADE_SCALE,
        certificateBackgroundImage: globalSettings.certificateBackgroundImage,
        examinerCount: currentJahrgang.data.examinerCount || 3
    } : { ...INITIAL_DATA, _dataVersion: DATA_VERSION };

    // Speichern bei Änderungen
    useEffect(() => {
        try {
            localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(globalSettings));
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
        }
    }, [globalSettings]);

    // Hilfsfunktion: Aktuellen Jahrgang aktualisieren
    const updateCurrentJahrgangData = (updater: (prev: AppData) => AppData) => {
        if (!currentJahrgang) return;

        setGlobalSettings(prev => ({
            ...prev,
            jahrgaenge: prev.jahrgaenge.map(j =>
                j.id === prev.currentJahrgangId
                    ? { ...j, data: updater(j.data), updatedAt: new Date().toISOString() }
                    : j
            )
        }));
    };

    // === Student Management ===
    const addStudent = (student: Omit<Student, 'id' | 'createdAt' | 'isActive'>) => {
        const newStudent: Student = {
            ...student,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            isActive: true,
        };
        updateCurrentJahrgangData(prev => ({ ...prev, students: [...prev.students, newStudent] }));
    };

    const addStudents = (students: Omit<Student, 'id' | 'createdAt' | 'isActive'>[]) => {
        const newStudents = students.map(s => ({
            ...s,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            isActive: true,
        }));
        updateCurrentJahrgangData(prev => ({ ...prev, students: [...prev.students, ...newStudents] }));
    };

    const updateStudent = (id: string, updates: Partial<Student>) => {
        updateCurrentJahrgangData(prev => ({
            ...prev,
            students: prev.students.map(s => s.id === id ? { ...s, ...updates } : s)
        }));
    };

    const updateStudents = (updates: { id: string; data: Partial<Student> }[]) => {
        updateCurrentJahrgangData(prev => ({
            ...prev,
            students: prev.students.map(s => {
                const update = updates.find(u => u.id === s.id);
                return update ? { ...s, ...update.data } : s;
            })
        }));
    };

    const deleteStudent = (id: string) => {
        // Passwort-Prüfung muss extern erfolgen!
        updateCurrentJahrgangData(prev => ({
            ...prev,
            students: prev.students.filter(s => s.id !== id),
            grades: prev.grades.filter(g => g.studentId !== id)
        }));
    };

    const deleteAllStudents = () => {
        // Passwort-Prüfung muss extern erfolgen!
        updateCurrentJahrgangData(prev => ({
            ...prev,
            students: [],
            grades: []
        }));
    };

    // === Sheet & Grade Management ===
    const updateSheet = (sheet: GradingSheet) => {
        updateCurrentJahrgangData(prev => ({
            ...prev,
            sheets: prev.sheets.map(s => s.id === sheet.id ? sheet : s)
        }));
    };

    const saveGrade = (grade: Grade) => {
        updateCurrentJahrgangData(prev => {
            const filtered = prev.grades.filter(g => !(g.studentId === grade.studentId && g.sheetId === grade.sheetId));
            return { ...prev, grades: [...filtered, grade] };
        });
    };

    // === Global Settings (shared across Jahrgänge) ===
    const updateInnung = (innung: Innung) => {
        setGlobalSettings(prev => ({ ...prev, innung }));
    };

    const updateGradeScale = (gradeScale: GradeScale) => {
        setGlobalSettings(prev => ({ ...prev, gradeScale }));
    };

    const resetData = () => {
        // Passwort-Prüfung muss extern erfolgen!
        updateCurrentJahrgangData(() => ({ ...INITIAL_DATA, _dataVersion: DATA_VERSION }));
    };

    const importData = (newData: AppData & { certificatePositions?: CertificatePositions; customTextFields?: CustomTextField[] }) => {
        // WICHTIG: Daten SYNCHRON in localStorage speichern, BEVOR der State aktualisiert wird
        // Dies verhindert Race Conditions wenn direkt nach dem Import window.location.reload() aufgerufen wird
        setGlobalSettings(prev => {
            // Extrahiere Gesellenbrief-Einstellungen aus den importierten Daten
            const { certificatePositions: importedPositions, customTextFields: importedFields, ...appData } = newData;

            // Jahrgangs-Daten importieren (ohne die Gesellenbrief-Felder, die gehören in GlobalSettings)
            const updatedJahrgaenge = prev.jahrgaenge.map(j =>
                j.id === prev.currentJahrgangId
                    ? { ...j, data: appData as AppData, updatedAt: new Date().toISOString() }
                    : j
            );

            // Globale Einstellungen (Innung, Notenschlüssel, Hintergrundbild, Gesellenbrief-Positionen) übernehmen
            const newGlobalSettings = {
                ...prev,
                jahrgaenge: updatedJahrgaenge,
                innung: newData.innung || prev.innung,
                gradeScale: newData.gradeScale || prev.gradeScale,
                certificateBackgroundImage: newData.certificateBackgroundImage ?? prev.certificateBackgroundImage,
                // Gesellenbrief-Positionen und individuelle Textfelder übernehmen
                certificatePositions: importedPositions ?? prev.certificatePositions,
                customTextFields: importedFields ?? prev.customTextFields
            };

            // SYNCHRON in localStorage speichern - kritisch für Reload nach Import!
            try {
                localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(newGlobalSettings));
            } catch (error) {
                console.error('Fehler beim synchronen Speichern nach Import:', error);
            }

            return newGlobalSettings;
        });
    };

    // === Jahrgangs-Verwaltung ===
    const createJahrgang = (name: string, description?: string): string => {
        const newJahrgang: Jahrgang = {
            id: crypto.randomUUID(),
            name,
            description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: { ...INITIAL_DATA, _dataVersion: DATA_VERSION }
        };

        setGlobalSettings(prev => ({
            ...prev,
            jahrgaenge: [...prev.jahrgaenge, newJahrgang],
            currentJahrgangId: newJahrgang.id // Automatisch zum neuen wechseln
        }));

        return newJahrgang.id;
    };

    const switchJahrgang = (id: string) => {
        const exists = globalSettings.jahrgaenge.some(j => j.id === id);
        if (exists) {
            setGlobalSettings(prev => ({ ...prev, currentJahrgangId: id }));
        }
    };

    const updateJahrgang = (id: string, updates: Partial<Pick<Jahrgang, 'name' | 'description'>>) => {
        setGlobalSettings(prev => ({
            ...prev,
            jahrgaenge: prev.jahrgaenge.map(j =>
                j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j
            )
        }));
    };

    const deleteJahrgang = (id: string) => {
        // Passwort-Prüfung muss extern erfolgen!
        if (globalSettings.jahrgaenge.length <= 1) {
            alert("Der letzte Jahrgang kann nicht gelöscht werden.");
            return;
        }

        setGlobalSettings(prev => {
            const newJahrgaenge = prev.jahrgaenge.filter(j => j.id !== id);
            const needsSwitch = prev.currentJahrgangId === id;
            return {
                ...prev,
                jahrgaenge: newJahrgaenge,
                currentJahrgangId: needsSwitch ? newJahrgaenge[0].id : prev.currentJahrgangId
            };
        });
    };

    const duplicateJahrgang = (id: string, newName: string): string => {
        const source = globalSettings.jahrgaenge.find(j => j.id === id);
        if (!source) return '';

        const newJahrgang: Jahrgang = {
            id: crypto.randomUUID(),
            name: newName,
            description: `Kopie von "${source.name}"`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: JSON.parse(JSON.stringify(source.data)) // Deep copy
        };

        setGlobalSettings(prev => ({
            ...prev,
            jahrgaenge: [...prev.jahrgaenge, newJahrgang]
        }));

        return newJahrgang.id;
    };

    // === Prüfling in anderen Jahrgang verschieben ===
    const moveStudentToJahrgang = (studentId: string, targetJahrgangId: string) => {
        setGlobalSettings(prev => {
            const sourceJahrgang = prev.jahrgaenge.find(j => j.id === prev.currentJahrgangId);
            const targetJahrgang = prev.jahrgaenge.find(j => j.id === targetJahrgangId);
            if (!sourceJahrgang || !targetJahrgang) return prev;

            const student = sourceJahrgang.data.students.find(s => s.id === studentId);
            if (!student) return prev;

            // Alle Noten dieses Prüflings mitnehmen
            const studentGrades = sourceJahrgang.data.grades.filter(g => g.studentId === studentId);

            return {
                ...prev,
                jahrgaenge: prev.jahrgaenge.map(j => {
                    if (j.id === prev.currentJahrgangId) {
                        // Aus Quell-Jahrgang entfernen
                        return {
                            ...j,
                            data: {
                                ...j.data,
                                students: j.data.students.filter(s => s.id !== studentId),
                                grades: j.data.grades.filter(g => g.studentId !== studentId)
                            },
                            updatedAt: new Date().toISOString()
                        };
                    }
                    if (j.id === targetJahrgangId) {
                        // Zum Ziel-Jahrgang hinzufügen
                        return {
                            ...j,
                            data: {
                                ...j.data,
                                students: [...j.data.students, student],
                                grades: [...j.data.grades, ...studentGrades]
                            },
                            updatedAt: new Date().toISOString()
                        };
                    }
                    return j;
                })
            };
        });
    };

    // === Passwort-Verwaltung ===
    const setAdminPassword = (passwordHash: string) => {
        setGlobalSettings(prev => ({ ...prev, adminPasswordHash: passwordHash }));
    };

    const removeAdminPassword = () => {
        setGlobalSettings(prev => ({ ...prev, adminPasswordHash: undefined }));
    };

    // === Gesellenbrief-Hintergrundbild ===
    const setCertificateBackgroundImage = (image: string | undefined) => {
        setGlobalSettings(prev => ({ ...prev, certificateBackgroundImage: image }));
    };

    // === Gesellenbrief-Positionen ===
    const setCertificatePositions = (positions: CertificatePositions) => {
        setGlobalSettings(prev => ({ ...prev, certificatePositions: positions }));
    };

    // === Individuelle Textfelder für Gesellenbrief ===
    // Merge existing custom text fields with defaults to ensure all 7 fields exist
    const customTextFields = (() => {
        const stored = globalSettings.customTextFields;
        if (!stored) return DEFAULT_CUSTOM_TEXT_FIELDS;

        // Merge: Keep stored values but add any missing fields from defaults
        const merged = DEFAULT_CUSTOM_TEXT_FIELDS.map(defaultField => {
            const existingField = stored.find(f => f.id === defaultField.id);
            return existingField || defaultField;
        });
        return merged;
    })();

    const setCustomTextFields = (fields: CustomTextField[]) => {
        setGlobalSettings(prev => ({ ...prev, customTextFields: fields }));
    };

    const updateCustomTextField = (id: string, updates: Partial<CustomTextField>) => {
        setGlobalSettings(prev => {
            // Merge stored fields with defaults first to ensure all 7 fields exist
            const stored = prev.customTextFields;
            const baseFields = stored
                ? DEFAULT_CUSTOM_TEXT_FIELDS.map(defaultField => {
                    const existingField = stored.find(f => f.id === defaultField.id);
                    return existingField || defaultField;
                })
                : DEFAULT_CUSTOM_TEXT_FIELDS;

            return {
                ...prev,
                customTextFields: baseFields.map(f =>
                    f.id === id ? { ...f, ...updates } : f
                )
            };
        });
    };

    // === Prüferpool-Verwaltung ===
    const prueferpool = globalSettings.prueferpool || [];

    const addPruefer = (name: string, rolle?: Pruefer['rolle']): string => {
        const newPruefer: Pruefer = {
            id: crypto.randomUUID(),
            name,
            rolle,
            isActive: true
        };
        setGlobalSettings(prev => ({
            ...prev,
            prueferpool: [...(prev.prueferpool || []), newPruefer]
        }));
        return newPruefer.id;
    };

    const updatePruefer = (id: string, updates: Partial<Pruefer>) => {
        setGlobalSettings(prev => ({
            ...prev,
            prueferpool: (prev.prueferpool || []).map(p =>
                p.id === id ? { ...p, ...updates } : p
            )
        }));
    };

    const deletePruefer = (id: string) => {
        setGlobalSettings(prev => ({
            ...prev,
            prueferpool: (prev.prueferpool || []).filter(p => p.id !== id)
        }));
    };

    // === MITARBEITER PASSWORT ===
    const setMitarbeiterPassword = (passwordHash: string) => {
        setGlobalSettings(prev => ({ ...prev, mitarbeiterPasswordHash: passwordHash }));
    };

    const removeMitarbeiterPassword = () => {
        setGlobalSettings(prev => ({ ...prev, mitarbeiterPasswordHash: undefined }));
    };

    // === AUTHENTICATION STATE ===
    const [authSession, setAuthSession] = useState<AuthSession>(() => {
        try {
            const saved = localStorage.getItem(SESSION_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Prüfe ob Session noch gültig ist (nicht abgelaufen)
                if (parsed.lastActivity) {
                    const elapsed = Date.now() - new Date(parsed.lastActivity).getTime();
                    if (elapsed < SESSION_TIMEOUT_MS) {
                        return {
                            ...parsed,
                            lastActivity: new Date().toISOString() // Aktualisiere bei Laden
                        };
                    }
                }
            }
        } catch (error) {
            console.error('Session laden fehlgeschlagen:', error);
        }
        return {
            isAuthenticated: false,
            role: null,
            loginTime: null,
            lastActivity: null
        };
    });

    const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);
    const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
    const timeoutCheckRef = useRef<NodeJS.Timeout | null>(null);

    // Session in localStorage speichern
    useEffect(() => {
        if (authSession.isAuthenticated) {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authSession));
        } else {
            localStorage.removeItem(SESSION_STORAGE_KEY);
        }
    }, [authSession]);

    // Timeout-Überwachung
    useEffect(() => {
        if (!authSession.isAuthenticated || !authSession.lastActivity) {
            setSessionTimeRemaining(null);
            setShowTimeoutWarning(false);
            return;
        }

        const checkTimeout = () => {
            const lastActivity = new Date(authSession.lastActivity!).getTime();
            const elapsed = Date.now() - lastActivity;
            const remaining = SESSION_TIMEOUT_MS - elapsed;

            if (remaining <= 0) {
                // Timeout erreicht - ausloggen
                logout();
            } else {
                const isWarningPhase = remaining <= SESSION_WARNING_MS;
                // Nur State aktualisieren wenn nötig (Warnung aktiv oder State veraltet)
                setShowTimeoutWarning(prev => {
                    if (prev !== isWarningPhase) return isWarningPhase;
                    return prev;
                });
                // sessionTimeRemaining nur aktualisieren wenn Warnung aktiv ist
                if (isWarningPhase) {
                    setSessionTimeRemaining(remaining);
                }
            }
        };

        checkTimeout();
        // Prüfung alle 5 Sekunden, Countdown nur bei Warnung
        timeoutCheckRef.current = setInterval(checkTimeout, 5000);

        return () => {
            if (timeoutCheckRef.current) {
                clearInterval(timeoutCheckRef.current);
            }
        };
    }, [authSession.isAuthenticated, authSession.lastActivity]);

    // Schneller Countdown nur während der Warnphase
    useEffect(() => {
        if (!showTimeoutWarning || !authSession.lastActivity) return;

        const updateCountdown = () => {
            const lastActivity = new Date(authSession.lastActivity!).getTime();
            const elapsed = Date.now() - lastActivity;
            const remaining = SESSION_TIMEOUT_MS - elapsed;
            setSessionTimeRemaining(remaining > 0 ? remaining : 0);
        };

        updateCountdown();
        const countdownInterval = setInterval(updateCountdown, 1000);

        return () => clearInterval(countdownInterval);
    }, [showTimeoutWarning, authSession.lastActivity]);

    // Aktivität tracken für Timeout-Reset
    // Ref um zu tracken wann zuletzt aktualisiert wurde (verhindert zu häufige Updates)
    const lastActivityUpdateRef = useRef<number>(0);
    const ACTIVITY_THROTTLE_MS = 10000; // Nur alle 10 Sekunden updaten

    const updateActivity = useCallback(() => {
        if (authSession.isAuthenticated) {
            const now = Date.now();
            // Nur updaten wenn mehr als 10 Sekunden seit letztem Update vergangen
            if (now - lastActivityUpdateRef.current > ACTIVITY_THROTTLE_MS) {
                lastActivityUpdateRef.current = now;
                setAuthSession(prev => ({
                    ...prev,
                    lastActivity: new Date().toISOString()
                }));
            }
        }
    }, [authSession.isAuthenticated]);

    // Globale Event-Listener für Aktivität
    useEffect(() => {
        if (!authSession.isAuthenticated) return;

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        const handleActivity = () => updateActivity();

        events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
        };
    }, [authSession.isAuthenticated, updateActivity]);

    // Ersteinrichtung prüfen
    // Ersteinrichtung ist nur nötig wenn:
    // 1. isFirstTimeSetupComplete noch nicht gesetzt ist UND
    // 2. Kein Admin-Passwort existiert UND
    // 3. Keine bestehenden Daten vorhanden sind (keine Prüflinge)
    const hasExistingData = globalSettings.jahrgaenge.some(j => j.data.students && j.data.students.length > 0);
    const isFirstTimeSetup = !globalSettings.isFirstTimeSetupComplete && !globalSettings.adminPasswordHash && !hasExistingData;

    // Login-Funktion (async wegen Electron IPC für Master-Passwort Einmal-Check)
    const login = async (password: string): Promise<{ success: boolean; role: UserRole | null; error?: string }> => {
        const now = new Date().toISOString();

        // Master-Passwort prüfen (generiertes Format GPDM-XXXXX-XXXXX oder Legacy)
        if (validateMasterPassword(password)) {
            // Einmal-Check: Wurde dieses Master-Passwort bereits verwendet?
            // (Legacy-Passwort ist unbegrenzt gültig)
            if (password !== LEGACY_MASTER_PASSWORD) {
                const pwHash = hashPassword(password);
                try {
                    if (window.electronAPI) {
                        const usedPasswords = await window.electronAPI.getUsedMasterPasswords();
                        if (usedPasswords.includes(pwHash)) {
                            return { success: false, role: null, error: 'Dieses Support-Passwort wurde bereits verwendet.' };
                        }
                        // Als verwendet markieren (persistent im App-Verzeichnis)
                        await window.electronAPI.saveUsedMasterPassword(pwHash);
                    } else {
                        // Fallback: localStorage (Browser/Entwicklung)
                        const usedJson = localStorage.getItem('gp_used_master_passwords') || '[]';
                        const used = JSON.parse(usedJson);
                        if (used.includes(pwHash)) {
                            return { success: false, role: null, error: 'Dieses Support-Passwort wurde bereits verwendet.' };
                        }
                        used.push(pwHash);
                        localStorage.setItem('gp_used_master_passwords', JSON.stringify(used));
                    }
                } catch (err) {
                    console.error('Master-Passwort Einmal-Check fehlgeschlagen:', err);
                }
            }

            setAuthSession({
                isAuthenticated: true,
                role: 'admin',
                loginTime: now,
                lastActivity: now
            });
            return { success: true, role: 'admin' };
        }

        // Admin-Passwort
        if (globalSettings.adminPasswordHash && hashPassword(password) === globalSettings.adminPasswordHash) {
            setAuthSession({
                isAuthenticated: true,
                role: 'admin',
                loginTime: now,
                lastActivity: now
            });
            return { success: true, role: 'admin' };
        }

        // Mitarbeiter-Passwort
        if (globalSettings.mitarbeiterPasswordHash && hashPassword(password) === globalSettings.mitarbeiterPasswordHash) {
            setAuthSession({
                isAuthenticated: true,
                role: 'mitarbeiter',
                loginTime: now,
                lastActivity: now
            });
            return { success: true, role: 'mitarbeiter' };
        }

        return { success: false, role: null };
    };

    // Logout-Funktion
    const logout = () => {
        setAuthSession({
            isAuthenticated: false,
            role: null,
            loginTime: null,
            lastActivity: null
        });
        setShowTimeoutWarning(false);
    };

    // Ersteinrichtung abschließen
    const completeFirstTimeSetup = (adminPassword: string) => {
        const now = new Date().toISOString();
        setGlobalSettings(prev => ({
            ...prev,
            adminPasswordHash: hashPassword(adminPassword),
            isFirstTimeSetupComplete: true
        }));
        setAuthSession({
            isAuthenticated: true,
            role: 'admin',
            loginTime: now,
            lastActivity: now
        });
    };

    // === BERECHTIGUNGEN ===
    const canDeleteData = () => authSession.role === 'admin';
    const canModifyStudents = () => authSession.role === 'admin';
    const canModifySettings = () => authSession.role === 'admin';
    const canManagePasswords = () => authSession.role === 'admin';
    const canEnterGrades = () => authSession.isAuthenticated; // Beide Rollen
    const canPrintCertificates = () => authSession.isAuthenticated; // Beide Rollen
    const canManageExaminers = () => authSession.role === 'admin';

    // === GLOBALE PRÜFER ===
    const setGlobalExaminers = (teil: 1 | 2, examinerIds: string[], date?: string) => {
        if (!globalSettings.currentJahrgangId) return;

        setGlobalSettings(prev => ({
            ...prev,
            jahrgaenge: prev.jahrgaenge.map(j => {
                if (j.id !== prev.currentJahrgangId) return j;

                const existingGlobalExaminers = j.globalExaminers || {
                    teil1: { examinerIds: [] },
                    teil2: { examinerIds: [] }
                };

                return {
                    ...j,
                    globalExaminers: {
                        ...existingGlobalExaminers,
                        [`teil${teil}`]: { examinerIds, date }
                    } as GlobalExaminerAssignment,
                    updatedAt: new Date().toISOString()
                };
            })
        }));
    };

    const getGlobalExaminers = (teil: 1 | 2): { examinerIds: string[]; date?: string } | null => {
        if (!currentJahrgang?.globalExaminers) return null;
        return teil === 1
            ? currentJahrgang.globalExaminers.teil1
            : currentJahrgang.globalExaminers.teil2;
    };

    return (
        <StoreContext.Provider value={{
            data,
            addStudent,
            addStudents,
            updateStudent,
            updateStudents,
            deleteStudent,
            deleteAllStudents,
            updateSheet,
            saveGrade,
            updateInnung,
            updateGradeScale,
            resetData,
            importData,
            // Jahrgangs-Verwaltung
            jahrgaenge: globalSettings.jahrgaenge,
            currentJahrgangId: globalSettings.currentJahrgangId,
            currentJahrgang,
            createJahrgang,
            switchJahrgang,
            updateJahrgang,
            deleteJahrgang,
            duplicateJahrgang,
            moveStudentToJahrgang,
            // Passwort-Verwaltung (Admin)
            adminPasswordHash: globalSettings.adminPasswordHash,
            setAdminPassword,
            removeAdminPassword,
            // Passwort-Verwaltung (Mitarbeiter)
            mitarbeiterPasswordHash: globalSettings.mitarbeiterPasswordHash,
            setMitarbeiterPassword,
            removeMitarbeiterPassword,
            // Gesellenbrief-Hintergrundbild
            certificateBackgroundImage: globalSettings.certificateBackgroundImage,
            setCertificateBackgroundImage,
            // Gesellenbrief-Positionen
            certificatePositions: globalSettings.certificatePositions || DEFAULT_CERTIFICATE_POSITIONS,
            setCertificatePositions,
            // Individuelle Textfelder für Gesellenbrief
            customTextFields,
            setCustomTextFields,
            updateCustomTextField,
            // Prüferpool-Verwaltung
            prueferpool,
            addPruefer,
            updatePruefer,
            deletePruefer,
            // Authentication
            authSession,
            isFirstTimeSetup,
            login,
            logout,
            completeFirstTimeSetup,
            updateActivity,
            sessionTimeRemaining,
            showTimeoutWarning,
            // Berechtigungen
            canDeleteData,
            canModifyStudents,
            canModifySettings,
            canManagePasswords,
            canEnterGrades,
            canPrintCertificates,
            canManageExaminers,
            // Globale Prüfer
            setGlobalExaminers,
            getGlobalExaminers,
            // Lizenz
            licenseInfo,
            isLicensed,
            licenseRemainingDays,
            activateLicense,
            // Globale Einstellungen
            globalSettings
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error("useStore must be used within StoreProvider");
    return context;
};
