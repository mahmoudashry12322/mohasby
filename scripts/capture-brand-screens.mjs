import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = '/var/www/essentra.mahmoudashry.site/chrome/linux-152.0.7977.64/chrome-linux64/chrome';
const ARTIFACT_DIR = '/root/.gemini/antigravity-ide/brain/749c3e6d-e0e8-49ce-bcd9-2955021ceb7c';

async function capture() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--hide-scrollbars'],
  });

  const targets = [
    {
      name: 'brand-ar-desktop.png',
      url: 'http://127.0.0.1:3088/brand',
      locale: 'ar',
      width: 1440,
      height: 900,
    },
    {
      name: 'brand-en-desktop.png',
      url: 'http://127.0.0.1:3088/en/brand',
      locale: 'en',
      width: 1440,
      height: 900,
    },
    {
      name: 'brand-ar-mobile.png',
      url: 'http://127.0.0.1:3088/brand',
      locale: 'ar',
      width: 375,
      height: 812,
    },
    {
      name: 'brand-en-mobile.png',
      url: 'http://127.0.0.1:3088/en/brand',
      locale: 'en',
      width: 375,
      height: 812,
    },
  ];

  for (const t of targets) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ width: t.width, height: t.height });

    // Set cookie explicitly for this context
    await page.setCookie({
      name: 'NEXT_LOCALE',
      value: t.locale,
      domain: '127.0.0.1',
      path: '/',
    });
    await page.setCookie({
      name: 'mohasby_lang',
      value: t.locale,
      domain: '127.0.0.1',
      path: '/',
    });

    await page.goto(t.url, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1200)); // allow fonts and layout to settle

    const outPath = path.join(ARTIFACT_DIR, t.name);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`Captured ${t.name} -> ${outPath}`);
    await page.close();
    await context.close();
  }

  await browser.close();
  console.log('All screenshots captured successfully with clean locale contexts!');
}

capture().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
