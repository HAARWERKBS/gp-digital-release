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

- **`src/lib/grading.ts`** - Grade calculation logic. German grading system (1-6 scale). Final grade: Teil 1 (25%) + Teil 2 (75%). Pass threshold: 50 points.

### Pages

- **LicensePage** (`src/pages/LicensePage.tsx`) - License activation before app use
- **WelcomePage** (`src/pages/WelcomePage.tsx`) - Login page with first-time setup flow
- **StudentsPage** (`src/pages/StudentsPage.tsx`) - Student management with list/grid views, Excel import/export, active/inactive status toggle. View mode persists in localStorage.
- **GradingPage** (`src/pages/GradingPage.tsx`) - Exam grading interface for Teil 1 and Teil 2, multiple examiners per student, PDF generation. Examiners can be selected from Prüferpool dropdown.
- **GesellenbriefePage** (`src/pages/GesellenbriefePage.tsx`) - Print journeyman certificates for passed students. Shows only students with ≥50 points. Supports serial printing (Seriendruck) and custom background images.
- **SettingsPage** (`src/pages/SettingsPage.tsx`) - Admin-only: Exam structure configuration, Innung settings with logo upload, grade scale, Prüferpool management, data backup/restore. Each section (Innung, Notenschlüssel, Prüfungsstruktur) has its own local save button that becomes active when changes are detected.

### PDF Components (`src/components/`)

- `GesellenbriefDocument.tsx` - Journeyman certificate with two modes: standard design (if no background) or overlay mode (name/salon/date placed on custom background image using configurable positions). Supports custom text fields with configurable position, font size, alignment, and bold styling.
- `CertificatePositionEditor.tsx` - Visual editor for positioning text fields on Gesellenbrief. Uses live PDF preview via `PDFViewer` to show exact output. Positions stored in mm, converted to pt using `MM_TO_PT = 2.83465`.
- `CustomTextFieldsEditor.tsx` - Editor for adding/managing custom text fields on certificates. Supports up to 10 fields with name, x/y position, font size (8-24pt), alignment (left/center/right), and bold option.
- `PruefungsZeugnis.tsx` - Official exam certificate with grades, Notenschlüssel, and optional Innung logo
- `ProtocolDocument.tsx` - Grading protocol per student (Niederschrift Teil 1/2)
- `GesamtNiederschrift.tsx` - Complete exam documentation with all Teil 1 & Teil 2 results on one page, BESTANDEN/NICHT BESTANDEN box, signature lines (Vorsitzende/r, 1. Prüfer/in, 2. Prüfer/in)
- `CertificateDocument.tsx` - Legacy certificate component
- `GesellenbriefSeriendruck.tsx` - Batch printing for multiple certificates

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

**Master Password**: `FriseurInnung2024!` (defined in `types.ts:MASTER_ADMIN_PASSWORD`) - always works for admin access.

## Domain-Specific Logic

### Exam Structure
- **Teil 1** (Part 1): 25% weight - 6 practical tasks + 1 exam piece (Prüfungsstück)
- **Teil 2** (Part 2): 75% weight - 6 practical tasks + 1 exam piece + 3 theory subjects
- Exam pieces (Prüfungsstück) can be toggled on/off via `sheet.pruefungsstueckEnabled` in Settings

### Grading Rules
- Points 0-100 per task
- Grade thresholds (configurable): 92+=1 (sehr gut), 81+=2 (gut), 67+=3 (befriedigend), 50+=4 (ausreichend), 30+=5 (mangelhaft), <30=6 (ungenügend)
- Work tasks (Arbeitsaufgaben) weighted 70%, exam piece 30%
- Theory: written×2 + oral×1 (oral grade optional)
- Examiner grades are averaged per task
- Multiple examiners (P1, P2, P3) per task supported

### Multi-Jahrgang System
Supports multiple exam cohorts (Sommer/Winter sessions, repeaters). Each Jahrgang has isolated student/grade data. Global settings (Innung, grade scale, Prüferpool) are shared across all Jahrgänge. Students can be moved between Jahrgänge (e.g., for "Nachprüfung") via `moveStudentToJahrgang()` - requires admin password.

### Prüferpool (Examiner Pool)
Central management of examiners with roles (Vorsitzender, Prüfer, Beisitzer). Examiners can be toggled active/inactive. In GradingPage, examiners are selected from dropdown instead of free text input when pool is populated.

## Electron Desktop App

### Structure
- **`electron/main.js`** - Main process: window management, IPC handlers for version check and external URLs
- **`electron/preload.js`** - Context bridge exposing `window.electronAPI` to React app
- **`src/electron.d.ts`** - TypeScript definitions for Electron API

### Update System
The app checks `version.json` from GitHub to notify users of available updates. The URL is configured in `electron/main.js:83`:
```
https://raw.githubusercontent.com/Hairschneider/gp-digital/main/version.json
```

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

- `HelpDialog.tsx` - In-app accordion-style help with 8 sections
- Accessible via "Hilfe" button in sidebar (below Feedback)
- Content mirrors `BEDIENUNGSANLEITUNG.md`

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
