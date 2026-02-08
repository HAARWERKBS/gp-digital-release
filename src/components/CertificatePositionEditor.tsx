import React, { useState } from 'react';
import { Move, Type, RotateCcw, Save, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { PDFViewer } from '@react-pdf/renderer';
import { CertificatePositions, CertificateFieldPosition, DEFAULT_CERTIFICATE_POSITIONS, CustomTextField } from '../lib/types';
import { cn } from '../lib/utils';
import { GesellenbriefDocument } from './GesellenbriefDocument';

interface CertificatePositionEditorProps {
    backgroundImage: string;
    positions: CertificatePositions;
    onSave: (positions: CertificatePositions) => void;
    onClose: () => void;
    customTextFields?: CustomTextField[];  // Individuelle Textfelder für die Vorschau
}

// A4 Größe in mm: 210 x 297
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

type FieldKey = 'name' | 'salon' | 'date';

const FIELD_LABELS: Record<FieldKey, string> = {
    name: 'Name',
    salon: 'Salon',
    date: 'Datum'
};

// Beispiel-Student für die Vorschau
const SAMPLE_STUDENT = {
    id: 'preview',
    firstName: 'Maria',
    lastName: 'Mustermann',
    gender: 'Frau' as const,
    salon: 'Salon Haarscharf',
    examNumber: '12345',
    company: '',
    instructor: '',
    isActive: true,
    createdAt: new Date().toISOString(),
};

export const CertificatePositionEditor: React.FC<CertificatePositionEditorProps> = ({
    backgroundImage,
    positions: initialPositions,
    onSave,
    onClose,
    customTextFields
}) => {
    const [positions, setPositions] = useState<CertificatePositions>(initialPositions);
    const [selectedField, setSelectedField] = useState<FieldKey>('name');
    // Key um PDFViewer neu zu rendern
    const [pdfKey, setPdfKey] = useState(0);

    const updateField = (field: FieldKey, updates: Partial<CertificateFieldPosition>) => {
        setPositions(prev => ({
            ...prev,
            [field]: { ...prev[field], ...updates }
        }));
        // PDF neu rendern
        setPdfKey(k => k + 1);
    };

    const moveField = (field: FieldKey, dx: number, dy: number) => {
        const current = positions[field];
        const newX = Math.max(0, Math.min(A4_WIDTH_MM, current.x + dx));
        const newY = Math.max(0, Math.min(A4_HEIGHT_MM, current.y + dy));
        updateField(field, { x: newX, y: newY });
    };

    const handleReset = () => {
        setPositions(DEFAULT_CERTIFICATE_POSITIONS);
        setPdfKey(k => k + 1);
    };

    const handleSave = () => {
        onSave(positions);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Move className="text-indigo-400" size={20} />
                            Gesellenbrief-Positionen einrichten
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Verwenden Sie die Pfeiltasten oder geben Sie die Koordinaten direkt ein
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleReset}
                            className="px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg flex items-center gap-2 text-sm"
                        >
                            <RotateCcw size={16} />
                            Zurücksetzen
                        </button>
                        <button
                            onClick={onClose}
                            className="px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg text-sm"
                        >
                            Abbrechen
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium"
                        >
                            <Save size={16} />
                            Speichern
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* PDF-Vorschau */}
                    <div className="flex-1 p-4 bg-slate-800 overflow-auto flex items-start justify-center">
                        <div className="bg-white shadow-lg" style={{ width: 525, height: 742 }}>
                            <PDFViewer
                                key={pdfKey}
                                width="100%"
                                height="100%"
                                showToolbar={false}
                            >
                                <GesellenbriefDocument
                                    student={SAMPLE_STUDENT}
                                    backgroundImage={backgroundImage}
                                    date={new Date().toISOString().split('T')[0]}
                                    positions={positions}
                                    customTextFields={customTextFields}
                                />
                            </PDFViewer>
                        </div>
                    </div>

                    {/* Einstellungs-Panel */}
                    <div className="w-96 border-l border-slate-700 bg-slate-900 overflow-y-auto">
                        <div className="p-4 space-y-4">
                            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                                <Type size={16} className="text-indigo-400" />
                                Feld-Einstellungen
                            </h3>

                            {/* Feld-Auswahl */}
                            <div className="flex gap-1">
                                {(Object.keys(positions) as FieldKey[]).map((field) => (
                                    <button
                                        key={field}
                                        onClick={() => setSelectedField(field)}
                                        className={cn(
                                            "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                            selectedField === field
                                                ? "bg-indigo-500/20 text-indigo-300"
                                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                        )}
                                    >
                                        {FIELD_LABELS[field]}
                                    </button>
                                ))}
                            </div>

                            {/* Aktuelle Position anzeigen */}
                            <div className="bg-slate-800 rounded-lg p-3">
                                <div className="text-sm text-slate-300 mb-2">
                                    <strong>{FIELD_LABELS[selectedField]}</strong> - Position: X={positions[selectedField].x}mm, Y={positions[selectedField].y}mm
                                </div>
                            </div>

                            {/* Bewegungs-Steuerung */}
                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-3">
                                    Position verschieben
                                </label>
                                <div className="flex flex-col items-center gap-1">
                                    <button
                                        onClick={() => moveField(selectedField, 0, -1)}
                                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200"
                                        title="1mm nach oben"
                                    >
                                        <ChevronUp size={20} />
                                    </button>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => moveField(selectedField, -1, 0)}
                                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200"
                                            title="1mm nach links"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs font-medium w-16 text-center">
                                            1mm
                                        </div>
                                        <button
                                            onClick={() => moveField(selectedField, 1, 0)}
                                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200"
                                            title="1mm nach rechts"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => moveField(selectedField, 0, 1)}
                                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200"
                                        title="1mm nach unten"
                                    >
                                        <ChevronDown size={20} />
                                    </button>
                                </div>
                                <div className="flex justify-center gap-2 mt-3">
                                    <button
                                        onClick={() => moveField(selectedField, 0, -5)}
                                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-200"
                                    >
                                        ↑ 5mm
                                    </button>
                                    <button
                                        onClick={() => moveField(selectedField, 0, 5)}
                                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-200"
                                    >
                                        ↓ 5mm
                                    </button>
                                    <button
                                        onClick={() => moveField(selectedField, -5, 0)}
                                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-200"
                                    >
                                        ← 5mm
                                    </button>
                                    <button
                                        onClick={() => moveField(selectedField, 5, 0)}
                                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-200"
                                    >
                                        → 5mm
                                    </button>
                                </div>
                            </div>

                            {/* Manuelle Koordinaten-Eingabe */}
                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">
                                    Koordinaten (in mm)
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">X (von links)</label>
                                        <input
                                            type="number"
                                            value={positions[selectedField].x}
                                            onChange={(e) => updateField(selectedField, { x: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-700 text-slate-200"
                                            min={0}
                                            max={A4_WIDTH_MM}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Y (von oben)</label>
                                        <input
                                            type="number"
                                            value={positions[selectedField].y}
                                            onChange={(e) => updateField(selectedField, { y: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-700 text-slate-200"
                                            min={0}
                                            max={A4_HEIGHT_MM}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    A4 = 210 × 297 mm | Mitte = X: 105mm
                                </p>
                            </div>

                            {/* Schriftgröße */}
                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">
                                    Schriftgröße (pt)
                                </label>
                                <input
                                    type="number"
                                    value={positions[selectedField].fontSize}
                                    onChange={(e) => updateField(selectedField, { fontSize: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-700 text-slate-200"
                                    min={8}
                                    max={72}
                                />
                            </div>

                            {/* Ausrichtung */}
                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">
                                    Ausrichtung
                                </label>
                                <div className="flex gap-1">
                                    {(['left', 'center', 'right'] as const).map((align) => (
                                        <button
                                            key={align}
                                            onClick={() => {
                                                // Bei Ausrichtungswechsel auch X-Position anpassen
                                                const newX = align === 'left' ? 20 : align === 'center' ? 105 : 190;
                                                updateField(selectedField, { align, x: newX });
                                            }}
                                            className={cn(
                                                "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                                positions[selectedField].align === align
                                                    ? "bg-indigo-500/20 text-indigo-300"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            )}
                                            title={align === 'left' ? 'Linksbündig (X → 20mm)' : align === 'center' ? 'Zentriert (horizontal mittig)' : 'Rechtsbündig (X → 190mm)'}
                                        >
                                            {align === 'left' ? 'Links' : align === 'center' ? 'Mitte' : 'Rechts'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Farbe */}
                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">
                                    Textfarbe
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={positions[selectedField].color}
                                        onChange={(e) => updateField(selectedField, { color: e.target.value })}
                                        className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={positions[selectedField].color}
                                        onChange={(e) => updateField(selectedField, { color: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-700 text-slate-200 font-mono"
                                        placeholder="#000000"
                                    />
                                </div>
                                <div className="flex gap-2 flex-wrap mt-2">
                                    {['#000000', '#1a1a1a', '#333333', '#666666', '#1a365d', '#2d3748'].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => updateField(selectedField, { color })}
                                            className={cn(
                                                "w-7 h-7 rounded border-2 transition-transform hover:scale-110",
                                                positions[selectedField].color === color
                                                    ? "border-indigo-500 ring-2 ring-indigo-500/30"
                                                    : "border-slate-600"
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Hilfe */}
                            <div className="pt-4 border-t border-slate-700">
                                <h4 className="text-sm font-medium text-slate-200 mb-2">Tipps</h4>
                                <ul className="text-xs text-slate-400 space-y-1">
                                    <li>• Die Vorschau links zeigt das finale PDF in Echtzeit</li>
                                    <li>• X=105mm ist die horizontale Mitte</li>
                                    <li>• Ausrichtung "Mitte" zentriert den Text um die X-Position</li>
                                    <li>• Die Positionen gelten für alle Gesellenbriefe</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
