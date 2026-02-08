import React, { useState, useMemo } from 'react';
import { useStore } from '../lib/store';
import { Award, Download, FileText, Eye, Users, CheckCircle, Calendar, Printer, Settings2, Sparkles, Type, ChevronDown, ChevronUp, Bold, Italic, AlignLeft, AlignCenter, AlignRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { GesellenbriefDocument, GesellenbriefSeriendruck } from '../components/GesellenbriefDocument';
import { CertificatePositionEditor } from '../components/CertificatePositionEditor';
import { Student, Grade, GradingSheet, CustomTextField, DEFAULT_CUSTOM_TEXT_FIELDS } from '../lib/types';
import { calculateGrade } from '../lib/grading';
import { cn } from '../lib/utils';

export default function GesellenbriefePage() {
    const { data, certificateBackgroundImage, certificatePositions, setCertificatePositions, customTextFields, updateCustomTextField } = useStore();
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [certificateDate, setCertificateDate] = useState(new Date().toISOString().split('T')[0]);
    const [showPositionEditor, setShowPositionEditor] = useState(false);
    const [showTextFieldEditor, setShowTextFieldEditor] = useState(false);
    const [expandedTextField, setExpandedTextField] = useState<string | null>(null);

    // Berechne welche Prüflinge bestanden haben
    const passedStudents = useMemo(() => {
        const results: Array<{ student: Student; totalPoints: number; passed: boolean }> = [];

        data.students.filter(s => s.isActive).forEach(student => {
            const gradePart1 = data.grades.find(g => g.studentId === student.id && g.sheetId === 'part1');
            const gradePart2 = data.grades.find(g => g.studentId === student.id && g.sheetId === 'part2');
            const sheetPart1 = data.sheets.find(s => s.id === 'part1');
            const sheetPart2 = data.sheets.find(s => s.id === 'part2');

            if (!gradePart1 || !gradePart2 || !sheetPart1 || !sheetPart2) {
                return; // Keine vollständigen Noten
            }

            // Berechne Teil 1 Punkte
            const getAvgScore = (grade: Grade, taskId: string) => {
                if (!grade.examiners || grade.examiners.length === 0) return 0;
                const sum = grade.examiners.reduce((acc, ex) => acc + (ex.scores[taskId] || 0), 0);
                return sum / grade.examiners.length;
            };

            const getExamPieceAvg = (grade: Grade, examPieceId: string) => {
                if (!grade.examPieceExaminers || grade.examPieceExaminers.length === 0) return 0;
                return grade.examPieceExaminers.reduce((acc, ex) => acc + (ex.scores[examPieceId] || 0), 0) / grade.examPieceExaminers.length;
            };

            // Teil 1 Berechnung
            const part1WorkTaskPoints = sheetPart1.tasks.reduce((sum, t) => sum + (getAvgScore(gradePart1, t.id) * t.weight), 0);
            const part1ExamPiecePoints = sheetPart1.examPiece ? getExamPieceAvg(gradePart1, sheetPart1.examPiece.id) : 0;
            const part1Total = (part1WorkTaskPoints * sheetPart1.workTaskWeight) + (part1ExamPiecePoints * sheetPart1.examPieceWeight);

            // Teil 2 Berechnung
            const part2WorkTaskPoints = sheetPart2.tasks.reduce((sum, t) => sum + (getAvgScore(gradePart2, t.id) * t.weight), 0);
            const part2ExamPiecePoints = sheetPart2.examPiece ? getExamPieceAvg(gradePart2, sheetPart2.examPiece.id) : 0;
            const part2Total = (part2WorkTaskPoints * sheetPart2.workTaskWeight) + (part2ExamPiecePoints * sheetPart2.examPieceWeight);

            // Gesamtergebnis
            const totalPoints = (part1Total * 0.25) + (part2Total * 0.75);
            const passed = totalPoints >= 50;

            if (passed) {
                results.push({ student, totalPoints, passed });
            }
        });

        return results.sort((a, b) => a.student.lastName.localeCompare(b.student.lastName));
    }, [data.students, data.grades, data.sheets]);

    const selectedStudent = selectedStudentId
        ? passedStudents.find(p => p.student.id === selectedStudentId)?.student
        : null;

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="space-y-6">
            {/* Liquid Metal Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 p-6 shadow-2xl">
                {/* Chrome/Metal Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-pulse" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Metallic Orbs */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-violet-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl" />

                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Chrome Award Icon */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 rounded-xl blur-lg opacity-60" />
                            <div className="relative p-3 bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-400 rounded-xl shadow-lg">
                                <Award className="text-amber-900" size={32} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
                                Gesellenbriefe
                                <Sparkles className="text-amber-400" size={20} />
                            </h2>
                            <p className="text-slate-400 mt-1">
                                Gesellenbriefe für bestandene Prüflinge erstellen und drucken
                            </p>
                        </div>
                    </div>

                    {passedStudents.length > 0 && (
                        <PDFDownloadLink
                            document={
                                <GesellenbriefSeriendruck
                                    students={passedStudents.map(p => p.student)}
                                    innung={data.innung}
                                    backgroundImage={certificateBackgroundImage}
                                    date={certificateDate}
                                    positions={certificatePositions}
                                    customTextFields={customTextFields}
                                />
                            }
                            fileName={`gesellenbriefe_alle_${new Date().toISOString().split('T')[0]}.pdf`}
                            className="relative group px-5 py-2.5 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 hover:from-slate-600 hover:via-slate-500 hover:to-slate-600 text-white rounded-xl flex items-center gap-2 font-medium shadow-lg border border-slate-500/30 transition-all duration-300"
                        >
                            {({ loading }) => (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Printer size={18} className="relative" />
                                    <span className="relative">{loading ? 'Wird erstellt...' : `Alle drucken (${passedStudents.length})`}</span>
                                </>
                            )}
                        </PDFDownloadLink>
                    )}
                </div>
            </div>

            {/* Datum-Auswahl - Chrome Card */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-slate-700 shadow-lg p-4">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="relative flex items-center gap-4 z-10">
                    <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg shadow-inner border border-slate-500/30">
                        <Calendar className="text-cyan-400" size={20} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Datum auf dem Gesellenbrief
                        </label>
                        <input
                            type="date"
                            value={certificateDate}
                            onChange={(e) => setCertificateDate(e.target.value)}
                            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200 shadow-inner focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                        />
                    </div>
                    <span className="text-sm text-slate-400">
                        Wird angezeigt als: <strong className="text-slate-200">{formatDate(certificateDate)}</strong>
                    </span>
                </div>
            </div>

            {/* Info über Hintergrundbild - Dark Liquid Metal Style */}
            <div className={cn(
                "relative overflow-hidden rounded-xl border p-4 shadow-lg",
                certificateBackgroundImage
                    ? "bg-gradient-to-br from-emerald-900/30 via-emerald-950/30 to-slate-900 border-emerald-500/30"
                    : "bg-gradient-to-br from-amber-900/30 via-amber-950/30 to-slate-900 border-amber-500/30"
            )}>
                {/* Metallic Shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <div className={cn(
                    "absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent",
                    certificateBackgroundImage ? "via-emerald-400/30" : "via-amber-400/30"
                )} />

                <div className="relative flex items-start gap-3 z-10">
                    <div className={cn(
                        "p-2 rounded-lg shadow-inner border",
                        certificateBackgroundImage
                            ? "bg-gradient-to-br from-emerald-800/50 to-emerald-900/50 border-emerald-500/30"
                            : "bg-gradient-to-br from-amber-800/50 to-amber-900/50 border-amber-500/30"
                    )}>
                        <FileText className={cn(
                            certificateBackgroundImage ? "text-emerald-400" : "text-amber-400"
                        )} size={20} />
                    </div>
                    <div className="flex-1">
                        <p className={cn(
                            "font-semibold",
                            certificateBackgroundImage ? "text-emerald-300" : "text-amber-300"
                        )}>
                            {certificateBackgroundImage
                                ? "Hintergrundbild aktiv"
                                : "Kein Hintergrundbild eingestellt"
                            }
                        </p>
                        <p className={cn(
                            "text-sm mt-1",
                            certificateBackgroundImage ? "text-emerald-300/70" : "text-amber-300/70"
                        )}>
                            {certificateBackgroundImage
                                ? "Die Gesellenbriefe werden mit Ihrem hochgeladenen Hintergrundbild erstellt. Name, Salon und Datum werden an den eingestellten Positionen eingetragen."
                                : "Es wird ein Standard-Design verwendet. Sie können in den Einstellungen unter 'Gesellenbrief Design' ein eigenes Hintergrundbild hochladen."
                            }
                        </p>
                    </div>
                    {certificateBackgroundImage && (
                        <button
                            onClick={() => setShowPositionEditor(true)}
                            className="relative group px-4 py-2 bg-gradient-to-b from-emerald-600/30 to-emerald-800/30 border border-emerald-500/30 text-emerald-300 rounded-lg hover:from-emerald-500/40 hover:to-emerald-700/40 flex items-center gap-2 text-sm font-medium whitespace-nowrap shadow-lg shadow-emerald-500/10 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 rounded-lg" />
                            <Settings2 size={16} className="relative z-10" />
                            <span className="relative z-10">Positionen einrichten</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Custom Text Fields Editor - nur bei Hintergrundbild */}
            {certificateBackgroundImage && (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-slate-700 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent pointer-events-none" />

                    {/* Toggle Header */}
                    <button
                        onClick={() => setShowTextFieldEditor(!showTextFieldEditor)}
                        className="relative w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg shadow-lg shadow-violet-500/20">
                                <Type className="text-white" size={18} />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-slate-200">Individuelle Textfelder</h3>
                                <p className="text-sm text-slate-400">7 frei positionierbare Textfelder für Innungsname, Wasserzeichen etc.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-violet-500/20 text-violet-300 rounded-full">
                                {customTextFields.filter(f => f.enabled).length} aktiv
                            </span>
                            {showTextFieldEditor ? (
                                <ChevronUp className="text-slate-400" size={20} />
                            ) : (
                                <ChevronDown className="text-slate-400" size={20} />
                            )}
                        </div>
                    </button>

                    {/* Expandable Content */}
                    {showTextFieldEditor && (
                        <div className="border-t border-slate-700 p-4 space-y-3 relative z-10">
                            {customTextFields.map((field, index) => {
                                const handleToggleEnabled = (e: React.MouseEvent) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    updateCustomTextField(field.id, { enabled: !field.enabled });
                                };

                                const handleToggleExpand = (e: React.MouseEvent) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setExpandedTextField(expandedTextField === field.id ? null : field.id);
                                };

                                return (
                                <div key={field.id} className="rounded-lg border border-slate-600 overflow-hidden">
                                    {/* Field Header */}
                                    <div
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 transition-colors",
                                            field.enabled ? "bg-slate-700/50" : "bg-slate-800/50"
                                        )}
                                    >
                                        {/* Links: Toggle Button */}
                                        <div className="flex items-center gap-3">
                                            <span
                                                onClick={handleToggleEnabled}
                                                className={cn(
                                                    "p-1.5 rounded-lg transition-all cursor-pointer hover:scale-105 select-none",
                                                    field.enabled
                                                        ? "bg-violet-500/30 text-violet-300 hover:bg-violet-500/50"
                                                        : "bg-slate-600/30 text-slate-500 hover:bg-slate-600/50"
                                                )}
                                            >
                                                {field.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                            </span>
                                            {/* Klickbarer Bereich für Expand */}
                                            <span
                                                onClick={handleToggleExpand}
                                                className="flex items-center gap-2 cursor-pointer flex-1 select-none"
                                            >
                                                <span className={cn(
                                                    "font-medium",
                                                    field.enabled ? "text-slate-200" : "text-slate-500"
                                                )}>
                                                    Textfeld {index + 1}
                                                </span>
                                                {field.text && (
                                                    <span className="text-sm text-slate-400 truncate max-w-[200px]">
                                                        "{field.text}"
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        {/* Rechts: Info + Chevron */}
                                        <span
                                            onClick={handleToggleExpand}
                                            className="flex items-center gap-2 cursor-pointer select-none"
                                        >
                                            {field.enabled && (
                                                <span className="text-xs text-slate-500">
                                                    {field.fontSize}pt • X:{field.x}mm Y:{field.y}mm
                                                </span>
                                            )}
                                            {expandedTextField === field.id ? (
                                                <ChevronUp className="text-slate-400" size={16} />
                                            ) : (
                                                <ChevronDown className="text-slate-400" size={16} />
                                            )}
                                        </span>
                                    </div>

                                    {/* Expanded Editor */}
                                    {expandedTextField === field.id && (
                                        <div className="p-4 bg-slate-800/30 border-t border-slate-700 space-y-4">
                                            {/* Text Input */}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1">Text <span className="text-slate-500 font-normal">(Enter für Zeilenumbruch)</span></label>
                                                <textarea
                                                    value={field.text}
                                                    onChange={(e) => updateCustomTextField(field.id, { text: e.target.value })}
                                                    placeholder="z.B. Friseur-Innung Niedersachsen"
                                                    rows={2}
                                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none"
                                                />
                                            </div>

                                            {/* Position & Size */}
                                            <div className="grid grid-cols-4 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">X-Position (mm) - links/rechts</label>
                                                    <input
                                                        type="number"
                                                        value={field.x}
                                                        onChange={(e) => updateCustomTextField(field.id, { x: Number(e.target.value) })}
                                                        min={0}
                                                        max={210}
                                                        className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Y-Position (mm) - oben/unten</label>
                                                    <input
                                                        type="number"
                                                        value={field.y}
                                                        onChange={(e) => updateCustomTextField(field.id, { y: Number(e.target.value) })}
                                                        min={0}
                                                        max={297}
                                                        className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Schriftgröße (pt)</label>
                                                    <input
                                                        type="number"
                                                        value={field.fontSize}
                                                        onChange={(e) => updateCustomTextField(field.id, { fontSize: Number(e.target.value) })}
                                                        min={6}
                                                        max={72}
                                                        className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1">Farbe</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={field.color}
                                                            onChange={(e) => updateCustomTextField(field.id, { color: e.target.value })}
                                                            className="w-8 h-8 rounded cursor-pointer border border-slate-600"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={field.color}
                                                            onChange={(e) => updateCustomTextField(field.id, { color: e.target.value })}
                                                            className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Style Buttons */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1">
                                                    <button
                                                        onClick={() => updateCustomTextField(field.id, { align: 'left', x: 20 })}
                                                        className={cn(
                                                            "p-2 rounded-lg transition-all",
                                                            field.align === 'left'
                                                                ? "bg-violet-500/30 text-violet-300"
                                                                : "text-slate-400 hover:text-slate-200"
                                                        )}
                                                        title="Linksbündig (X → 20mm)"
                                                    >
                                                        <AlignLeft size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => updateCustomTextField(field.id, { align: 'center' })}
                                                        className={cn(
                                                            "p-2 rounded-lg transition-all",
                                                            field.align === 'center'
                                                                ? "bg-violet-500/30 text-violet-300"
                                                                : "text-slate-400 hover:text-slate-200"
                                                        )}
                                                        title="Zentriert (horizontal mittig auf der Seite)"
                                                    >
                                                        <AlignCenter size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => updateCustomTextField(field.id, { align: 'right', x: 190 })}
                                                        className={cn(
                                                            "p-2 rounded-lg transition-all",
                                                            field.align === 'right'
                                                                ? "bg-violet-500/30 text-violet-300"
                                                                : "text-slate-400 hover:text-slate-200"
                                                        )}
                                                        title="Rechtsbündig (X → 190mm)"
                                                    >
                                                        <AlignRight size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1">
                                                    <button
                                                        onClick={() => updateCustomTextField(field.id, { bold: !field.bold })}
                                                        className={cn(
                                                            "p-2 rounded-lg transition-all",
                                                            field.bold
                                                                ? "bg-violet-500/30 text-violet-300"
                                                                : "text-slate-400 hover:text-slate-200"
                                                        )}
                                                        title="Fett"
                                                    >
                                                        <Bold size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => updateCustomTextField(field.id, { italic: !field.italic })}
                                                        className={cn(
                                                            "p-2 rounded-lg transition-all",
                                                            field.italic
                                                                ? "bg-violet-500/30 text-violet-300"
                                                                : "text-slate-400 hover:text-slate-200"
                                                        )}
                                                        title="Kursiv"
                                                    >
                                                        <Italic size={16} />
                                                    </button>
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    Tipp: A4 = 210×297mm. Mitte horizontal = X:105mm
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Hauptbereich */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Liste der bestandenen Prüflinge - Dark Chrome Card */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-slate-700 shadow-xl">
                    {/* Chrome Shine */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    {/* Top Chrome Bar */}
                    <div className="relative p-4 bg-gradient-to-b from-slate-700 to-slate-800 border-b border-slate-600">
                        <div className="relative flex items-center justify-between z-10">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg shadow-lg shadow-emerald-500/20">
                                    <CheckCircle className="text-white" size={18} />
                                </div>
                                <h3 className="font-semibold text-slate-200">
                                    Bestandene Prüflinge
                                </h3>
                            </div>
                            <span className="text-sm px-3 py-1 bg-emerald-900/50 text-emerald-300 rounded-full font-medium border border-emerald-500/30">
                                {passedStudents.length} Prüflinge
                            </span>
                        </div>
                    </div>

                    {passedStudents.length > 0 ? (
                        <div className="divide-y divide-slate-700/50 max-h-[500px] overflow-y-auto">
                            {passedStudents.map(({ student, totalPoints }, index) => {
                                const grade = calculateGrade(totalPoints, 100);
                                return (
                                    <div
                                        key={student.id}
                                        className={cn(
                                            "relative p-4 cursor-pointer transition-all duration-300 group",
                                            selectedStudentId === student.id
                                                ? "bg-cyan-900/30 border-l-4 border-cyan-500"
                                                : "hover:bg-slate-700/50 border-l-4 border-transparent"
                                        )}
                                        onClick={() => {
                                            setSelectedStudentId(student.id);
                                            setShowPreview(true);
                                        }}
                                    >
                                        {/* Hover Shine Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -skew-x-12" />

                                        <div className="relative flex items-center justify-between z-10">
                                            <div>
                                                <p className="font-medium text-slate-200 group-hover:text-white transition-colors">
                                                    {student.gender} {student.firstName} {student.lastName}
                                                </p>
                                                <p className="text-sm text-slate-400">{student.salon}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm px-2 py-1 bg-slate-700 text-slate-300 rounded-lg font-medium border border-slate-600">
                                                    {totalPoints.toFixed(1)} Pkt. (Note {grade.value})
                                                </span>
                                                <PDFDownloadLink
                                                    document={
                                                        <GesellenbriefDocument
                                                            student={student}
                                                            innung={data.innung}
                                                            backgroundImage={certificateBackgroundImage}
                                                            date={certificateDate}
                                                            positions={certificatePositions}
                                                            customTextFields={customTextFields}
                                                        />
                                                    }
                                                    fileName={`gesellenbrief_${student.lastName}_${student.firstName}.pdf`}
                                                    className="relative p-2 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-all"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Download size={18} />
                                                </PDFDownloadLink>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="inline-flex p-4 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full shadow-inner mb-4 border border-slate-600">
                                <Users size={48} className="text-slate-500" />
                            </div>
                            <p className="font-medium text-slate-400">Keine bestandenen Prüflinge</p>
                            <p className="text-sm mt-2 text-slate-500">
                                Prüflinge müssen beide Prüfungsteile mit mindestens 50 Punkten abschließen.
                            </p>
                        </div>
                    )}
                </div>

                {/* Vorschau - Dark Chrome Card */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-slate-700 shadow-xl">
                    {/* Chrome Shine */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    {/* Top Chrome Bar */}
                    <div className="relative p-4 bg-gradient-to-b from-slate-700 to-slate-800 border-b border-slate-600">
                        <div className="relative flex items-center gap-2 z-10">
                            <div className="p-1.5 bg-gradient-to-br from-violet-500 to-purple-700 rounded-lg shadow-lg shadow-violet-500/20">
                                <Eye className="text-white" size={18} />
                            </div>
                            <h3 className="font-semibold text-slate-200">
                                Vorschau
                            </h3>
                        </div>
                    </div>

                    {selectedStudent && showPreview ? (
                        <div className="p-4 relative z-10">
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-sm text-slate-400">
                                    Gesellenbrief für <strong className="text-slate-200">{selectedStudent.firstName} {selectedStudent.lastName}</strong>
                                </p>
                                <PDFDownloadLink
                                    document={
                                        <GesellenbriefDocument
                                            student={selectedStudent}
                                            innung={data.innung}
                                            backgroundImage={certificateBackgroundImage}
                                            date={certificateDate}
                                            positions={certificatePositions}
                                            customTextFields={customTextFields}
                                        />
                                    }
                                    fileName={`gesellenbrief_${selectedStudent.lastName}_${selectedStudent.firstName}.pdf`}
                                    className="relative group px-4 py-2 bg-gradient-to-b from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-sm flex items-center gap-2 font-medium shadow-lg shadow-cyan-500/25 transition-all duration-300"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 rounded-lg" />
                                    <Download size={14} className="relative z-10" />
                                    <span className="relative z-10">PDF herunterladen</span>
                                </PDFDownloadLink>
                            </div>
                            <div className="relative rounded-lg overflow-hidden shadow-inner" style={{ height: '600px' }}>
                                {/* Chrome Frame */}
                                <div className="absolute inset-0 border-4 border-slate-600 rounded-lg pointer-events-none z-10" />
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10" />

                                <PDFViewer width="100%" height="100%" showToolbar={false}>
                                    <GesellenbriefDocument
                                        student={selectedStudent}
                                        innung={data.innung}
                                        backgroundImage={certificateBackgroundImage}
                                        date={certificateDate}
                                        positions={certificatePositions}
                                        customTextFields={customTextFields}
                                    />
                                </PDFViewer>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center h-[600px] flex flex-col items-center justify-center relative z-10">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 via-yellow-500/10 to-orange-500/20 rounded-full blur-2xl" />
                                <div className="relative inline-flex p-6 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full shadow-inner mb-4 border border-slate-600">
                                    <Award size={64} className="text-slate-500" />
                                </div>
                            </div>
                            <p className="font-medium text-slate-400">Wählen Sie einen Prüfling aus</p>
                            <p className="text-sm mt-2 text-slate-500">
                                Klicken Sie links auf einen Namen, um die Vorschau anzuzeigen.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Positionierungs-Editor Modal */}
            {showPositionEditor && certificateBackgroundImage && (
                <CertificatePositionEditor
                    backgroundImage={certificateBackgroundImage}
                    positions={certificatePositions}
                    onSave={setCertificatePositions}
                    onClose={() => setShowPositionEditor(false)}
                    customTextFields={customTextFields}
                />
            )}
        </div>
    );
}
