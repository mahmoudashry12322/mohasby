import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = '/var/www/essentra.mahmoudashry.site/chrome/linux-152.0.7977.64/chrome-linux64/chrome';
const ARTIFACT_DIR = '/root/.gemini/antigravity-ide/brain/749c3e6d-e0e8-49ce-bcd9-2955021ceb7c';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function capture() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--hide-scrollbars'],
  });

  // 1. Desktop Login (1440x900)
  console.log('Capturing Desktop Login...');
  const pageDesk = await browser.newPage();
  await pageDesk.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await pageDesk.goto('http://127.0.0.1:3088/login', { waitUntil: 'load', timeout: 20000 });
  await sleep(1500);
  await pageDesk.screenshot({ path: path.join(ARTIFACT_DIR, 'phase-b-login-desktop.png') });
  await pageDesk.close();

  // 2. Tablet Login (1024x768)
  console.log('Capturing Tablet Login (1024x768)...');
  const pageTab = await browser.newPage();
  await pageTab.setViewport({ width: 1024, height: 768, deviceScaleFactor: 2 });
  await pageTab.goto('http://127.0.0.1:3088/login', { waitUntil: 'load', timeout: 20000 });
  await sleep(1500);
  await pageTab.screenshot({ path: path.join(ARTIFACT_DIR, 'phase-b-login-tablet.png') });
  await pageTab.close();

  // 3. Mobile Login (375x812)
  console.log('Capturing Mobile Login (375x812)...');
  const pageMob = await browser.newPage();
  await pageMob.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await pageMob.goto('http://127.0.0.1:3088/login', { waitUntil: 'load', timeout: 20000 });
  await sleep(1500);
  await pageMob.screenshot({ path: path.join(ARTIFACT_DIR, 'phase-b-login-mobile.png') });
  await pageMob.close();

  // 4. Validation Error State (blur with invalid inputs)
  console.log('Capturing Validation Error State...');
  const pageVal = await browser.newPage();
  await pageVal.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await pageVal.goto('http://127.0.0.1:3088/login', { waitUntil: 'load', timeout: 20000 });
  await sleep(1000);
  await pageVal.type('#email', 'invalid-email');
  await pageVal.click('#password');
  await sleep(500);
  await pageVal.screenshot({ path: path.join(ARTIFACT_DIR, 'phase-b-login-validation-error.png') });
  await pageVal.close();

  // 5. Auth Error Banner State (wrong credentials submit)
  console.log('Capturing Auth Error State...');
  const pageErr = await browser.newPage();
  await pageErr.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await pageErr.goto('http://127.0.0.1:3088/login', { waitUntil: 'load', timeout: 20000 });
  await sleep(1000);
  await pageErr.type('#email', 'wrong@company.com');
  await pageErr.type('#password', 'WrongPassword123');
  await pageErr.click('button[type="submit"]');
  await sleep(1500); // Wait for stub auth delay and error banner display
  await pageErr.screenshot({ path: path.join(ARTIFACT_DIR, 'phase-b-login-auth-error.png') });
  await pageErr.close();

  // 6. Authenticated Dashboard with Toast (1440x900)
  console.log('Capturing Dashboard State...');
  const pageDash = await browser.newPage();
  await pageDash.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  // Set mohasby_session cookie
  await pageDash.setCookie({
    name: 'mohasby_session',
    value: encodeURIComponent(JSON.stringify({
      id: 'usr-demo-01',
      email: 'demo@mohasby.app',
      name: 'أحمد الشناوي',
      company: 'شركة النيل للصناعات الغذائية والتبريد',
      role: 'مدير مالي رئيسي',
    })),
    domain: '127.0.0.1',
    path: '/',
  });
  await pageDash.goto('http://127.0.0.1:3088/dashboard', { waitUntil: 'load', timeout: 20000 });
  await sleep(1500); // Allow toast animation to appear
  await pageDash.screenshot({ path: path.join(ARTIFACT_DIR, 'phase-b-dashboard.png') });
  await pageDash.close();

  // 7. Branded 403 Page
  console.log('Capturing 403 Page...');
  const page403 = await browser.newPage();
  await page403.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page403.goto('http://127.0.0.1:3088/403', { waitUntil: 'load', timeout: 20000 });
  await sleep(1000);
  await page403.screenshot({ path: path.join(ARTIFACT_DIR, 'phase-b-403.png') });
  await page403.close();

  // 8. Branded 404 Page
  console.log('Capturing 404 Page...');
  const page404 = await browser.newPage();
  await page404.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page404.goto('http://127.0.0.1:3088/non-existent-accounting-page', { waitUntil: 'load', timeout: 20000 });
  await sleep(1000);
  await page404.screenshot({ path: path.join(ARTIFACT_DIR, 'phase-b-404.png') });
  await page404.close();

  await browser.close();
  console.log('All Phase B screens captured successfully!');
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
