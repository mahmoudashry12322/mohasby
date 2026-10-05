import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = '/var/www/essentra.mahmoudashry.site/chrome/linux-152.0.7977.64/chrome-linux64/chrome';
const ARTIFACT_DIR = '/root/.gemini/antigravity-ide/brain/6370e8b0-eeba-4cd2-943e-7594c52b1d7d';

async function capture() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--hide-scrollbars'],
  });

  // 1. Rail with Flyout Open at 1440px (Arabic RTL)
  console.log('1. Capturing Rail with Flyout open at 1440px...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.setCookie({
      name: 'mohasby_nav',
      value: encodeURIComponent(JSON.stringify({ collapsed: true, openGroups: ['accounting'] })),
      domain: '127.0.0.1',
      path: '/',
    });
    await page.goto('http://127.0.0.1:3088/dashboard', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));

    // Click on the first group icon (accounting) in rail
    const groupButtons = await page.$$('aside button[aria-haspopup="menu"]');
    if (groupButtons.length > 0) {
      await groupButtons[0].click();
      await new Promise((r) => setTimeout(r, 600));
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'rail-flyout-open-1440.png') });
    await page.close();
  }

  // 2. Expanded vs Rail at 1100px
  console.log('2. Capturing Expanded vs Rail at 1100px...');
  {
    // Rail at 1100px
    const pageRail = await browser.newPage();
    await pageRail.setViewport({ width: 1100, height: 800, deviceScaleFactor: 2 });
    await pageRail.setCookie({
      name: 'mohasby_nav',
      value: encodeURIComponent(JSON.stringify({ collapsed: true, openGroups: ['accounting'] })),
      domain: '127.0.0.1',
      path: '/',
    });
    await pageRail.goto('http://127.0.0.1:3088/dashboard/accounting/chart-of-accounts', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));
    await pageRail.screenshot({ path: path.join(ARTIFACT_DIR, 'rail-1100.png') });
    await pageRail.close();

    // Expanded at 1100px
    const pageExp = await browser.newPage();
    await pageExp.setViewport({ width: 1100, height: 800, deviceScaleFactor: 2 });
    await pageExp.setCookie({
      name: 'mohasby_nav',
      value: encodeURIComponent(JSON.stringify({ collapsed: false, openGroups: ['accounting'] })),
      domain: '127.0.0.1',
      path: '/',
    });
    await pageExp.goto('http://127.0.0.1:3088/dashboard/accounting/chart-of-accounts', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));
    await pageExp.screenshot({ path: path.join(ARTIFACT_DIR, 'expanded-1100.png') });
    await pageExp.close();
  }

  // 3. Mobile Drawer Open at 768px
  console.log('3. Capturing Mobile Drawer at 768px...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
    await page.goto('http://127.0.0.1:3088/dashboard', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));

    // Click hamburger button in topbar
    const hamburger = await page.$('header button[aria-label="Open navigation drawer"]');
    if (hamburger) {
      await hamburger.click();
      await new Promise((r) => setTimeout(r, 600));
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'drawer-open-768.png') });
    await page.close();
  }

  // 4. Mobile Drawer Open at 375px (assert no horizontal scroll)
  console.log('4. Capturing Mobile Drawer at 375px...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2 });
    await page.goto('http://127.0.0.1:3088/dashboard/accounting/chart-of-accounts', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));

    // Check horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log(`At 375px before drawer: horizontal overflow = ${hasHorizontalOverflow}`);

    // Click hamburger
    const hamburger = await page.$('header button[aria-label="Open navigation drawer"]');
    if (hamburger) {
      await hamburger.click();
      await new Promise((r) => setTimeout(r, 600));
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'drawer-open-375.png') });
    await page.close();
  }

  // 5. Command Palette open on Desktop (searching "الاستاذ")
  console.log('5. Capturing Command Palette on Desktop searching "الاستاذ"...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto('http://127.0.0.1:3088/dashboard', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));

    // Click search button
    const searchBtn = await page.$('header button[aria-label="ابحث عن صفحة..."]');
    if (searchBtn) {
      await searchBtn.click();
      await new Promise((r) => setTimeout(r, 400));
    }

    // Type "الاستاذ" (without hamza)
    await page.keyboard.type('الاستاذ');
    await new Promise((r) => setTimeout(r, 500));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'palette-desktop-1440.png') });
    await page.close();
  }

  // 6. Command Palette open on Mobile 375px (searching "المالى")
  console.log('6. Capturing Command Palette on Mobile searching "المالى"...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2 });
    await page.goto('http://127.0.0.1:3088/dashboard', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));

    // Click search trigger
    const searchBtn = await page.$('header button[aria-label="ابحث عن صفحة..."]');
    if (searchBtn) {
      await searchBtn.click();
      await new Promise((r) => setTimeout(r, 400));
    }

    // Type "المالى" (with alif maqsura ى)
    await page.keyboard.type('المالى');
    await new Promise((r) => setTimeout(r, 500));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'palette-mobile-375.png') });
    await page.close();
  }

  // 7. English Spot Check (Rail with Flyout open at 1440px LTR)
  console.log('7. Capturing English spot check (Rail with Flyout)...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.setCookie({
      name: 'mohasby_nav',
      value: encodeURIComponent(JSON.stringify({ collapsed: true, openGroups: ['accounting'] })),
      domain: '127.0.0.1',
      path: '/',
    });
    await page.goto('http://127.0.0.1:3088/en/dashboard', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));

    const groupButtons = await page.$$('aside button[aria-haspopup="menu"]');
    if (groupButtons.length > 0) {
      await groupButtons[0].click();
      await new Promise((r) => setTimeout(r, 600));
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'rail-flyout-en-1440.png') });
    await page.close();
  }

  await browser.close();
  console.log('All Phase D2 screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Error during Phase D2 capture:', err);
  process.exit(1);
});
