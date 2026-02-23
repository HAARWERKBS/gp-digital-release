# GP Digital - Bedienungsanleitung

## Das Prüfungstool zur Abnahme der Gesellenprüfung Teil 1 und Teil 2

**Landesinnungsverband des niedersächsischen Friseurhandwerks**

---

## Inhaltsverzeichnis

1. [Installation & Erster Start](#1-installation--erster-start)
2. [Produktaktivierung (Lizenz)](#2-produktaktivierung-lizenz)
3. [Ersteinrichtung](#3-ersteinrichtung)
4. [Anmeldung](#4-anmeldung)
5. [Jahrgänge verwalten](#5-jahrgänge-verwalten)
6. [Prüflinge verwalten](#6-prüflinge-verwalten)
7. [Benotung durchführen](#7-benotung-durchführen)
8. [PDF-Dokumente erstellen](#8-pdf-dokumente-erstellen)
9. [Gesellenbriefe erstellen](#9-gesellenbriefe-erstellen)
10. [Einstellungen (nur Administratoren)](#10-einstellungen-nur-administratoren)
11. [Passwortschutz verstehen](#11-passwortschutz-verstehen)
12. [Häufige Fragen](#12-häufige-fragen)

---

## 1. Installation & Erster Start

### macOS (Apple)

1. Öffnen Sie die heruntergeladene **DMG-Datei** per Doppelklick
2. Ziehen Sie **GP Digital** in den **Programme**-Ordner
3. Beim **ersten Öffnen** erscheint eine Sicherheitswarnung:

> *„GP Digital" kann nicht geöffnet werden, da es von einem nicht verifizierten Entwickler stammt.*

**So lösen Sie das Problem:**

- **Variante 1 (empfohlen):** Klicken Sie mit der **rechten Maustaste** (oder Ctrl + Klick) auf die App → wählen Sie **„Öffnen"** → klicken Sie im Dialog auf **„Öffnen"**
- **Variante 2:** Gehen Sie zu **Systemeinstellungen → Datenschutz & Sicherheit** → scrollen Sie nach unten → klicken Sie bei der Meldung zu GP Digital auf **„Trotzdem öffnen"**

**Hinweis:** Diese Warnung erscheint nur beim allerersten Start. Danach öffnet sich die App ganz normal.

### Windows

1. Führen Sie die heruntergeladene **Setup-Datei** (`.exe`) per Doppelklick aus
2. Beim ersten Start erscheint möglicherweise eine **SmartScreen-Warnung**:

> *„Der Computer wurde durch Windows geschützt"*

**So lösen Sie das Problem:**

1. Klicken Sie auf **„Weitere Informationen"**
2. Klicken Sie auf **„Trotzdem ausführen"**

**Hinweis:** Diese Warnung erscheint, weil die Software neu ist und noch nicht von vielen Nutzern installiert wurde. Die App ist sicher – die Warnung verschwindet nach dem ersten Start.

---

## 2. Produktaktivierung (Lizenz)

Beim ersten Start der Software müssen Sie einen gültigen Lizenzschlüssel eingeben.

![Lizenzaktivierung](Anleitung-Bilder/01-lizenzaktivierung.png)

### So aktivieren Sie die Lizenz:

1. Geben Sie Ihren Lizenzschlüssel im Format **GPDIG-XXXX-XXXXX-XXXXX** ein
2. Der Schlüssel wird während der Eingabe automatisch formatiert
3. Wenn der Schlüssel vollständig ist, erscheint ein grüner Hinweis
4. Klicken Sie auf **"Lizenz aktivieren"**

**Hinweis:** Den Lizenzschlüssel haben Sie beim Kauf der Software erhalten. Bei Fragen wenden Sie sich an info@liv-friseure-nds.de.

### Lizenzmodelle

GP Digital bietet verschiedene Lizenzmodelle mit unterschiedlichen Laufzeiten:

| Lizenztyp | Beschreibung | Ablaufdatum |
|-----------|--------------|-------------|
| **Testlizenz** | Zeitlich begrenzte Lizenz zum Testen der Software | Läuft nach einem bestimmten Monat ab (z.B. April 2025) |
| **Jahreslizenz** | Lizenz für 12 Monate | Läuft nach einem Jahr ab |
| **Dauerlizenz** | Unbegrenzte Nutzung ohne Ablaufdatum | Läuft niemals ab |

### Ablaufdatum im Lizenzschlüssel

Das Ablaufdatum ist direkt im Lizenzschlüssel kodiert:

- **Zeitlich begrenzte Lizenzen:** Der zweite Teil des Schlüssels enthält das Ablaufdatum im Format YYMM (z.B. `2504` = April 2025)
- **Dauerlizenzen:** Enthalten `9999` und laufen niemals ab

**Beispiele:**
- `GPDIG-2504-XXXXX-XXXXX` → Gültig bis Ende April 2025
- `GPDIG-2612-XXXXX-XXXXX` → Gültig bis Ende Dezember 2026
- `GPDIG-9999-XXXXX-XXXXX` → Unbegrenzt gültig (Dauerlizenz)

### Lizenz-Ablauf-Warnung

- **14 Tage vor Ablauf:** Eine gelbe Warnleiste erscheint am oberen Bildschirmrand mit dem Hinweis, wie viele Tage noch verbleiben
- **Nach Ablauf:** Sie werden zur Lizenz-Eingabeseite weitergeleitet und müssen einen neuen Lizenzschlüssel eingeben

### Lizenz erneuern

Wenn Ihre Lizenz abgelaufen ist:

1. Sie sehen eine rote Meldung "Lizenz abgelaufen"
2. Geben Sie Ihren neuen Lizenzschlüssel ein
3. Klicken Sie auf **"Lizenz aktivieren"**

**Wichtig:** Ihre gespeicherten Daten (Prüflinge, Noten, Jahrgänge) bleiben erhalten und sind nach der Reaktivierung wieder verfügbar.

---

## 3. Ersteinrichtung

Wenn Sie die Software zum ersten Mal starten (nach der Lizenzaktivierung), müssen Sie ein Administrator-Passwort festlegen.

![Ersteinrichtung Passwort](Anleitung-Bilder/02-ersteinrichtung-passwort.png)

### So richten Sie das Admin-Passwort ein:

1. Geben Sie ein sicheres Passwort ein (mindestens 4 Zeichen)
2. Wiederholen Sie das Passwort zur Bestätigung
3. Klicken Sie auf **"Einrichtung abschließen"**

**Wichtig:** Merken Sie sich dieses Passwort gut! Es wird für alle sicherheitsrelevanten Aktionen benötigt.

---

## 4. Anmeldung

Nach der Ersteinrichtung sehen Sie bei jedem Start die Anmeldeseite.

### Zwei Benutzerrollen

| Rolle | Symbol | Berechtigungen |
|-------|--------|----------------|
| **Administrator** | Blaues Schild | **Voller Zugriff:** Prüflinge anlegen/bearbeiten/löschen, Noten eintragen, alle Einstellungen ändern |
| **Mitarbeiter** | Graues Symbol | **Eingeschränkt:** Noten eintragen, Gesellenbriefe drucken - aber KEINE Lösch- oder Einstellungsaktionen |

### So melden Sie sich an:

1. Geben Sie Ihr Passwort ein
2. Klicken Sie auf **"Anmelden"**
3. Das System erkennt automatisch, ob Sie Administrator oder Mitarbeiter sind

### Automatische Abmeldung

Aus Sicherheitsgründen werden Sie nach **30 Minuten ohne Aktivität** automatisch abgemeldet. 5 Minuten vorher erscheint eine Warnung.

---

## 5. Jahrgänge verwalten

![Jahrgang Dropdown](Anleitung-Bilder/04-jahrgang-dropdown.png)

Oben links unter dem Logo sehen Sie den aktuellen Jahrgang. Klicken Sie darauf, um:

- **Anderen Jahrgang auswählen:** Klicken Sie auf den gewünschten Jahrgang
- **Neuen Jahrgang erstellen:** Klicken Sie auf "+ Neuen Jahrgang anlegen"
- **Jahrgang umbenennen:** Klicken Sie auf das Stift-Symbol
- **Jahrgang duplizieren:** Klicken Sie auf das Kopier-Symbol
- **Jahrgang löschen:** Klicken Sie auf das Papierkorb-Symbol (erfordert Admin-Passwort!)

---

## 6. Prüflinge verwalten

Nach der Anmeldung sehen Sie die **Prüflinge-Seite** mit allen Prüflingen des aktuellen Jahrgangs.

### Leere Ansicht (ohne Prüflinge)

![Hauptansicht ohne Prüflinge](Anleitung-Bilder/03-hauptansicht-prueflinge-leer.png)

### Ansicht mit Prüflingen

![Prüflinge Liste](Anleitung-Bilder/07-prueflinge-liste.png)

### Neuen Prüfling anlegen (nur Administrator)

1. Klicken Sie auf den grünen Button **"+ Neuer Prüfling"**
2. Füllen Sie das Formular aus

![Prüfling bearbeiten](Anleitung-Bilder/06-pruefling-bearbeiten.png)

Das Formular enthält folgende Bereiche:
- **Persönliche Daten:** Anrede, Vorname, Nachname, Geburtsdatum, Geburtsort
- **Privatanschrift:** Straße, Hausnummer, PLZ, Stadt, E-Mail, Handy
- **Ausbildungsbetrieb:** Betrieb/Firma, Telefon, Straße, PLZ und Ort, Inhaber
- **Ausbildung & Prüfung:** Prüfungsnummer, Lehrzeit, Prüfungsdaten, Wahlqualifikation

3. Klicken Sie auf **"Speichern"**

### Prüfling pausieren/aktivieren

Wenn ein Prüfling z.B. krank ist und später geprüft wird:

![Status pausieren](Anleitung-Bilder/05-status-pausieren.png)

1. Fahren Sie mit der Maus über den Prüfling
2. Klicken Sie auf das **orangene Pause-Symbol**
3. Pausierte Prüflinge werden ausgegraut angezeigt

### Prüfling löschen (nur Administrator)

1. Klicken Sie auf das **rote Papierkorb-Symbol**
2. Geben Sie das **Administrator-Passwort** ein

**Wichtig:** Das Mitarbeiter-Passwort funktioniert hier NICHT!

### Excel-Import/-Export

- **Excel Export:** Exportiert alle Prüflinge als Excel-Datei
- **Excel Import:** Importiert Prüflinge aus einer Excel-Datei

### Prüfling in anderen Jahrgang verschieben (Nachprüfung)

Wenn ein Prüfling die Prüfung nicht bestanden hat und eine Nachprüfung absolvieren muss, können Sie ihn in einen anderen Jahrgang verschieben. So bleiben alle bereits eingetragenen Noten erhalten.

![Prüfling verschieben Button](Anleitung-Bilder/27-pruefling-verschieben-button.png)

**So verschieben Sie einen Prüfling:**

1. **Ziel-Jahrgang anlegen:** Erstellen Sie zunächst einen neuen Jahrgang (z.B. "Nachprüfung 2026")
2. **Zum Quell-Jahrgang wechseln:** Gehen Sie zum Jahrgang, in dem sich der Prüfling befindet
3. **Verschieben-Button:** Fahren Sie mit der Maus über den Prüfling und klicken Sie auf das **orangene Ordner-Symbol**

![Prüfling verschieben Dropdown](Anleitung-Bilder/28-pruefling-verschieben-dropdown.png)

4. **Ziel auswählen:** Wählen Sie den Ziel-Jahrgang aus dem Dropdown-Menü
5. **Passwort eingeben:** Geben Sie das **Administrator-Passwort** ein, um die Aktion zu bestätigen

**Hinweis:** Durchgefallene Prüflinge werden mit einem roten Warn-Symbol (⚠️) vor "Brief" gekennzeichnet. Beim Hover über das Symbol sehen Sie die erreichte Punktzahl.

**Wichtig:** Das Verschieben erfordert das Administrator-Passwort. Alle Noten des Prüflings werden mitverschoben.

---

## 7. Benotung durchführen

Klicken Sie in der Seitenleiste auf **"Benotung"**.

### Benotungsansicht

![Benotung Arbeitsaufgaben](Anleitung-Bilder/09-benotung-arbeitsaufgaben.png)

### So tragen Sie Noten ein:

1. **Prüfling auswählen:** Links in der Liste auf den Namen klicken
2. **Teil wählen:** Oben zwischen "Teil 1" und "Teil 2" wechseln
3. **Globale Prüfer:** Klicken Sie auf "Gleiche Prüfungskommission" um dieselben Prüfer für alle Prüflinge zu verwenden
4. **Punkte eintragen:** Tragen Sie für jeden Prüfer die Punkte (0-100) ein

### Zusammenfassung

![Benotung Zusammenfassung](Anleitung-Bilder/08-benotung-zusammenfassung.png)

Am Ende jedes Teils sehen Sie die Zusammenfassung mit:
- Summe der Arbeitsaufgaben
- Prüfungsstück
- Gesamtergebnis

### Speichern und PDFs erstellen

![PDF Buttons](Anleitung-Bilder/12-pdf-buttons.png)

- **Benotung speichern:** Speichert alle eingetragenen Punkte
- **Niederschrift Teil 1/2 (PDF):** Erstellt das Prüfungsprotokoll
- **Gesamtniederschrift (PDF):** Zusammenfassung beider Teile
- **Prüfungszeugnis (PDF):** Das offizielle Zeugnis

---

## 8. PDF-Dokumente erstellen

### Niederschrift (pro Teil)

![Niederschrift Teil 2](Anleitung-Bilder/10-niederschrift-teil2-pdf.png)

Die Niederschrift enthält:
- Prüflingsdaten
- Alle Arbeitsaufgaben mit Punkten pro Prüfer
- Durchschnittswerte
- Gesamtergebnis mit Note

### Gesamtniederschrift

![Gesamtniederschrift](Anleitung-Bilder/11-gesamtniederschrift-pdf.png)

Die Gesamtniederschrift zeigt:
- Teil 1 (25%) und Teil 2 (75%) zusammengefasst
- Gesamtpunkte
- Endgültige Note
- Bestanden/Nicht bestanden

---

## 9. Gesellenbriefe erstellen

Klicken Sie in der Seitenleiste auf **"Gesellenbriefe"**.

![Gesellenbriefe Seite](Anleitung-Bilder/16-gesellenbriefe-seite.png)

### Funktionen:

1. **Datum festlegen:** Oben links das Datum für den Gesellenbrief eintragen
2. **Vorschau:** Rechts sehen Sie eine Vorschau des Gesellenbriefs
3. **Einzelner Brief:** Klicken Sie bei einem Prüfling auf "PDF herunterladen"
4. **Alle Briefe:** Klicken Sie auf "Alle drucken" für alle bestandenen Prüflinge

### Hintergrundbild einrichten

In den Einstellungen können Sie ein eigenes Gesellenbrief-Design hochladen:

![Gesellenbrief Hintergrundbild](Anleitung-Bilder/15-gesellenbrief-hintergrundbild.png)

### Automatischer Gesellenbrief (ohne Hintergrundbild)

Wenn **kein** Hintergrundbild hinterlegt ist, wird automatisch ein Standard-Gesellenbrief mit professionellem Design erstellt. Dieser enthält:
- Innungslogo (falls hinterlegt)
- Name des Prüflings
- Ausbildungsbetrieb
- Ausstellungsdatum
- Dekorative Rahmen und Schriftgestaltung

### Individuelle Textfelder

![Individuelle Textfelder Übersicht](Anleitung-Bilder/24-individuelle-textfelder-uebersicht.png)

Sie können bis zu **7 individuelle Textfelder** auf dem Gesellenbrief platzieren. Dies ist besonders nützlich, wenn Sie ein eigenes Hintergrundbild verwenden und zusätzliche Informationen benötigen.

**Für jedes Textfeld können Sie einstellen:**

![Textfeld Editor Details](Anleitung-Bilder/25-textfeld-editor-details.png)

- **Bezeichnung:** Ein interner Name zur Identifikation
- **X-Position:** Horizontale Position in Millimetern (von links)
- **Y-Position:** Vertikale Position in Millimetern (von oben)
- **Schriftgröße:** 8 bis 24 Punkt
- **Ausrichtung:** Links, Zentriert oder Rechts
- **Fett:** Text fett darstellen

**So fügen Sie ein Textfeld hinzu:**

1. Gehen Sie zu **Einstellungen → Gesellenbrief-Design**
2. Klicken Sie auf **"Gesellenbrief-Positionen einrichten"**
3. Klicken Sie auf **"+ Feld hinzufügen"**
4. Passen Sie Position, Schriftgröße und Ausrichtung an
5. Die Vorschau zeigt sofort das Ergebnis

**Tipp:** Verwenden Sie die Live-Vorschau, um Name, Salon und Datum optimal an Ihren individuellen Gesellenbrief anzupassen.

---

## 10. Einstellungen (nur Administratoren)

Klicken Sie in der Seitenleiste auf **"Einstellungen"**.

**Hinweis:** Dieser Menüpunkt ist NUR für Administratoren sichtbar!

### Passwörter verwalten

![Passwörter Admin und Mitarbeiter](Anleitung-Bilder/17-passwoerter-admin-mitarbeiter.png)

**Administrator-Passwort:**
- Wird für ALLE sicherheitsrelevanten Aktionen benötigt
- Kann hier geändert werden
- "Passwort ist gesetzt" zeigt an, dass ein Passwort existiert

**Mitarbeiter-Passwort:**
- Für Mitarbeiter mit eingeschränktem Zugriff
- Können Noten eintragen und Gesellenbriefe drucken
- Können KEINE Prüflinge löschen oder Einstellungen ändern

### Prüferpool

![Prüferpool](Anleitung-Bilder/18-prueferpool.png)

Hier verwalten Sie alle Prüfer, die bei der Benotung zur Auswahl stehen:
- Name des Prüfers
- Rolle (Vorsitzender, Prüfer, Beisitzer)
- Aktiv/Inaktiv Status

### Innung / Prüfungsausschuss

![Innung Einstellungen](Anleitung-Bilder/19-innung-einstellungen.png)

Tragen Sie hier die Daten Ihrer Innung ein:
- Name der Innung
- Adresse
- Telefon und E-Mail
- **Innungs-Logo:** Wird auf Gesamtniederschrift und Prüfungszeugnis angezeigt

### Innungs-Logo hochladen

![Innungslogo hochladen](Anleitung-Bilder/13-innungslogo-hochladen.png)

1. Klicken Sie auf **"Logo hochladen"**
2. Wählen Sie eine PNG- oder JPG-Datei
3. Das Logo erscheint in der Vorschau

![Innungslogo Vorschau](Anleitung-Bilder/14-innungslogo-vorschau.png)

### Notenschlüssel (Passwortgeschützt!)

![Notenschlüssel gesperrt](Anleitung-Bilder/20-notenschluessel-gesperrt.png)

Der Notenschlüssel ist standardmäßig gesperrt. Um ihn zu bearbeiten:

1. Klicken Sie auf **"Entsperren"**
2. Geben Sie das **Administrator-Passwort** ein

![Notenschlüssel entsperrt](Anleitung-Bilder/21-notenschluessel-entsperrt.png)

Nach dem Entsperren können Sie die Punktegrenzen für jede Note anpassen.

### Prüfungsstruktur (Passwortgeschützt!)

![Prüfungsstruktur gesperrt](Anleitung-Bilder/22-pruefungsstruktur-gesperrt.png)

Die Prüfungsstruktur ist ebenfalls geschützt:

1. Klicken Sie auf **"Entsperren zum Bearbeiten"**
2. Geben Sie das **Administrator-Passwort** ein

![Prüfungsstruktur entsperrt](Anleitung-Bilder/23-pruefungsstruktur-entsperrt.png)

Hier können Sie anpassen:
- Gewichtung von Arbeitsaufgaben und Prüfungsstück
- Einzelne Aufgaben und deren Faktoren
- Maximalpunkte

---

## 11. Passwortschutz verstehen

### Was ist geschützt?

Folgende Aktionen erfordern das **Administrator-Passwort**:

| Aktion | Admin-Passwort erforderlich |
|--------|---------------------------|
| Prüfling löschen | Ja |
| Prüfling in anderen Jahrgang verschieben | Ja |
| Alle Prüflinge löschen | Ja |
| Jahrgang löschen | Ja |
| Notenschlüssel ändern | Ja |
| Prüfungsstruktur ändern | Ja |
| Jahrgang zurücksetzen | Ja |

### Wichtig: Mitarbeiter-Passwort reicht NICHT!

Das Mitarbeiter-Passwort gewährt nur eingeschränkten Zugriff:
- Noten eintragen
- Prüfer auswählen
- PDFs erstellen und drucken
- Gesellenbriefe erstellen

**Für alle Lösch- und Änderungsaktionen ist ausschließlich das Administrator-Passwort gültig.**

---

## 12. Häufige Fragen

### "Ich habe mein Passwort vergessen"

Wenden Sie sich an den technischen Support. Es gibt ein Master-Passwort für Notfälle.

### "Ich sehe den Menüpunkt 'Einstellungen' nicht"

Sie sind als Mitarbeiter angemeldet. Nur Administratoren sehen die Einstellungen.

### "Ich kann keine Prüflinge löschen"

- Als Mitarbeiter: Löschen ist nicht möglich
- Als Administrator: Sie müssen das Admin-Passwort eingeben

### "Ich wurde automatisch abgemeldet"

Das passiert nach 30 Minuten ohne Aktivität. Ihre Daten sind gespeichert.

### "Das PDF wird nicht heruntergeladen"

1. Prüfen Sie die Browser-Downloads
2. Erlauben Sie Pop-ups für diese Seite
3. Versuchen Sie einen anderen Browser

### "Wie sichere ich meine Daten?"

1. Gehen Sie zu Einstellungen
2. Klicken Sie auf "Daten exportieren"
3. Speichern Sie die JSON-Datei sicher

### "Meine Lizenz ist abgelaufen - sind meine Daten verloren?"

Nein! Ihre Daten (Prüflinge, Noten, Jahrgänge) bleiben vollständig erhalten. Nach Eingabe eines neuen gültigen Lizenzschlüssels haben Sie wieder Zugriff auf alle Daten.

### "Wie erkenne ich, wann meine Lizenz abläuft?"

- Eine gelbe Warnleiste erscheint **14 Tage vor Ablauf** am oberen Bildschirmrand
- Das genaue Ablaufdatum ist im Lizenzschlüssel kodiert (z.B. `2504` = Ende April 2025)
- Dauerlizenzen (`9999`) zeigen keine Warnung, da sie nicht ablaufen

### "Kann ich denselben Lizenzschlüssel erneut verwenden?"

Nein, nach Ablauf benötigen Sie einen neuen Lizenzschlüssel. Kontaktieren Sie den Support für eine Verlängerung oder ein Upgrade auf eine Dauerlizenz.

---

## Kontakt bei Problemen

**Landesinnungsverband des niedersächsischen Friseurhandwerks**

Ricklinger Stadtweg 92
30459 Hannover

Tel: 0511 / 42 72 31
Fax: 0511 / 42 25 73

E-Mail: info@liv-friseure-nds.de
Website: www.friseure-nds.de

---

*GP Digital v1.0 - Bedienungsanleitung*
*Stand: Januar 2026*
