# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev              # Start Vite development server (http://localhost:5173)
npm run build            # Production build to dist/
npm run lint             # Run ESLint
npm run preview          # Preview production build

# Electron Desktop App
npm run electron:dev     # Run Electron with Vite dev server (opens DevTools)
npm run electron:build   # Build for current platform
npm run electron:build:mac   # Build macOS DMG + ZIP (universal)
npm run electron:build:win   # Build Windows NSIS installer + portable
npm run electron:build:linux # Build Linux AppImage + deb
```

## Tech Stack

- **React 19** with TypeScript
- **Vite 7** as build tool
- **Tailwind CSS 4** for styling
- **React Router DOM 7** for navigation
- **@react-pdf/renderer** for PDF generation
- **xlsx** for Excel import/export
- **lucide-react** for icons
- **Electron 40** for desktop app distribution

## Architecture Overview

### Application Purpose
German hairdresser apprentice examination grading app ("Gesellenprüfung Friseur"). Manages students across multiple exam cohorts (Jahrgänge), grades practical and theoretical exams, and generates official PDF documents.

### Data Flow & Storage
```
GlobalSettings (localStorage: hair_grading_app_global)
    ├── jahrgaenge[] (multiple exam cohorts)
    │   └── Jahrgang.data: AppData
    │       ├── students[]
    │       ├── sheets[] (exam structure)
    │       └── grades[]
    ├── innung (guild info - shared across all, includes logo)
    ├── gradeScale (grade thresholds - shared)
    ├── certificateBackgroundImage (for Gesellenbrief)
    ├── certificatePositions (name/salon/date positioning in mm)
    ├── customTextFields[] (custom text fields for Gesellenbrief)
    ├── prueferpool[] (examiner pool - shared)
    ├── adminPasswordHash (bcrypt hash for admin login)
    └── mitarbeiterPasswordHash (bcrypt hash for employee login)

AuthSession (localStorage: hair_grading_session)
    ├── isAuthenticated
    ├── role ('admin' | 'mitarbeiter')
    └── lastActivity (ISO timestamp for session timeout)

LicenseInfo (localStorage: gp_digital_license)
    ├── key (validated license key)
    └── activatedAt (ISO timestamp)
```

### Key Files

- **`src/lib/store.tsx`** - React Context-based state management with localStorage persistence. Handles data migrations via `DATA_VERSION`. All state changes go through `useStore()` hook.

- **`src/lib/types.ts`** - Core TypeScript types: `Student`, `Grade`, `GradingSheet`, `Jahrgang`, `GlobalSettings`, `CertificatePositions`. Contains `INITIAL_DATA` with default exam structure and `DEFAULT_CERTIFICATE_POSITIONS`.

- **`src/lib/grading.ts`** - Grade calculation logic (GPO-konform). Key functions: `calculatePart2Total()` (Praxis×0.6 + Theorie×0.4), `calculateTheoryTotal()` / `calculateTheorySubjectPercent()` (schriftl.×2 + mündl.×1), `isPassed()` (Gesamtnote + Sperrfach-Prüfung), `calculateFinalResult()` (Teil 1×0.25 + Teil 2×0.75).
- **`src/lib/exportUtils.ts`** - Multi-Sheet Excel Export utilities. `calculateStudentResults()` computes full exam results per student (mirrors GradingPage logic). Sheet builders: `buildStammdatenRows()` (demographics, reimport-compatible), `buildErgebnisseRows()` (grade overview), `buildDetailRows()` (per-examiner scores). Helpers: `getAvgScore()`, `getExamPieceAvg()`, `round2()`.

### Pages

- **LicensePage** (`src/pages/LicensePage.tsx`) - License activation before app use
- **WelcomePage** (`src/pages/WelcomePage.tsx`) - Login page with first-time setup flow
- **StudentsPage** (`src/pages/StudentsPage.tsx`) - Student management with list/grid views, Multi-Sheet Excel export (3 Blätter: Stammdaten, Ergebnisse, Detail-Bewertung), Excel import, active/inactive status toggle. View mode persists in localStorage. Export filename: `Pruefungsergebnisse_Export_YYYY-MM-DD.xlsx`.
- **GradingPage** (`src/pages/GradingPage.tsx`) - Exam grading interface for Teil 1 and Teil 2, multiple examiners per student, PDF generation. Examiners can be selected from Prüferpool dropdown.
- **GesellenbriefePage** (`src/pages/GesellenbriefePage.tsx`) - Print journeyman certificates for passed students. Filters using `isPassed()` (Gesamtnote + Sperrfach-Prüfung). Supports serial printing (Seriendruck) and custom background images.
**Routing**: Uses `HashRouter` (not `BrowserRouter`) for Electron `file://` compatibility.

**Sorting**: All student lists are sorted by `examNumber` (Prüfungsnummer, numeric-first with string fallback). This applies consistently across StudentsPage (grid + list), GradingPage (sidebar), and GesellenbriefePage.

- **SettingsPage** (`src/pages/SettingsPage.tsx`) - Admin-only: Exam structure configuration, Innung settings with logo upload, grade scale, Prüferpool management, data backup/restore. Each section (Innung, Notenschlüssel, Prüfungsstruktur) has its own local save button that becomes active when changes are detected.

### PDF Components (`src/components/`)

- `GesellenbriefDocument.tsx` - Journeyman certificate with two modes: standard design (if no background) or overlay mode (name/salon/date placed on custom background image using configurable positions). Supports custom text fields with configurable position, font size, alignment, and bold styling.
- `CertificatePositionEditor.tsx` - Visual editor for positioning text fields on Gesellenbrief. Uses live PDF preview via `PDFViewer` to show exact output. Positions stored in mm, converted to pt using `MM_TO_PT = 2.83465`.
- `CustomTextFieldsEditor.tsx` - Editor for adding/managing custom text fields on certificates. Supports up to 10 fields with name, x/y position, font size (8-24pt), alignment (left/center/right), and bold option.
- `PruefungsZeugnis.tsx` - Official exam certificate with grades, Notenschlüssel, and optional Innung logo
- `ProtocolDocument.tsx` - Grading protocol per student (Niederschrift Teil 1/2)
- `GesamtNiederschrift.tsx` - Complete exam documentation with all Teil 1 & Teil 2 results on one page, BESTANDEN/NICHT BESTANDEN box, signature lines (Vorsitzende/r, 1. Prüfer/in, 2. Prüfer/in)
- `CertificateDocument.tsx` - Legacy certificate component
- `AnlageBescheinigung.tsx` - Attachment certificate (Anlage zur Bescheinigung)

PDF generation uses `@react-pdf/renderer` with `StyleSheet.create()` for styling. Points display uses `.toFixed(2)` for precision. Innung logo appears in header when configured.

### Security & Authentication

**Dual-Role System** (in `store.tsx`):
- **Admin**: Full access to all features including settings and destructive actions
- **Mitarbeiter**: Limited access - can view and edit grades, but cannot delete students or modify settings

**Session Management**:
- 30-minute session timeout with 5-minute warning
- Sessions persist in localStorage (`hair_grading_session`)
- Activity tracking resets timeout on user interaction

**Components**:
- `LicenseRoute.tsx` - Route guard checking license activation
- `ProtectedRoute.tsx` - Route guard checking authentication and role permissions
- `PasswordDialog.tsx` - Re-authentication for destructive actions

**Master Password System** (for developer/support emergency access):
- **Format**: `GPDM-XXXXX-XXXXX` – algorithmically validated (like license keys), one-time use
- **Validation**: `validateMasterPassword()` in `types.ts` – checks format + checksum using secret seed
- **One-time enforcement**: Used passwords stored in `~/Library/Application Support/GP Digital/used-master-passwords.json` via Electron IPC (survives localStorage reset). Browser fallback: localStorage key `gp_used_master_passwords`.
- **Legacy**: `FriseurInnung2024!` (`LEGACY_MASTER_PASSWORD` in `types.ts`) still accepted for backwards compatibility
- **Generator tools**: `node generate-master-password.js` (CLI) or `master-passwort-generator.html` (browser)
- **Login flow**: `login()` in `store.tsx` is `async` (returns `Promise`) due to Electron IPC for one-time check

## Domain-Specific Logic

### Exam Structure
- **Teil 1** (Part 1): 25% weight - 6 practical tasks + 1 exam piece (Prüfungsstück)
- **Teil 2** (Part 2): 75% weight - 6 practical tasks + 1 exam piece + 3 theory subjects
- Exam pieces (Prüfungsstück) can be toggled on/off via `sheet.pruefungsstueckEnabled` in Settings

### Grading Rules (GPO-konform)
- Points 0-100 per task
- Grade thresholds (configurable): 92+=1 (sehr gut), 81+=2 (gut), 67+=3 (befriedigend), 50+=4 (ausreichend), 30+=5 (mangelhaft), <30=6 (ungenügend)
- Praxis: Arbeitsaufgaben × 0.7 + Prüfungsstück × 0.3
- Theory per subject: (written × 2 + oral × 1) / 3; without oral: written × 2 / 2 (Excel: `=(2*I107+I108)/IF(H108>0,3,2)`)
- **Teil 2 = Praxis × 0.6 + Theorie × 0.4** (Excel K116: `=PRODUCT(D116,0.6)+PRODUCT(K114,0.4)`)
- **Gesamt = Teil 1 × 0.25 + Teil 2 × 0.75**
- Multiple examiners (P1, P2, P3) per task, grades averaged

### Bestanden-Logik (Pass/Fail)
Implemented in `isPassed()` (`grading.ts`), returns `{ passed: boolean; failReasons: string[] }`.

**Bestanden wenn:**
1. Gesamtnote ≤ 4 (mindestens „ausreichend", d.h. ≥ 50%)
2. Kein Prüfungsbereich mit Note 6 (Sperrfach-Regel)

**Prüfungsbereiche für Sperrfach-Check:**
- Teil 1 Gesamt
- Teil 2 Praxis (Friseur- und Kosmetikdienstleistungen)
- Teil 2 Theorie: Friseurtechniken
- Teil 2 Theorie: Betriebsorganisation
- Teil 2 Theorie: WiSo

**Quellen:** Prüfungsrechner R.Fuhs 1.22, GP Software 2024.xlsm, Mail Sebastian Kunde/LIV Niedersachsen (16.06.2023)

### Multi-Jahrgang System
Supports multiple exam cohorts (Sommer/Winter sessions, repeaters). Each Jahrgang has isolated student/grade data. Global settings (Innung, grade scale, Prüferpool) are shared across all Jahrgänge. Students can be moved between Jahrgänge (e.g., for "Nachprüfung") via `moveStudentToJahrgang()` - requires admin password.

### Prüferpool (Examiner Pool)
Central management of examiners with roles (Vorsitzender, Prüfer, Beisitzer). Examiners can be toggled active/inactive. In GradingPage, examiners are selected from dropdown instead of free text input when pool is populated.

## Electron Desktop App

### Structure
- **`electron/main.cjs`** - Main process: window management, IPC handlers for version check, external URLs, and used master password persistence
- **`electron/preload.cjs`** - Context bridge exposing `window.electronAPI` to React app
- **`src/electron.d.ts`** - TypeScript definitions for Electron API

### Update System
The app checks `public/version.json` from the **production repo** to notify users of available updates:
```
https://raw.githubusercontent.com/HAARWERKBS/gp-digital-release/main/public/version.json
```

**URL Fallback Mechanism** (future-proof for repo/account changes):
1. App first checks for a saved redirect URL in `app.getPath('userData')/update-url.json`
2. If `version.json` contains a non-empty `updateUrl` field → saves it for future checks
3. If saved URL fails → falls back to the hardcoded default URL above
4. This allows seamless migration to a new GitHub account/domain without breaking existing installs

### Two-Repo Workflow
```bash
git remote -v
# origin      → HAARWERKBS/GP-Digital (development + testing)
# production  → HAARWERKBS/gp-digital-release (public releases)

git push              # Push to dev repo (normal development)
git push production main  # Push stable release to production repo
```
The production repo serves `version.json` and GitHub Releases for end-user downloads.

### Building & Releases
GitHub Actions workflow (`.github/workflows/build.yml`) builds for macOS and Windows on tag push (`v*`). Artifacts go to `release/` folder.

Required icons in `public/`: `icon.png` (512x512), `icon.icns` (macOS), `icon.ico` (Windows).

## License System

**Route Guard**: `LicenseRoute.tsx` checks license before any page access.

**License Key Format**: `GPDIG-YYMM-XXXXX-XXXXX` (23 characters)
- YYMM = expiry date (e.g., 2612 = Dec 2026), 9999 = permanent
- Checksum validation in `src/lib/types.ts` (`validateLicenseKey()`)
- Stored in localStorage: `gp_digital_license`
- Generator tool: `node generate-license.js` or `lizenz-generator.html`

**Pages**:
- `LicensePage.tsx` - License activation (auto-formats input)
- Redirects to `/welcome` after successful activation

## Help System

- `HelpDialog.tsx` - In-app accordion-style help with 8 sections (default: Lizenz expanded)
- Accessible via "Hilfe" button in sidebar (below Feedback)
- Content mirrors `BEDIENUNGSANLEITUNG.md` (Installation section only in .md/.html, not in-app – user already installed)

## Data Versioning

`DATA_VERSION` in `store.tsx` handles migrations. Increment when modifying `AppData` schema to trigger automatic data migration.

## Language

All UI text, comments, and variable names use German. Keep this consistent when adding new features. Examples: Prüfling (student), Jahrgang (cohort), Gesellenbrief (journeyman certificate), Prüfer (examiner), Innung (guild).

## Important Implementation Notes

### State Persistence Patterns
When components have local state that syncs with global store:
1. Use `useRef` to track the last known store value
2. Compare JSON-serialized values to detect external changes
3. Only sync from store when component hasn't made changes (`!hasChanges`)
4. Reset ref after saving to store

Example pattern (from SettingsPage):
```typescript
const lastStoreInnungRef = React.useRef<string>(JSON.stringify(data.innung));

useEffect(() => {
    const currentStoreInnung = JSON.stringify(data.innung);
    if (!innungHasChanges && currentStoreInnung !== lastStoreInnungRef.current) {
        setInnungLocal(data.innung || DEFAULT_INNUNG);
        lastStoreInnungRef.current = currentStoreInnung;
    }
}, [data.innung, innungHasChanges]);
```

### PDF Unit Conversion
- All user-facing positions are in **millimeters (mm)**
- PDF rendering uses **points (pt)**
- Conversion: `MM_TO_PT = 2.83465` (defined in GesellenbriefDocument.tsx)
- A4 page: 210mm × 297mm = 595.28pt × 841.89pt

### Gesellenbrief Custom Text Fields
Custom text fields use absolute positioning:
- `field.x` is always the left edge in mm
- `field.align` controls text alignment within the field
- Font sizes range 8-24pt
- Fields are rendered on top of background image when present
