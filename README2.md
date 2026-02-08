# GP Digital - Kurzanleitung Installation

## Voraussetzungen

**Node.js installieren** (falls noch nicht vorhanden):
1. https://nodejs.org/ öffnen
2. "LTS" Version herunterladen und installieren
3. Terminal öffnen, prüfen mit: `node --version`

## Installation & Start

1. **Projektordner auf den Mac kopieren** (USB-Stick, AirDrop, etc.)

2. **Terminal öffnen** (Spotlight → "Terminal")

3. **In den Ordner wechseln:**
   ```bash
   cd /Users/DEINNAME/Desktop/hair-grading-app
   ```
   (Oder Ordner ins Terminal ziehen)

4. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

5. **App starten:**
   ```bash
   npm run dev
   ```

6. **Browser öffnen:** http://localhost:5173

## Beenden

Im Terminal: **Ctrl + C**

## Daten

- Werden im Browser gespeichert (LocalStorage)
- Backup: Einstellungen → "Daten Exportieren"
