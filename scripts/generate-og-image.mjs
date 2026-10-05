import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = '/var/www/essentra.mahmoudashry.site/chrome/linux-152.0.7977.64/chrome-linux64/chrome';
const OUT_PATH = '/var/www/mohasby.mahmoudashry.site/public/og-image.png';

async function generateOgImage() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Noto+Kufi+Arabic:wght@700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 630px;
      background: #0B110E;
      color: #FFFFFF;
      font-family: 'IBM Plex Sans Arabic', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px 80px;
      position: relative;
      overflow: hidden;
    }
    .grid-lines {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(40, 167, 143, 0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(40, 167, 143, 0.05) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
    }
    .glow {
      position: absolute;
      top: -150px;
      left: -100px;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(40, 167, 143, 0.18) 0%, transparent 70%);
      pointer-events: none;
    }
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
    }
    .logo-wrap {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo-icon {
      width: 56px;
      height: 56px;
      background: #14211C;
      border: 1.5px solid rgba(40, 167, 143, 0.4);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-text {
      font-family: 'Noto Kufi Arabic', sans-serif;
      font-size: 34px;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: -0.5px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(40, 167, 143, 0.12);
      border: 1px solid rgba(40, 167, 143, 0.3);
      padding: 8px 18px;
      border-radius: 9999px;
      font-size: 15px;
      color: #28A78F;
      font-weight: 600;
    }
    .content {
      z-index: 10;
      max-width: 900px;
    }
    h1 {
      font-family: 'Noto Kufi Arabic', sans-serif;
      font-size: 52px;
      font-weight: 800;
      line-height: 1.25;
      margin-bottom: 20px;
      color: #FFFFFF;
    }
    h1 span {
      color: #28A78F;
    }
    p {
      font-size: 22px;
      line-height: 1.6;
      color: #B2BDB8;
      max-width: 820px;
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 28px;
      z-index: 10;
    }
    .features {
      display: flex;
      align-items: center;
      gap: 32px;
    }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      color: #E2E8E5;
      font-weight: 500;
    }
    .check {
      color: #28A78F;
      font-weight: bold;
    }
    .domain {
      font-size: 16px;
      color: #28A78F;
      font-weight: 600;
      letter-spacing: 0.5px;
      direction: ltr;
    }
  </style>
</head>
<body>
  <div class="grid-lines"></div>
  <div class="glow"></div>

  <div class="top-bar">
    <div class="logo-wrap">
      <div class="logo-icon">
        <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="10" fill="#14211C"/>
          <path d="M12 28V15C12 13.3431 13.3431 12 15 12H20C21.6569 12 23 13.3431 23 15V28" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M23 20H25C26.6569 20 28 21.3431 28 23V28" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="28" cy="14" r="3.5" fill="#28A78F"/>
        </svg>
      </div>
      <div class="logo-text">مُحاسبي</div>
    </div>
    <div class="badge">
      <span>●</span>
      <span>نظام محاسبي سحابي متزن</span>
    </div>
  </div>

  <div class="content">
    <h1>دفتر حساباتك <span>متزن</span> من أول قيد</h1>
    <p>حل متكامل مصمم خصيصاً للشركات المصرية: قيود اليومية، المخازن والثلاجات، مراكز التكلفة، وإدارة البنوك والشيكات.</p>
  </div>

  <div class="footer">
    <div class="features">
      <div class="feature-item"><span class="check">✓</span> قيود متزنة تلقائياً</div>
      <div class="feature-item"><span class="check">✓</span> أذونات صرف وإضافة ولوتات</div>
      <div class="feature-item"><span class="check">✓</span> مراكز تكلفة بالأراضي والمواسم</div>
      <div class="feature-item"><span class="check">✓</span> تسوية بنكية وجدول شيكات</div>
    </div>
    <div class="domain">mohasby.mahmoudashry.site</div>
  </div>
</body>
</html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: OUT_PATH, type: 'png' });
  await browser.close();
  console.log('og-image.png generated successfully at:', OUT_PATH);
}

generateOgImage().catch(console.error);
