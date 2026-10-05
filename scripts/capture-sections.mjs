import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = '/var/www/essentra.mahmoudashry.site/chrome/linux-152.0.7977.64/chrome-linux64/chrome';
const ARTIFACT_DIR = '/root/.gemini/antigravity-ide/brain/749c3e6d-e0e8-49ce-bcd9-2955021ceb7c';

async function captureSections() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--hide-scrollbars'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:3088/', { waitUntil: 'load', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to #modules
  await page.evaluate(() => {
    document.querySelector('#modules')?.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'landing-modules-section.png') });

  // Scroll to #excel
  await page.evaluate(() => {
    document.querySelector('#excel')?.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'landing-excel-section.png') });

  await browser.close();
  console.log('Sections captured!');
}

captureSections().catch(console.error);
