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
      name: 'landing-ar-desktop.png',
      url: 'http://127.0.0.1:3088/',
      locale: 'ar',
      width: 1440,
      height: 900,
    },
    {
      name: 'landing-en-desktop.png',
      url: 'http://127.0.0.1:3088/en',
      locale: 'en',
      width: 1440,
      height: 900,
    },
    {
      name: 'landing-ar-mobile.png',
      url: 'http://127.0.0.1:3088/',
      locale: 'ar',
      width: 375,
      height: 812,
    },
    {
      name: 'landing-en-mobile.png',
      url: 'http://127.0.0.1:3088/en',
      locale: 'en',
      width: 375,
      height: 812,
    },
  ];

  for (const t of targets) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ width: t.width, height: t.height, deviceScaleFactor: 2 });

    await page.setCookie({
      name: 'NEXT_LOCALE',
      value: t.locale,
      domain: '127.0.0.1',
      path: '/',
    });

    await page.goto(t.url, { waitUntil: 'load', timeout: 20000 });
    await new Promise((r) => setTimeout(r, 2000)); // allow fonts and layout to settle

    const outPath = path.join(ARTIFACT_DIR, t.name);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Captured viewport ${t.name} -> ${outPath}`);
    await page.close();
    await context.close();
  }

  await browser.close();
  console.log('All landing screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
