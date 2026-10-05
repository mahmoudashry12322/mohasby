import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = '/var/www/essentra.mahmoudashry.site/chrome/linux-152.0.7977.64/chrome-linux64/chrome';
const ARTIFACT_DIR = '/root/.gemini/antigravity-ide/brain/6370e8b0-eeba-4cd2-943e-7594c52b1d7d';

async function run() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--hide-scrollbars'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1080, deviceScaleFactor: 2 });

  // Set demo session cookie
  await page.setCookie({
    name: 'mohasby_session',
    value: encodeURIComponent(
      JSON.stringify({
        id: 'usr_demo_01',
        email: 'demo@mohasby.app',
        name: 'أحمد الشناوي',
        companyName: 'شركة نموذجية للتجارة والصناعة (تجريبية)',
        role: 'admin',
      })
    ),
    domain: '127.0.0.1',
    path: '/',
  });

  console.log('Navigating to Chart of Accounts...');
  await page.goto('http://127.0.0.1:3088/dashboard/accounting/chart-of-accounts', {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 1200));

  // 1. Full Tree View
  console.log('Capturing coa-tree-view.png...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'coa-tree-view.png'),
    fullPage: false,
  });

  // 2. Filter by Liabilities (الخصوم)
  console.log('Filtering by liabilities...');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('الخصوم')) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 800));
  console.log('Capturing coa-liabilities-filtered.png...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'coa-liabilities-filtered.png'),
  });

  // Reset to All
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('إجمالي الحسابات')) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 600));

  // 3. Switch to Table View
  console.log('Switching to table view...');
  const tableBtns = await page.$$('button');
  for (const btn of tableBtns) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('عرض جدولي تفصيلي')) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 600));
  console.log('Capturing coa-table-view.png...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'coa-table-view.png'),
  });

  // 4. Open Add Account Modal
  console.log('Opening Add Account Modal...');
  const addBtns = await page.$$('button');
  for (const btn of addBtns) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('إضافة حساب جديد')) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 800));
  console.log('Capturing coa-modal-open.png...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'coa-modal-open.png'),
  });

  // 5. Mobile View (375px)
  console.log('Testing Mobile 375px...');
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 400));
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 600));
  console.log('Capturing coa-mobile-375.png...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'coa-mobile-375.png'),
  });

  await browser.close();
  console.log('✅ All screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Error capturing:', err);
  process.exit(1);
});
