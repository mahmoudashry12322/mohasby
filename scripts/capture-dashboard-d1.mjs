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

  const pagesToCapture = [
    {
      name: 'dashboard-home-ar.png',
      url: 'http://127.0.0.1:3088/dashboard',
    },
    {
      name: 'dashboard-home-en.png',
      url: 'http://127.0.0.1:3088/en/dashboard',
    },
    {
      name: 'dashboard-chart-of-accounts-ar.png',
      url: 'http://127.0.0.1:3088/dashboard/accounting/chart-of-accounts',
    },
    {
      name: 'dashboard-chart-of-accounts-en.png',
      url: 'http://127.0.0.1:3088/en/dashboard/accounting/chart-of-accounts',
    },
  ];

  for (const item of pagesToCapture) {
    console.log(`Capturing ${item.name} from ${item.url}...`);
    const page = await browser.newPage();
    if (item.url.includes('/en/')) {
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    } else {
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'ar,ar-EG;q=0.9,en;q=0.8' });
    }
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(item.url, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, item.name),
      fullPage: false,
    });
    await page.close();
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
