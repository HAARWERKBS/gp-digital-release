#!/usr/bin/env node
/**
 * GP Digital - Bedienungsanleitung PDF Generator
 *
 * Erstellt eine PDF-Broschüre aus der Markdown-Anleitung mit eingebetteten Bildern.
 *
 * Verwendung:
 *   node generate-manual-pdf.js
 *
 * Voraussetzungen:
 *   npm install puppeteer
 */

const fs = require('fs');
const path = require('path');

// Pfade
const IMAGES_DIR = path.join(__dirname, '..', 'ANALYSE', 'Anleitung-Bilder');
const OUTPUT_FILE = path.join(__dirname, 'GP-Digital-Bedienungsanleitung.pdf');

// Bilder als Base64 laden
function loadImageAsBase64(imagePath) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const ext = path.extname(imagePath).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
        return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
    } catch (error) {
        console.error(`Fehler beim Laden von ${imagePath}:`, error.message);
        return null;
    }
}

// Alle Bilder laden
const images = {};
const imageFiles = [
    '01-lizenzaktivierung.png',
    '02-ersteinrichtung-passwort.png',
    '03-hauptansicht-prueflinge-leer.png',
    '04-jahrgang-dropdown.png',
    '05-status-pausieren.png',
    '06-pruefling-bearbeiten.png',
    '07-prueflinge-liste.png',
    '08-benotung-zusammenfassung.png',
    '09-benotung-arbeitsaufgaben.png',
    '10-niederschrift-teil2-pdf.png',
    '11-gesamtniederschrift-pdf.png',
    '12-pdf-buttons.png',
    '13-innungslogo-hochladen.png',
    '14-innungslogo-vorschau.png',
    '15-gesellenbrief-hintergrundbild.png',
    '16-gesellenbriefe-seite.png',
    '17-passwoerter-admin-mitarbeiter.png',
    '18-prueferpool.png',
    '19-innung-einstellungen.png',
    '20-notenschluessel-gesperrt.png',
    '21-notenschluessel-entsperrt.png',
    '22-pruefungsstruktur-gesperrt.png',
    '23-pruefungsstruktur-entsperrt.png'
];

console.log('Lade Bilder...');
imageFiles.forEach(file => {
    const imagePath = path.join(IMAGES_DIR, file);
    const base64 = loadImageAsBase64(imagePath);
    if (base64) {
        images[file] = base64;
        console.log(`  ✓ ${file}`);
    }
});

// HTML-Inhalt erstellen
const htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>GP Digital - Bedienungsanleitung</title>
    <style>
        @page {
            size: A4;
            margin: 20mm 15mm 25mm 15mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1a1a1a;
            max-width: 100%;
        }

        /* Titelseite */
        .cover {
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 90vh;
            text-align: center;
        }

        .cover-logo {
            width: 120px;
            height: 120px;
            margin-bottom: 40px;
        }

        .cover h1 {
            font-size: 32pt;
            color: #0891b2;
            margin-bottom: 10px;
        }

        .cover h2 {
            font-size: 18pt;
            color: #475569;
            font-weight: normal;
            margin-bottom: 40px;
        }

        .cover .org {
            font-size: 12pt;
            color: #64748b;
            margin-top: 60px;
        }

        .cover .org strong {
            display: block;
            font-size: 14pt;
            color: #334155;
            margin-bottom: 10px;
        }

        .cover .version {
            margin-top: 80px;
            font-size: 10pt;
            color: #94a3b8;
        }

        /* Inhaltsverzeichnis */
        .toc {
            page-break-after: always;
        }

        .toc h2 {
            color: #0891b2;
            border-bottom: 2px solid #0891b2;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }

        .toc ul {
            list-style: none;
            padding: 0;
        }

        .toc li {
            padding: 8px 0;
            border-bottom: 1px dotted #e2e8f0;
        }

        .toc a {
            color: #1e293b;
            text-decoration: none;
        }

        /* Kapitel */
        h1 {
            font-size: 24pt;
            color: #0891b2;
            margin-top: 0;
            page-break-before: always;
        }

        h1:first-of-type {
            page-break-before: avoid;
        }

        h2 {
            font-size: 16pt;
            color: #0f172a;
            margin-top: 25px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
        }

        h3 {
            font-size: 13pt;
            color: #334155;
            margin-top: 20px;
        }

        h4 {
            font-size: 11pt;
            color: #475569;
            margin-top: 15px;
        }

        /* Bilder */
        .image-container {
            margin: 20px 0;
            text-align: center;
        }

        .image-container img {
            max-width: 100%;
            max-height: 280px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .image-container.small img {
            max-height: 150px;
        }

        .image-container.large img {
            max-height: 350px;
        }

        .image-caption {
            font-size: 9pt;
            color: #64748b;
            margin-top: 8px;
            font-style: italic;
        }

        /* Tabellen */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10pt;
        }

        th {
            background: #0891b2;
            color: white;
            padding: 10px;
            text-align: left;
        }

        td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
        }

        tr:nth-child(even) {
            background: #f8fafc;
        }

        /* Listen */
        ul, ol {
            padding-left: 25px;
        }

        li {
            margin-bottom: 5px;
        }

        /* Hinweisboxen */
        .hint {
            background: #f0f9ff;
            border-left: 4px solid #0891b2;
            padding: 12px 15px;
            margin: 15px 0;
            border-radius: 0 8px 8px 0;
        }

        .hint.warning {
            background: #fef3c7;
            border-left-color: #f59e0b;
        }

        .hint.danger {
            background: #fef2f2;
            border-left-color: #ef4444;
        }

        .hint strong {
            display: block;
            margin-bottom: 5px;
        }

        /* Code/Schlüssel */
        code {
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 10pt;
        }

        /* Footer */
        .page-footer {
            position: fixed;
            bottom: 10mm;
            left: 15mm;
            right: 15mm;
            font-size: 8pt;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 5px;
            display: flex;
            justify-content: space-between;
        }

        /* Seitenumbrüche */
        .page-break {
            page-break-after: always;
        }

        .no-break {
            page-break-inside: avoid;
        }
    </style>
</head>
<body>

<!-- TITELSEITE -->
<div class="cover">
    <img src="${images['01-lizenzaktivierung.png'] ? images['01-lizenzaktivierung.png'].replace('data:image/png;base64,', 'data:image/png;base64,') : ''}" alt="GP Digital" class="cover-logo" style="display:none;">
    <h1>GP Digital</h1>
    <h2>Bedienungsanleitung</h2>
    <p style="font-size: 14pt; color: #64748b;">Das Prüfungstool zur Abnahme der<br>Gesellenprüfung Teil 1 und Teil 2</p>

    <div class="org">
        <strong>Landesinnungsverband des<br>niedersächsischen Friseurhandwerks</strong>
        Ricklinger Stadtweg 92<br>
        30459 Hannover<br><br>
        Tel: 0511 / 42 72 31<br>
        E-Mail: info@liv-friseure-nds.de
    </div>

    <div class="version">
        Version 1.0 • Januar 2026
    </div>
</div>

<!-- INHALTSVERZEICHNIS -->
<div class="toc">
    <h2>Inhaltsverzeichnis</h2>
    <ul>
        <li><a href="#kap1">1. Produktaktivierung (Lizenz)</a></li>
        <li><a href="#kap2">2. Ersteinrichtung</a></li>
        <li><a href="#kap3">3. Anmeldung</a></li>
        <li><a href="#kap4">4. Jahrgänge verwalten</a></li>
        <li><a href="#kap5">5. Prüflinge verwalten</a></li>
        <li><a href="#kap6">6. Benotung durchführen</a></li>
        <li><a href="#kap7">7. PDF-Dokumente erstellen</a></li>
        <li><a href="#kap8">8. Gesellenbriefe erstellen</a></li>
        <li><a href="#kap9">9. Einstellungen (nur Administratoren)</a></li>
        <li><a href="#kap10">10. Passwortschutz verstehen</a></li>
        <li><a href="#kap11">11. Häufige Fragen</a></li>
        <li><a href="#kontakt">Kontakt</a></li>
    </ul>
</div>

<!-- KAPITEL 1: PRODUKTAKTIVIERUNG -->
<h1 id="kap1">1. Produktaktivierung (Lizenz)</h1>

<p>Beim ersten Start der Software müssen Sie einen gültigen Lizenzschlüssel eingeben.</p>

<div class="image-container">
    <img src="${images['01-lizenzaktivierung.png'] || ''}" alt="Lizenzaktivierung">
    <div class="image-caption">Abb. 1: Eingabe des Lizenzschlüssels</div>
</div>

<h3>So aktivieren Sie die Lizenz:</h3>
<ol>
    <li>Geben Sie Ihren Lizenzschlüssel im Format <code>GPDIG-XXXXX-XXXXX-XXXXX</code> ein</li>
    <li>Der Schlüssel wird während der Eingabe automatisch formatiert</li>
    <li>Wenn der Schlüssel vollständig ist, erscheint ein grüner Hinweis</li>
    <li>Klicken Sie auf <strong>"Lizenz aktivieren"</strong></li>
</ol>

<div class="hint">
    <strong>Hinweis:</strong>
    Den Lizenzschlüssel haben Sie beim Kauf der Software erhalten. Bei Fragen wenden Sie sich an info@liv-friseure-nds.de.
</div>

<!-- KAPITEL 2: ERSTEINRICHTUNG -->
<h1 id="kap2">2. Ersteinrichtung</h1>

<p>Wenn Sie die Software zum ersten Mal starten (nach der Lizenzaktivierung), müssen Sie ein Administrator-Passwort festlegen.</p>

<div class="image-container">
    <img src="${images['02-ersteinrichtung-passwort.png'] || ''}" alt="Ersteinrichtung Passwort">
    <div class="image-caption">Abb. 2: Administrator-Passwort festlegen</div>
</div>

<h3>So richten Sie das Admin-Passwort ein:</h3>
<ol>
    <li>Geben Sie ein sicheres Passwort ein (mindestens 4 Zeichen)</li>
    <li>Wiederholen Sie das Passwort zur Bestätigung</li>
    <li>Klicken Sie auf <strong>"Einrichtung abschließen"</strong></li>
</ol>

<div class="hint warning">
    <strong>Wichtig:</strong>
    Merken Sie sich dieses Passwort gut! Es wird für alle sicherheitsrelevanten Aktionen benötigt.
</div>

<!-- KAPITEL 3: ANMELDUNG -->
<h1 id="kap3">3. Anmeldung</h1>

<p>Nach der Ersteinrichtung sehen Sie bei jedem Start die Anmeldeseite.</p>

<h2>Zwei Benutzerrollen</h2>

<table>
    <tr>
        <th>Rolle</th>
        <th>Symbol</th>
        <th>Berechtigungen</th>
    </tr>
    <tr>
        <td><strong>Administrator</strong></td>
        <td>Blaues Schild</td>
        <td>Voller Zugriff: Prüflinge anlegen/bearbeiten/löschen, Noten eintragen, alle Einstellungen ändern</td>
    </tr>
    <tr>
        <td><strong>Mitarbeiter</strong></td>
        <td>Graues Symbol</td>
        <td>Eingeschränkt: Noten eintragen, Gesellenbriefe drucken - aber KEINE Lösch- oder Einstellungsaktionen</td>
    </tr>
</table>

<h3>So melden Sie sich an:</h3>
<ol>
    <li>Geben Sie Ihr Passwort ein</li>
    <li>Klicken Sie auf <strong>"Anmelden"</strong></li>
    <li>Das System erkennt automatisch, ob Sie Administrator oder Mitarbeiter sind</li>
</ol>

<div class="hint">
    <strong>Automatische Abmeldung:</strong>
    Aus Sicherheitsgründen werden Sie nach 30 Minuten ohne Aktivität automatisch abgemeldet. 5 Minuten vorher erscheint eine Warnung.
</div>

<!-- KAPITEL 4: JAHRGÄNGE VERWALTEN -->
<h1 id="kap4">4. Jahrgänge verwalten</h1>

<div class="image-container small">
    <img src="${images['04-jahrgang-dropdown.png'] || ''}" alt="Jahrgang Dropdown">
    <div class="image-caption">Abb. 3: Jahrgang-Auswahl</div>
</div>

<p>Oben links unter dem Logo sehen Sie den aktuellen Jahrgang. Klicken Sie darauf, um:</p>

<ul>
    <li><strong>Anderen Jahrgang auswählen:</strong> Klicken Sie auf den gewünschten Jahrgang</li>
    <li><strong>Neuen Jahrgang erstellen:</strong> Klicken Sie auf "+ Neuen Jahrgang anlegen"</li>
    <li><strong>Jahrgang umbenennen:</strong> Klicken Sie auf das Stift-Symbol</li>
    <li><strong>Jahrgang duplizieren:</strong> Klicken Sie auf das Kopier-Symbol</li>
    <li><strong>Jahrgang löschen:</strong> Klicken Sie auf das Papierkorb-Symbol (erfordert Admin-Passwort!)</li>
</ul>

<!-- KAPITEL 5: PRÜFLINGE VERWALTEN -->
<h1 id="kap5">5. Prüflinge verwalten</h1>

<p>Nach der Anmeldung sehen Sie die <strong>Prüflinge-Seite</strong> mit allen Prüflingen des aktuellen Jahrgangs.</p>

<div class="image-container large">
    <img src="${images['07-prueflinge-liste.png'] || ''}" alt="Prüflinge Liste">
    <div class="image-caption">Abb. 4: Übersicht aller Prüflinge</div>
</div>

<h2>Neuen Prüfling anlegen (nur Administrator)</h2>

<ol>
    <li>Klicken Sie auf den grünen Button <strong>"+ Neuer Prüfling"</strong></li>
    <li>Füllen Sie das Formular aus</li>
</ol>

<div class="image-container">
    <img src="${images['06-pruefling-bearbeiten.png'] || ''}" alt="Prüfling bearbeiten">
    <div class="image-caption">Abb. 5: Prüfling-Formular mit allen Eingabefeldern</div>
</div>

<p>Das Formular enthält folgende Bereiche:</p>
<ul>
    <li><strong>Persönliche Daten:</strong> Anrede, Vorname, Nachname, Geburtsdatum, Geburtsort</li>
    <li><strong>Privatanschrift:</strong> Straße, Hausnummer, PLZ, Stadt, E-Mail, Handy</li>
    <li><strong>Ausbildungsbetrieb:</strong> Betrieb/Firma, Telefon, Straße, PLZ und Ort, Inhaber</li>
    <li><strong>Ausbildung & Prüfung:</strong> Prüfungsnummer, Lehrzeit, Prüfungsdaten, Wahlqualifikation</li>
</ul>

<h2>Prüfling pausieren/aktivieren</h2>

<p>Wenn ein Prüfling z.B. krank ist und später geprüft wird:</p>

<div class="image-container small">
    <img src="${images['05-status-pausieren.png'] || ''}" alt="Status pausieren">
    <div class="image-caption">Abb. 6: Pausieren-Button</div>
</div>

<ol>
    <li>Fahren Sie mit der Maus über den Prüfling</li>
    <li>Klicken Sie auf das <strong>orangene Pause-Symbol</strong></li>
    <li>Pausierte Prüflinge werden ausgegraut angezeigt</li>
</ol>

<h2>Prüfling löschen (nur Administrator)</h2>

<ol>
    <li>Klicken Sie auf das <strong>rote Papierkorb-Symbol</strong></li>
    <li>Geben Sie das <strong>Administrator-Passwort</strong> ein</li>
</ol>

<div class="hint danger">
    <strong>Wichtig:</strong>
    Das Mitarbeiter-Passwort funktioniert hier NICHT! Nur Administratoren können Prüflinge löschen.
</div>

<!-- KAPITEL 6: BENOTUNG -->
<h1 id="kap6">6. Benotung durchführen</h1>

<p>Klicken Sie in der Seitenleiste auf <strong>"Benotung"</strong>.</p>

<div class="image-container large">
    <img src="${images['09-benotung-arbeitsaufgaben.png'] || ''}" alt="Benotung Arbeitsaufgaben">
    <div class="image-caption">Abb. 7: Benotungsansicht mit Arbeitsaufgaben</div>
</div>

<h3>So tragen Sie Noten ein:</h3>
<ol>
    <li><strong>Prüfling auswählen:</strong> Links in der Liste auf den Namen klicken</li>
    <li><strong>Teil wählen:</strong> Oben zwischen "Teil 1" und "Teil 2" wechseln</li>
    <li><strong>Globale Prüfer:</strong> Klicken Sie auf "Gleiche Prüfungskommission" um dieselben Prüfer für alle Prüflinge zu verwenden</li>
    <li><strong>Punkte eintragen:</strong> Tragen Sie für jeden Prüfer die Punkte (0-100) ein</li>
</ol>

<h2>Zusammenfassung und PDF-Buttons</h2>

<div class="image-container small">
    <img src="${images['12-pdf-buttons.png'] || ''}" alt="PDF Buttons">
    <div class="image-caption">Abb. 8: Buttons zum Speichern und PDF-Download</div>
</div>

<ul>
    <li><strong>Benotung speichern:</strong> Speichert alle eingetragenen Punkte</li>
    <li><strong>Niederschrift Teil 1/2 (PDF):</strong> Erstellt das Prüfungsprotokoll</li>
    <li><strong>Gesamtniederschrift (PDF):</strong> Zusammenfassung beider Teile</li>
    <li><strong>Prüfungszeugnis (PDF):</strong> Das offizielle Zeugnis</li>
</ul>

<!-- KAPITEL 7: PDF-DOKUMENTE -->
<h1 id="kap7">7. PDF-Dokumente erstellen</h1>

<h2>Niederschrift (pro Teil)</h2>

<div class="image-container">
    <img src="${images['10-niederschrift-teil2-pdf.png'] || ''}" alt="Niederschrift Teil 2">
    <div class="image-caption">Abb. 9: Niederschrift Teil 2 der Gesellenprüfung</div>
</div>

<p>Die Niederschrift enthält:</p>
<ul>
    <li>Prüflingsdaten</li>
    <li>Alle Arbeitsaufgaben mit Punkten pro Prüfer</li>
    <li>Durchschnittswerte</li>
    <li>Gesamtergebnis mit Note</li>
</ul>

<h2>Gesamtniederschrift</h2>

<div class="image-container">
    <img src="${images['11-gesamtniederschrift-pdf.png'] || ''}" alt="Gesamtniederschrift">
    <div class="image-caption">Abb. 10: Gesamtniederschrift mit beiden Teilen</div>
</div>

<p>Die Gesamtniederschrift zeigt:</p>
<ul>
    <li>Teil 1 (25%) und Teil 2 (75%) zusammengefasst</li>
    <li>Gesamtpunkte</li>
    <li>Endgültige Note</li>
    <li>Bestanden/Nicht bestanden</li>
</ul>

<!-- KAPITEL 8: GESELLENBRIEFE -->
<h1 id="kap8">8. Gesellenbriefe erstellen</h1>

<p>Klicken Sie in der Seitenleiste auf <strong>"Gesellenbriefe"</strong>.</p>

<div class="image-container large">
    <img src="${images['16-gesellenbriefe-seite.png'] || ''}" alt="Gesellenbriefe Seite">
    <div class="image-caption">Abb. 11: Gesellenbriefe-Seite mit Vorschau</div>
</div>

<h3>Funktionen:</h3>
<ol>
    <li><strong>Datum festlegen:</strong> Oben links das Datum für den Gesellenbrief eintragen</li>
    <li><strong>Vorschau:</strong> Rechts sehen Sie eine Vorschau des Gesellenbriefs</li>
    <li><strong>Einzelner Brief:</strong> Klicken Sie bei einem Prüfling auf "PDF herunterladen"</li>
    <li><strong>Alle Briefe:</strong> Klicken Sie auf "Alle drucken" für alle bestandenen Prüflinge</li>
</ol>

<h2>Hintergrundbild einrichten</h2>

<p>In den Einstellungen können Sie ein eigenes Gesellenbrief-Design hochladen:</p>

<div class="image-container">
    <img src="${images['15-gesellenbrief-hintergrundbild.png'] || ''}" alt="Gesellenbrief Hintergrundbild">
    <div class="image-caption">Abb. 12: Hintergrundbild für Gesellenbriefe hochladen</div>
</div>

<!-- KAPITEL 9: EINSTELLUNGEN -->
<h1 id="kap9">9. Einstellungen (nur Administratoren)</h1>

<p>Klicken Sie in der Seitenleiste auf <strong>"Einstellungen"</strong>.</p>

<div class="hint warning">
    <strong>Hinweis:</strong>
    Dieser Menüpunkt ist NUR für Administratoren sichtbar!
</div>

<h2>Passwörter verwalten</h2>

<div class="image-container">
    <img src="${images['17-passwoerter-admin-mitarbeiter.png'] || ''}" alt="Passwörter">
    <div class="image-caption">Abb. 13: Verwaltung der Passwörter</div>
</div>

<p><strong>Administrator-Passwort:</strong></p>
<ul>
    <li>Wird für ALLE sicherheitsrelevanten Aktionen benötigt</li>
    <li>Kann hier geändert werden</li>
    <li>"Passwort ist gesetzt" zeigt an, dass ein Passwort existiert</li>
</ul>

<p><strong>Mitarbeiter-Passwort:</strong></p>
<ul>
    <li>Für Mitarbeiter mit eingeschränktem Zugriff</li>
    <li>Können Noten eintragen und Gesellenbriefe drucken</li>
    <li>Können KEINE Prüflinge löschen oder Einstellungen ändern</li>
</ul>

<h2>Prüferpool</h2>

<div class="image-container">
    <img src="${images['18-prueferpool.png'] || ''}" alt="Prüferpool">
    <div class="image-caption">Abb. 14: Prüferpool verwalten</div>
</div>

<p>Hier verwalten Sie alle Prüfer, die bei der Benotung zur Auswahl stehen:</p>
<ul>
    <li>Name des Prüfers</li>
    <li>Rolle (Vorsitzender, Prüfer, Beisitzer)</li>
    <li>Aktiv/Inaktiv Status</li>
</ul>

<h2>Innung / Prüfungsausschuss</h2>

<div class="image-container">
    <img src="${images['19-innung-einstellungen.png'] || ''}" alt="Innung Einstellungen">
    <div class="image-caption">Abb. 15: Innungsdaten und Logo</div>
</div>

<p>Tragen Sie hier die Daten Ihrer Innung ein:</p>
<ul>
    <li>Name der Innung</li>
    <li>Adresse</li>
    <li>Telefon und E-Mail</li>
    <li><strong>Innungs-Logo:</strong> Wird auf Gesamtniederschrift und Prüfungszeugnis angezeigt</li>
</ul>

<h2>Notenschlüssel (Passwortgeschützt!)</h2>

<div class="image-container small">
    <img src="${images['20-notenschluessel-gesperrt.png'] || ''}" alt="Notenschlüssel gesperrt">
    <div class="image-caption">Abb. 16: Notenschlüssel ist gesperrt</div>
</div>

<p>Der Notenschlüssel ist standardmäßig gesperrt. Um ihn zu bearbeiten:</p>
<ol>
    <li>Klicken Sie auf <strong>"Entsperren"</strong></li>
    <li>Geben Sie das <strong>Administrator-Passwort</strong> ein</li>
</ol>

<div class="image-container small">
    <img src="${images['21-notenschluessel-entsperrt.png'] || ''}" alt="Notenschlüssel entsperrt">
    <div class="image-caption">Abb. 17: Notenschlüssel nach Entsperrung</div>
</div>

<h2>Prüfungsstruktur (Passwortgeschützt!)</h2>

<div class="image-container">
    <img src="${images['22-pruefungsstruktur-gesperrt.png'] || ''}" alt="Prüfungsstruktur gesperrt">
    <div class="image-caption">Abb. 18: Prüfungsstruktur ist geschützt</div>
</div>

<p>Die Prüfungsstruktur ist ebenfalls geschützt:</p>
<ol>
    <li>Klicken Sie auf <strong>"Entsperren zum Bearbeiten"</strong></li>
    <li>Geben Sie das <strong>Administrator-Passwort</strong> ein</li>
</ol>

<div class="image-container">
    <img src="${images['23-pruefungsstruktur-entsperrt.png'] || ''}" alt="Prüfungsstruktur entsperrt">
    <div class="image-caption">Abb. 19: Prüfungsstruktur bearbeiten</div>
</div>

<p>Hier können Sie anpassen:</p>
<ul>
    <li>Gewichtung von Arbeitsaufgaben und Prüfungsstück</li>
    <li>Einzelne Aufgaben und deren Faktoren</li>
    <li>Maximalpunkte</li>
</ul>

<!-- KAPITEL 10: PASSWORTSCHUTZ -->
<h1 id="kap10">10. Passwortschutz verstehen</h1>

<h2>Was ist geschützt?</h2>

<p>Folgende Aktionen erfordern das <strong>Administrator-Passwort</strong>:</p>

<table>
    <tr>
        <th>Aktion</th>
        <th>Admin-Passwort erforderlich</th>
    </tr>
    <tr>
        <td>Prüfling löschen</td>
        <td>Ja</td>
    </tr>
    <tr>
        <td>Alle Prüflinge löschen</td>
        <td>Ja</td>
    </tr>
    <tr>
        <td>Jahrgang löschen</td>
        <td>Ja</td>
    </tr>
    <tr>
        <td>Notenschlüssel ändern</td>
        <td>Ja</td>
    </tr>
    <tr>
        <td>Prüfungsstruktur ändern</td>
        <td>Ja</td>
    </tr>
    <tr>
        <td>Jahrgang zurücksetzen</td>
        <td>Ja</td>
    </tr>
</table>

<h2>Wichtig: Mitarbeiter-Passwort reicht NICHT!</h2>

<p>Das Mitarbeiter-Passwort gewährt nur eingeschränkten Zugriff:</p>
<ul>
    <li>Noten eintragen</li>
    <li>Prüfer auswählen</li>
    <li>PDFs erstellen und drucken</li>
    <li>Gesellenbriefe erstellen</li>
</ul>

<div class="hint danger">
    <strong>Für alle Lösch- und Änderungsaktionen ist ausschließlich das Administrator-Passwort gültig.</strong>
</div>

<!-- KAPITEL 11: HÄUFIGE FRAGEN -->
<h1 id="kap11">11. Häufige Fragen</h1>

<h3>"Ich habe mein Passwort vergessen"</h3>
<p>Wenden Sie sich an den technischen Support. Es gibt ein Master-Passwort für Notfälle.</p>

<h3>"Ich sehe den Menüpunkt 'Einstellungen' nicht"</h3>
<p>Sie sind als Mitarbeiter angemeldet. Nur Administratoren sehen die Einstellungen.</p>

<h3>"Ich kann keine Prüflinge löschen"</h3>
<ul>
    <li>Als Mitarbeiter: Löschen ist nicht möglich</li>
    <li>Als Administrator: Sie müssen das Admin-Passwort eingeben</li>
</ul>

<h3>"Ich wurde automatisch abgemeldet"</h3>
<p>Das passiert nach 30 Minuten ohne Aktivität. Ihre Daten sind gespeichert.</p>

<h3>"Das PDF wird nicht heruntergeladen"</h3>
<ol>
    <li>Prüfen Sie die Browser-Downloads</li>
    <li>Erlauben Sie Pop-ups für diese Seite</li>
    <li>Versuchen Sie einen anderen Browser</li>
</ol>

<h3>"Wie sichere ich meine Daten?"</h3>
<ol>
    <li>Gehen Sie zu Einstellungen</li>
    <li>Klicken Sie auf "Daten exportieren"</li>
    <li>Speichern Sie die JSON-Datei sicher</li>
</ol>

<!-- KONTAKT -->
<h1 id="kontakt">Kontakt bei Problemen</h1>

<div class="no-break" style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
    <p style="font-size: 14pt; font-weight: bold; color: #0891b2; margin-bottom: 15px;">
        Landesinnungsverband des niedersächsischen Friseurhandwerks
    </p>
    <p style="margin: 5px 0;">
        Ricklinger Stadtweg 92<br>
        30459 Hannover
    </p>
    <p style="margin: 15px 0 5px 0;">
        <strong>Tel:</strong> 0511 / 42 72 31<br>
        <strong>Fax:</strong> 0511 / 42 25 73
    </p>
    <p style="margin: 15px 0 5px 0;">
        <strong>E-Mail:</strong> info@liv-friseure-nds.de<br>
        <strong>Website:</strong> www.friseure-nds.de
    </p>
</div>

<div style="text-align: center; margin-top: 60px; color: #94a3b8; font-size: 10pt;">
    <p>GP Digital v1.0 - Bedienungsanleitung</p>
    <p>Stand: Januar 2026</p>
</div>

</body>
</html>
`;

// HTML-Datei speichern
const htmlFile = path.join(__dirname, 'manual-temp.html');
fs.writeFileSync(htmlFile, htmlContent, 'utf8');
console.log(`\n✓ HTML-Datei erstellt: ${htmlFile}`);

// Anleitung für PDF-Erstellung
console.log(`
=====================================
PDF-ERSTELLUNG
=====================================

Die HTML-Datei wurde erstellt. Um sie als PDF zu speichern:

Option 1 - Im Browser:
1. Öffnen Sie die Datei im Browser:
   open "${htmlFile}"
2. Drücken Sie Cmd+P (Mac) oder Strg+P (Windows)
3. Wählen Sie "Als PDF speichern"
4. Speichern Sie als "GP-Digital-Bedienungsanleitung.pdf"

Option 2 - Mit Puppeteer (automatisch):
1. Installieren Sie Puppeteer:
   cd "${__dirname}"
   npm install puppeteer
2. Führen Sie das erweiterte Script aus:
   node generate-manual-pdf.js --puppeteer

=====================================
`);

// Puppeteer-Modus prüfen
if (process.argv.includes('--puppeteer')) {
    (async () => {
        try {
            const puppeteer = require('puppeteer');
            console.log('Starte Puppeteer...');

            const browser = await puppeteer.launch();
            const page = await browser.newPage();

            await page.goto(`file://${htmlFile}`, { waitUntil: 'networkidle0' });

            await page.pdf({
                path: OUTPUT_FILE,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '25mm',
                    left: '15mm'
                }
            });

            await browser.close();

            console.log(`✓ PDF erstellt: ${OUTPUT_FILE}`);

            // Temporäre HTML-Datei löschen
            fs.unlinkSync(htmlFile);

        } catch (error) {
            if (error.code === 'MODULE_NOT_FOUND') {
                console.log('Puppeteer nicht installiert. Bitte installieren mit:');
                console.log('  npm install puppeteer');
            } else {
                console.error('Fehler:', error.message);
            }
        }
    })();
}
