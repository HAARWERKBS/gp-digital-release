const puppeteer = require('puppeteer');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'anleitung-bilder');
const BASE_URL = 'http://localhost:5173';
const LICENSE_KEY = 'GPDIG-9999-RQVDX-N7TKE';
const MASTER_PASSWORD = 'FriseurInnung2024!';
const ADMIN_PASSWORD = 'Admin2024';

const VIEWPORT = { width: 1280, height: 800 };

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function screenshot(page, name, fullPage = false) {
    const filepath = path.join(SCREENSHOT_DIR, name);
    await page.screenshot({ path: filepath, fullPage, type: 'png' });
    console.log(`  ✅ ${name}`);
}

async function clearAndType(page, selector, text) {
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type(selector, text, { delay: 10 });
}

async function run() {
    console.log('🚀 Starte Screenshot-Automation...\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: VIEWPORT
    });

    const page = await browser.newPage();

    // ============================================
    // PHASE 1: Lizenz-Screenshots
    // ============================================
    console.log('📸 Phase 1: Lizenz-Screenshots');

    // Clear all state for fresh start
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    await sleep(1000);

    // Screenshot 01: Lizenzseite leer
    await screenshot(page, '01_lizenz_eingabe.png');

    // Type license key
    const licenseInput = await page.waitForSelector('input[placeholder*="GPDIG"]', { timeout: 5000 });
    await licenseInput.type(LICENSE_KEY, { delay: 30 });
    await sleep(500);

    // Screenshot 02: Lizenz eingegeben
    await screenshot(page, '02_lizenz_gueltig.png');

    // Click "Lizenz aktivieren"
    const activateBtn = await page.waitForSelector('button', { timeout: 5000 });
    const buttons = await page.$$('button');
    for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('aktivieren')) {
            await btn.click();
            break;
        }
    }
    await sleep(2000);

    // ============================================
    // PHASE 2: Ersteinrichtung & Anmeldung
    // ============================================
    console.log('📸 Phase 2: Anmeldung & Rollen');

    // Screenshot 03: Ersteinrichtung (first-time setup)
    await screenshot(page, '03_ersteinrichtung.png');

    // Set admin password
    const passwordInputs = await page.$$('input[type="password"]');
    if (passwordInputs.length >= 2) {
        await passwordInputs[0].type(ADMIN_PASSWORD, { delay: 10 });
        await passwordInputs[1].type(ADMIN_PASSWORD, { delay: 10 });
    }

    // Click setup button
    const setupButtons = await page.$$('button');
    for (const btn of setupButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('Passwort festlegen') || text.includes('Einrichten') || text.includes('Weiter')) {
            await btn.click();
            break;
        }
    }
    await sleep(2000);

    // Check if we need to navigate to welcome after setup
    const currentUrl = page.url();
    if (currentUrl.includes('/welcome') || currentUrl.includes('/')) {
        // We may be logged in automatically or need to login
    }

    // Now logout to get login screen
    await page.evaluate(() => {
        localStorage.removeItem('hair_grading_session');
    });
    await page.goto(BASE_URL + '/#/welcome', { waitUntil: 'networkidle0' });
    await sleep(1000);

    // Screenshot 04: Anmeldung
    await screenshot(page, '04_anmeldung.png');

    // Screenshot 05: Zoom on roles (same page, we'll crop later or just use same)
    await screenshot(page, '05_anmeldung_rollen.png');

    // Login as Admin
    const loginPasswordField = await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    await loginPasswordField.type(ADMIN_PASSWORD, { delay: 10 });

    const loginButtons = await page.$$('button');
    for (const btn of loginButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('Anmelden')) {
            await btn.click();
            break;
        }
    }
    await sleep(2000);

    // ============================================
    // PHASE 3: Testdaten anlegen
    // ============================================
    console.log('📝 Phase 3: Testdaten anlegen...');

    // Inject test data via localStorage manipulation
    await page.evaluate(() => {
        const globalDataStr = localStorage.getItem('hair_grading_app_global');
        if (!globalDataStr) return 'no global data';
        const globalData = JSON.parse(globalDataStr);
        const jahrgang = globalData.jahrgaenge[0];
        if (!jahrgang) return 'no jahrgang';

        // Add Prüfer to pool
        globalData.prueferpool = [
            { id: 'p1', name: 'Dr. Hans Meier', role: 'Vorsitzender', isActive: true },
            { id: 'p2', name: 'Sabine Krause', role: 'Prüfer', isActive: true },
            { id: 'p3', name: 'Thomas Braun', role: 'Prüfer', isActive: true },
            { id: 'p4', name: 'Claudia Winter', role: 'Beisitzer', isActive: true },
            { id: 'p5', name: 'Michael Richter', role: 'Prüfer', isActive: false }
        ];

        // Add Innung info
        globalData.innung = {
            ...globalData.innung,
            name: 'Landesinnungsverband des niedersächsischen Friseurhandwerks',
            street: 'Ricklinger Stadtweg 92',
            zipCity: '30459 Hannover',
            phone: '0511 / 42 72 31',
            email: 'info@liv-friseure-nds.de',
            logo: ''
        };

        // Create 5 students
        const students = [
            {
                id: 's1', firstName: 'Anna', lastName: 'Schneider', gender: 'Frau',
                dob: '15.03.1999', birthPlace: 'Hannover', birthCountry: 'Deutschland',
                street: 'Musterstr.', houseNumber: '12', zip: '30159', city: 'Hannover',
                email: 'anna@test.de', mobile: '0170-1234567',
                company: 'Haarstudio Eleganz', companyPhone: '0511-9876543',
                companyStreet: 'Bahnhofstr. 5', companyZipCity: '30159 Hannover',
                companyOwner: 'Maria Eleganz',
                examNumber: '1001', trainingStart: '01.08.2021', trainingEnd: '31.07.2024',
                examDate1: '15.03.2023', examDate2: '20.06.2024',
                elective: 'Kosmetik',
                isActive: true
            },
            {
                id: 's2', firstName: 'Maximilian', lastName: 'Weber', gender: 'Herr',
                dob: '22.07.2000', birthPlace: 'Braunschweig', birthCountry: 'Deutschland',
                street: 'Hauptstr.', houseNumber: '45', zip: '38100', city: 'Braunschweig',
                email: 'max@test.de', mobile: '0171-2345678',
                company: 'Friseur Fischer', companyPhone: '0531-1234567',
                companyStreet: 'Marktplatz 3', companyZipCity: '38100 Braunschweig',
                companyOwner: 'Peter Fischer',
                examNumber: '1002', trainingStart: '01.08.2021', trainingEnd: '31.07.2024',
                examDate1: '15.03.2023', examDate2: '20.06.2024',
                elective: 'Coloration',
                isActive: true
            },
            {
                id: 's3', firstName: 'Sophie', lastName: 'Müller', gender: 'Frau',
                dob: '10.11.1998', birthPlace: 'Oldenburg', birthCountry: 'Deutschland',
                street: 'Gartenweg', houseNumber: '8', zip: '26122', city: 'Oldenburg',
                email: 'sophie@test.de', mobile: '0172-3456789',
                company: 'Schnittwerk', companyPhone: '0441-9876543',
                companyStreet: 'Lange Str. 22', companyZipCity: '26122 Oldenburg',
                companyOwner: 'Julia Schnitt',
                examNumber: '1003', trainingStart: '01.08.2021', trainingEnd: '31.07.2024',
                examDate1: '15.03.2023', examDate2: '20.06.2024',
                elective: 'Langhaarfrisuren',
                isActive: true
            },
            {
                id: 's4', firstName: 'Leon', lastName: 'Schmidt', gender: 'Herr',
                dob: '05.01.2001', birthPlace: 'Osnabrück', birthCountry: 'Deutschland',
                street: 'Waldstr.', houseNumber: '17', zip: '49074', city: 'Osnabrück',
                email: 'leon@test.de', mobile: '0173-4567890',
                company: 'Barber Bros', companyPhone: '0541-5678901',
                companyStreet: 'Neumarkt 11', companyZipCity: '49074 Osnabrück',
                companyOwner: 'Kai Barber',
                examNumber: '1004', trainingStart: '01.08.2022', trainingEnd: '31.07.2025',
                examDate1: '15.03.2024', examDate2: '',
                elective: 'Haarersatz',
                isActive: true
            },
            {
                id: 's5', firstName: 'Emma', lastName: 'Hoffmann', gender: 'Frau',
                dob: '28.09.2000', birthPlace: 'Göttingen', birthCountry: 'Deutschland',
                street: 'Rosenweg', houseNumber: '3', zip: '37073', city: 'Göttingen',
                email: 'emma@test.de', mobile: '0174-5678901',
                company: 'Traumhaar', companyPhone: '0551-2345678',
                companyStreet: 'Weender Str. 44', companyZipCity: '37073 Göttingen',
                companyOwner: 'Lisa Traum',
                examNumber: '1005', trainingStart: '01.08.2021', trainingEnd: '31.07.2024',
                examDate1: '15.03.2023', examDate2: '20.06.2024',
                elective: 'Nageldesign/-modelage',
                isActive: false  // Pausiert
            }
        ];

        jahrgang.data.students = students;

        // Create grading sheets (Teil 1 and Teil 2)
        // Keep existing sheets or create default ones
        if (!jahrgang.data.sheets || jahrgang.data.sheets.length === 0) {
            // Use default sheets from INITIAL_DATA structure
        }
        const sheets = jahrgang.data.sheets;
        const teil1Sheet = sheets.find(s => s.part === 1);
        const teil2Sheet = sheets.find(s => s.part === 2);

        // Generate grades for students 1-3 (both parts), student 4 (only Teil 1)
        const examiners = ['Dr. Hans Meier', 'Sabine Krause', 'Thomas Braun'];

        function makeGrade(studentId, sheetId, part, scores) {
            const grade = {
                studentId,
                sheetId,
                examiners: examiners.map(name => ({ name })),
                examPieceExaminers: examiners.map(name => ({ name })),
                scores: {},
                examPieceScores: {}
            };

            // Work task scores
            const tasks = part === 1
                ? ['task1', 'task2', 'task3', 'task4', 'task5', 'task6']
                : ['task1', 'task2', 'task3', 'task4', 'task5', 'task6'];

            // Get actual task IDs from the sheet
            const sheet = sheets.find(s => s.id === sheetId);
            if (sheet && sheet.tasks) {
                sheet.tasks.forEach((task, idx) => {
                    grade.scores[task.id] = {};
                    examiners.forEach((ex, exIdx) => {
                        grade.scores[task.id][exIdx] = scores.tasks[idx] ? scores.tasks[idx][exIdx] : 75;
                    });
                });
            }

            // Exam piece scores
            examiners.forEach((ex, exIdx) => {
                grade.examPieceScores[exIdx] = scores.examPiece[exIdx];
            });

            // Theory scores (only for Teil 2)
            if (part === 2 && sheet && sheet.theorySubjects) {
                grade.theoryScores = {};
                sheet.theorySubjects.forEach((subj, idx) => {
                    grade.theoryScores[subj.id] = {
                        written: scores.theory[idx] ? scores.theory[idx].written : 70,
                        oral: scores.theory[idx] ? scores.theory[idx].oral : null
                    };
                });
            }

            return grade;
        }

        const grades = [];

        if (teil1Sheet) {
            // Student 1 (Anna) - Gold candidate: high scores
            grades.push(makeGrade('s1', teil1Sheet.id, 1, {
                tasks: [[95,92,94],[90,88,92],[93,95,91],[96,94,95],[88,90,92],[91,93,90]],
                examPiece: [94,92,95]
            }));
            // Student 2 (Max) - Silver candidate: good scores
            grades.push(makeGrade('s2', teil1Sheet.id, 1, {
                tasks: [[85,88,82],[80,84,86],[87,83,85],[90,88,86],[82,80,84],[84,86,82]],
                examPiece: [86,84,88]
            }));
            // Student 3 (Sophie) - Bronze candidate: ok scores
            grades.push(makeGrade('s3', teil1Sheet.id, 1, {
                tasks: [[78,75,80],[72,76,74],[79,77,75],[82,78,80],[74,76,72],[76,78,74]],
                examPiece: [78,76,80]
            }));
            // Student 4 (Leon) - Only Teil 1, lower scores
            grades.push(makeGrade('s4', teil1Sheet.id, 1, {
                tasks: [[65,68,62],[60,64,66],[67,63,65],[70,68,66],[62,60,64],[64,66,62]],
                examPiece: [66,64,68]
            }));
        }

        if (teil2Sheet) {
            // Student 1 (Anna) - Gold: very high
            grades.push(makeGrade('s1', teil2Sheet.id, 2, {
                tasks: [[96,94,95],[92,90,94],[95,93,96],[94,96,92],[90,92,88],[93,95,91]],
                examPiece: [95,93,96],
                theory: [{ written: 92, oral: null }, { written: 88, oral: 92 }, { written: 85, oral: null }]
            }));
            // Student 2 (Max) - Silver: good
            grades.push(makeGrade('s2', teil2Sheet.id, 2, {
                tasks: [[86,84,88],[82,80,84],[88,86,84],[84,86,82],[80,82,78],[84,86,82]],
                examPiece: [87,85,89],
                theory: [{ written: 82, oral: null }, { written: 78, oral: 82 }, { written: 75, oral: null }]
            }));
            // Student 3 (Sophie) - Bronze: ok
            grades.push(makeGrade('s3', teil2Sheet.id, 2, {
                tasks: [[76,78,74],[72,70,74],[78,76,74],[80,76,78],[70,72,68],[74,76,72]],
                examPiece: [77,75,79],
                theory: [{ written: 74, oral: null }, { written: 70, oral: 75 }, { written: 68, oral: null }]
            }));
        }

        jahrgang.data.grades = grades;

        // Create a second Jahrgang for "verschieben" demo
        if (globalData.jahrgaenge.length === 1) {
            const newJahrgang = {
                id: 'j2',
                name: 'Nachprüfung 2026',
                data: {
                    students: [],
                    grades: [],
                    sheets: JSON.parse(JSON.stringify(jahrgang.data.sheets)),
                    _version: 4
                }
            };
            globalData.jahrgaenge.push(newJahrgang);
        }

        localStorage.setItem('hair_grading_app_global', JSON.stringify(globalData));
        return 'Test data injected: 5 students, grades for 4, prüferpool, 2 jahrgänge';
    });

    // Reload to pick up new data
    await page.reload({ waitUntil: 'networkidle0' });
    await sleep(1000);

    // We might need to login again after reload
    const pageUrl = page.url();
    if (pageUrl.includes('/welcome') || pageUrl.includes('/license')) {
        // Login
        const pwInput = await page.waitForSelector('input[type="password"]', { timeout: 5000 });
        await pwInput.type(ADMIN_PASSWORD, { delay: 10 });
        const allBtns = await page.$$('button');
        for (const btn of allBtns) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Anmelden')) {
                await btn.click();
                break;
            }
        }
        await sleep(2000);
    }

    // ============================================
    // PHASE 4: Prüflinge-Screenshots
    // ============================================
    console.log('📸 Phase 4: Prüflinge-Screenshots');

    await page.goto(BASE_URL + '/#/', { waitUntil: 'networkidle0' });
    await sleep(1500);

    // Screenshot 06: Grid view
    await screenshot(page, '06_prueflinge_grid.png');

    // Switch to list view
    const listViewBtn = await page.$('button[title*="Liste"], button:has(svg.lucide-list)');
    if (!listViewBtn) {
        // Try finding list icon button by position - it's the second view toggle button
        const viewButtons = await page.$$('.flex button svg');
    }
    // Try clicking the list view toggle
    await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
            const svg = btn.querySelector('svg.lucide-list, svg.lucide-align-justify');
            if (svg) { btn.click(); return 'clicked list'; }
        }
        // Try by aria or other attribute
        const allBtns = Array.from(document.querySelectorAll('button'));
        const listBtn = allBtns.find(b => b.innerHTML.includes('M8 6h13') || b.innerHTML.includes('line'));
        if (listBtn) { listBtn.click(); return 'clicked via svg path'; }
        return 'no list button found';
    });
    await sleep(500);

    // Screenshot 07: List view
    await screenshot(page, '07_prueflinge_liste.png');

    // Switch back to grid
    await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
            const svg = btn.querySelector('svg.lucide-layout-grid, svg.lucide-grid-2x2');
            if (svg) { btn.click(); return; }
        }
    });
    await sleep(500);

    // Click "Neuer Prüfling" to open modal
    await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
            if (btn.textContent.includes('Neuer Prüfling')) { btn.click(); return; }
        }
    });
    await sleep(1000);

    // Screenshot 08: New student form
    await screenshot(page, '08_pruefling_formular.png', true);

    // Close modal
    await page.keyboard.press('Escape');
    await sleep(500);

    // Screenshot 09: Card with action buttons (hover effect)
    // We'll hover over the first student card
    const firstCard = await page.$('.group\\/move, [class*="rounded-xl"][class*="border"]');
    if (firstCard) {
        await firstCard.hover();
        await sleep(500);
    }
    await screenshot(page, '09_pruefling_aktionen.png');

    // Screenshot 10: Move dropdown
    // Hover over the move button (folder icon)
    await page.evaluate(() => {
        const moveBtn = document.querySelector('.group\\/move button, [class*="group/move"] button');
        if (moveBtn) moveBtn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    });
    await sleep(500);
    await screenshot(page, '10_pruefling_verschieben.png');

    // Screenshot 11: Pausiert filter
    await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
            if (btn.textContent.includes('Pausiert')) { btn.click(); return; }
        }
    });
    await sleep(500);
    await screenshot(page, '11_filter_pausiert.png');

    // Reset filter to Alle
    await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
            if (btn.textContent.includes('Alle')) { btn.click(); return; }
        }
    });
    await sleep(500);

    // Screenshot 12: Password dialog
    // Click delete on first student
    await page.evaluate(() => {
        const trashBtns = document.querySelectorAll('button');
        for (const btn of trashBtns) {
            const svg = btn.querySelector('svg.lucide-trash-2, svg.lucide-trash');
            if (svg) { btn.click(); return 'clicked trash'; }
        }
        return 'no trash found';
    });
    await sleep(1000);
    await screenshot(page, '12_passwort_dialog.png');

    // Close dialog
    await page.keyboard.press('Escape');
    await sleep(500);

    // Screenshot 13: Excel buttons (header area)
    await screenshot(page, '13_excel_buttons.png');

    // Screenshot 14: Warning for failed student
    // Student 4 only has Teil 1 - need to check if warning shows
    await screenshot(page, '14_warnung_nicht_bestanden.png');

    // ============================================
    // PHASE 5: Benotung-Screenshots
    // ============================================
    console.log('📸 Phase 5: Benotung-Screenshots');

    await page.goto(BASE_URL + '/#/grading', { waitUntil: 'networkidle0' });
    await sleep(1500);

    // Screenshot 15: Grading overview (no student selected)
    await screenshot(page, '15_benotung_uebersicht.png');

    // Click first student (Anna Schneider) in sidebar
    await page.evaluate(() => {
        const sidebarItems = document.querySelectorAll('[class*="cursor-pointer"]');
        for (const item of sidebarItems) {
            if (item.textContent.includes('Schneider')) { item.click(); return; }
        }
    });
    await sleep(1000);

    // Screenshot 16: Teil 1 grading
    await screenshot(page, '16_benotung_teil1.png');

    // Scroll down to Prüfungsstück
    await page.evaluate(() => window.scrollBy(0, 400));
    await sleep(500);

    // Screenshot 17: Prüfungsstück
    await screenshot(page, '17_benotung_pruefungsstueck.png');

    // Click Teil 2 tab
    await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
            if (btn.textContent.includes('Teil 2')) { btn.click(); return; }
        }
    });
    await sleep(1000);

    // Scroll to theory section
    await page.evaluate(() => {
        const theoryHeader = document.querySelector('[class*="emerald"], [class*="green"]');
        if (theoryHeader) theoryHeader.scrollIntoView({ behavior: 'instant', block: 'start' });
        else window.scrollTo(0, document.body.scrollHeight - 800);
    });
    await sleep(500);

    // Screenshot 18: Teil 2 Theorie
    await screenshot(page, '18_benotung_teil2_theorie.png');

    // Scroll to summary
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 400));
    await sleep(500);

    // Screenshot 19: Summary
    await screenshot(page, '19_benotung_zusammenfassung.png');

    // Scroll back to top for result display
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);

    // Screenshot 20: Result cards
    await screenshot(page, '20_benotung_ergebnis.png');

    // Scroll to bottom for PDF buttons
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(500);

    // Screenshot 21: PDF buttons
    await screenshot(page, '21_benotung_pdf_buttons.png');

    // Screenshot 22: Global examiner assignment
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);
    // Look for global examiner toggle/expand button
    await page.evaluate(() => {
        const elements = document.querySelectorAll('button, summary, [class*="cursor-pointer"]');
        for (const el of elements) {
            if (el.textContent.includes('Globale Prüfer') || el.textContent.includes('Prüfungsdatum')) {
                el.click();
                return 'clicked global';
            }
        }
        return 'not found';
    });
    await sleep(500);
    await screenshot(page, '22_globale_pruefer.png');

    // ============================================
    // PHASE 6: Gesellenbriefe-Screenshots
    // ============================================
    console.log('📸 Phase 6: Gesellenbriefe-Screenshots');

    await page.goto(BASE_URL + '/#/gesellenbriefe', { waitUntil: 'networkidle0' });
    await sleep(1500);

    // Screenshot 23: Gesellenbriefe page
    await screenshot(page, '23_gesellenbriefe_liste.png');

    // Screenshot 24: Gesellenbrief preview - click first student if possible
    await screenshot(page, '24_gesellenbrief_vorschau.png');

    // Look for custom text fields section
    await page.evaluate(() => {
        const elements = document.querySelectorAll('button, summary, [class*="cursor-pointer"], details');
        for (const el of elements) {
            if (el.textContent.includes('Textfeld') || el.textContent.includes('Individuel')) {
                el.click();
                return 'clicked text fields';
            }
        }
        return 'not found';
    });
    await sleep(500);

    // Screenshot 25: Custom text fields
    await screenshot(page, '25_gesellenbrief_textfelder.png');

    // ============================================
    // PHASE 7: Einstellungen-Screenshots
    // ============================================
    console.log('📸 Phase 7: Einstellungen-Screenshots');

    await page.goto(BASE_URL + '/#/settings', { waitUntil: 'networkidle0' });
    await sleep(1500);

    // Screenshot 26: Settings overview
    await screenshot(page, '26_einstellungen_uebersicht.png');

    // Open Datenverwaltung section
    await page.evaluate(() => {
        const details = document.querySelectorAll('details, [class*="cursor-pointer"]');
        for (const el of details) {
            if (el.textContent.includes('Datenverwaltung') || el.textContent.includes('Export')) {
                if (el.tagName === 'DETAILS') el.open = true;
                else el.click();
                return 'opened';
            }
        }
    });
    await sleep(500);
    await screenshot(page, '27_einstellungen_daten.png');

    // Navigate to Prüferpool section
    await page.evaluate(() => {
        const headers = document.querySelectorAll('h2, h3, summary, button, [class*="cursor-pointer"]');
        for (const el of headers) {
            if (el.textContent.includes('Prüferpool') || el.textContent.includes('rferpool')) {
                el.click();
                return 'clicked';
            }
        }
    });
    await sleep(500);
    await screenshot(page, '28_einstellungen_prueferpool.png');

    // Innung section
    await page.evaluate(() => {
        const headers = document.querySelectorAll('h2, h3, summary, button, [class*="cursor-pointer"]');
        for (const el of headers) {
            if (el.textContent.includes('Innung')) {
                el.click();
                return 'clicked';
            }
        }
    });
    await sleep(500);
    await screenshot(page, '29_einstellungen_innung.png');

    // Notenschlüssel section
    await page.evaluate(() => {
        const headers = document.querySelectorAll('h2, h3, summary, button, [class*="cursor-pointer"]');
        for (const el of headers) {
            if (el.textContent.includes('Notenschlüssel') || el.textContent.includes('otenschl')) {
                el.click();
                return 'clicked';
            }
        }
    });
    await sleep(500);
    await screenshot(page, '30_einstellungen_notenschluessel.png');

    // Prüfungsstruktur section
    await page.evaluate(() => {
        const headers = document.querySelectorAll('h2, h3, summary, button, [class*="cursor-pointer"]');
        for (const el of headers) {
            if (el.textContent.includes('Prüfungsstruktur') || el.textContent.includes('fungsstruktur')) {
                el.click();
                return 'clicked';
            }
        }
    });
    await sleep(500);
    await screenshot(page, '31_einstellungen_pruefungsstruktur.png');

    // ============================================
    // PHASE 8: Jahrgang & Navigation Screenshots
    // ============================================
    console.log('📸 Phase 8: Jahrgang & Navigation');

    // Navigate back to main page
    await page.goto(BASE_URL + '/#/', { waitUntil: 'networkidle0' });
    await sleep(1000);

    // Click Jahrgang dropdown
    await page.evaluate(() => {
        const els = document.querySelectorAll('button, [class*="cursor-pointer"]');
        for (const el of els) {
            if (el.textContent.includes('Jahrgang')) {
                el.click();
                return 'clicked jahrgang';
            }
        }
    });
    await sleep(500);

    // Screenshot 32: Jahrgang dropdown
    await screenshot(page, '32_jahrgang_verwaltung.png');

    // Close dropdown
    await page.keyboard.press('Escape');
    await sleep(300);

    // Screenshot 33: Sidebar navigation
    await screenshot(page, '33_sidebar_navigation.png');

    // Open Help dialog
    await page.evaluate(() => {
        const els = document.querySelectorAll('button, a');
        for (const el of els) {
            if (el.textContent.includes('Hilfe')) {
                el.click();
                return 'clicked hilfe';
            }
        }
    });
    await sleep(1000);

    // Screenshot 34: Help dialog
    await screenshot(page, '34_hilfe_dialog.png');

    // Close help
    await page.keyboard.press('Escape');
    await sleep(500);

    // Open Feedback dialog
    await page.evaluate(() => {
        const els = document.querySelectorAll('button, a');
        for (const el of els) {
            if (el.textContent.includes('Feedback')) {
                el.click();
                return 'clicked feedback';
            }
        }
    });
    await sleep(1000);

    // Screenshot 35: Feedback dialog
    await screenshot(page, '35_feedback_dialog.png');

    // ============================================
    // DONE
    // ============================================
    console.log('\n✅ Alle 35 Screenshots erstellt!');
    console.log(`📁 Gespeichert in: ${SCREENSHOT_DIR}`);

    await browser.close();
}

run().catch(err => {
    console.error('❌ Fehler:', err);
    process.exit(1);
});
