import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'anleitung-bilder');
const BASE_URL = 'http://localhost:5173';
const wait = (ms) => new Promise(r => setTimeout(r, ms));

function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

const adminHash = hashPassword('admin123');

// All data to inject BEFORE the app loads
const STORAGE_DATA = {
  gp_digital_license: JSON.stringify({
    key: 'GPDIG-9999-9FW95-BJRY7',
    activatedAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2099-12-31T23:59:59.000Z',
    isPermanent: true
  }),
  hair_grading_session: JSON.stringify({
    isAuthenticated: true,
    role: 'admin',
    lastActivity: new Date().toISOString()
  }),
  hair_grading_app_global: JSON.stringify({
    currentJahrgangId: 'jg-2026',
    jahrgaenge: [{
      id: 'jg-2026',
      name: 'Jahrgang 2026',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
      data: {
        students: [
          { id: 's1', firstName: 'Anna', lastName: 'Schneider', company: 'Haarstudio Eleganz', isActive: true },
          { id: 's2', firstName: 'Ben', lastName: 'Müller', company: 'Salon Modern', isActive: true }
        ],
        grades: [],
        sheets: [],
        examinerCount: 2,
        _dataVersion: 1
      }
    }],
    innung: { name: 'Friseur-Innung Hannover', city: 'Hannover' },
    gradeScale: [],
    prueferpool: [
      { id: 'p1', name: 'Hans Meier', role: 'Vorsitzender', isActive: true },
      { id: 'p2', name: 'Petra Schmidt', role: 'Prüfer', isActive: true }
    ],
    adminPasswordHash: adminHash,
    mitarbeiterPasswordHash: '',
    isFirstTimeSetupComplete: true
  })
};

async function main() {
  console.log('Starting browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--window-size=1280,800', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // KEY TRICK: Use evaluateOnNewDocument to set localStorage BEFORE the app JS runs
  await page.evaluateOnNewDocument((storageData) => {
    for (const [key, value] of Object.entries(storageData)) {
      localStorage.setItem(key, value);
    }
  }, STORAGE_DATA);

  // Now navigate - localStorage will already be set when React initializes
  console.log('Navigating to settings page...');
  await page.goto(`${BASE_URL}/#/settings`, { waitUntil: 'networkidle0' });
  await wait(3000);
  console.log('URL:', page.url());

  // Check if we need to log in
  if (page.url().includes('/welcome') || page.url().includes('/login')) {
    console.log('On login page, logging in with admin123...');
    const pwInput = await page.$('input[type="password"]');
    if (pwInput) {
      await pwInput.type('admin123');
      await wait(300);
    }
    // Select Administrator
    await page.evaluate(() => {
      document.querySelectorAll('*').forEach(el => {
        if (el.textContent.trim() === 'Administrator' && el.childNodes.length <= 2) el.click();
      });
    });
    await wait(300);
    // Click Anmelden
    await page.evaluate(() => {
      document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('Anmelden')) btn.click();
      });
    });
    await wait(3000);
    console.log('After login URL:', page.url());

    // Navigate to settings
    await page.evaluate(() => { window.location.hash = '#/settings'; });
    await wait(2000);
  }

  console.log('Final URL:', page.url());

  if (page.url().includes('/license')) {
    console.log('❌ STILL on license page. Aborting.');
    await page.screenshot({ path: '/tmp/debug_still_license.png' });
    await browser.close();
    return;
  }

  // ============================================
  // Screenshot 27: Einstellungen - Datenverwaltung
  // ============================================
  console.log('\n📸 27_einstellungen_daten.png');
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, '27_einstellungen_daten.png'),
    fullPage: false
  });
  console.log('  ✓ saved');

  // ============================================
  // Screenshot 34: Hilfe-Dialog
  // ============================================
  console.log('📸 34_hilfe_dialog.png');
  await page.evaluate(() => { window.location.hash = '#/'; });
  await wait(1500);

  await page.evaluate(() => {
    document.querySelectorAll('*').forEach(el => {
      if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 && el.textContent.trim() === 'Hilfe') {
        el.click();
      }
    });
  });
  await wait(1500);

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, '34_hilfe_dialog.png'),
    fullPage: false
  });
  console.log('  ✓ saved');

  await page.keyboard.press('Escape');
  await wait(500);

  // ============================================
  // Screenshot 35: Feedback-Dialog
  // ============================================
  console.log('📸 35_feedback_dialog.png');
  await page.evaluate(() => {
    document.querySelectorAll('*').forEach(el => {
      if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 && el.textContent.trim() === 'Feedback geben') {
        el.click();
      }
    });
  });
  await wait(1500);

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, '35_feedback_dialog.png'),
    fullPage: false
  });
  console.log('  ✓ saved');

  await browser.close();

  // Verify
  const files = ['27_einstellungen_daten.png', '34_hilfe_dialog.png', '35_feedback_dialog.png'];
  console.log('\n=== Verification ===');
  const sizes = [];
  for (const f of files) {
    const fp = path.join(SCREENSHOTS_DIR, f);
    if (fs.existsSync(fp)) {
      const size = fs.statSync(fp).size;
      sizes.push(size);
      console.log(`  ✓ ${f} (${(size / 1024).toFixed(1)} KB)`);
    } else {
      console.log(`  ✗ ${f} MISSING!`);
    }
  }
  if (new Set(sizes).size === 1) {
    console.log('  ⚠️ All same size - likely same screenshot!');
  } else {
    console.log('  ✅ Screenshots have different sizes - looking good!');
  }

  console.log('\nDone!');
}

main().catch(console.error);
