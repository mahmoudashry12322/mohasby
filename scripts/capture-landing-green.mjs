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

  // 1. Landing Hero Viewport (1440x900)
  console.log('Capturing Landing Hero Viewport...');
  const pageHero = await browser.newPage();
  await pageHero.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await pageHero.goto('http://127.0.0.1:3088/', { waitUntil: 'load', timeout: 20000 });
  await new Promise((r) => setTimeout(r, 2000));
  await pageHero.screenshot({ path: path.join(ARTIFACT_DIR, 'landing-hero-green.png'), fullPage: false });
  await pageHero.close();

  // 2. Login Page Viewport (1440x900)
  console.log('Capturing Login Page...');
  const pageLogin = await browser.newPage();
  await pageLogin.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await pageLogin.goto('http://127.0.0.1:3088/login', { waitUntil: 'load', timeout: 20000 });
  await new Promise((r) => setTimeout(r, 2000));
  await pageLogin.screenshot({ path: path.join(ARTIFACT_DIR, 'login-green.png'), fullPage: false });
  await pageLogin.close();

  await browser.close();
  console.log('Capture complete!');
}

capture().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
