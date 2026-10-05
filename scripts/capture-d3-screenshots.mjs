import { chromium } from '@playwright/test';
import path from 'path';

const CHROME_PATH = '/var/www/essentra.mahmoudashry.site/chrome/linux-152.0.7977.64/chrome-linux64/chrome';
const BASE_URL = 'http://localhost:3088';
const OUTPUT_DIR = '/root/.gemini/antigravity-ide/brain/6370e8b0-eeba-4cd2-943e-7594c52b1d7d';

const SAMPLE_RECENT_PAGES = JSON.stringify([
  { groupSlug: 'accounting', pageSlug: 'chart-of-accounts', timestamp: Date.now() - 1000 },
  { groupSlug: 'accounting', pageSlug: 'journal-entries', timestamp: Date.now() - 2000 },
  { groupSlug: 'warehouses', pageSlug: 'warehouse-journal', timestamp: Date.now() - 3000 },
  { groupSlug: 'cold-storage', pageSlug: 'cold-storage-journal', timestamp: Date.now() - 4000 },
  { groupSlug: 'banking', pageSlug: 'bank-transactions', timestamp: Date.now() - 5000 },
]);

async function main() {
  console.log('Launching Playwright Chrome for Phase D3 self-review screenshots...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  async function setupPage(viewport, locale = 'ar', isCollapsed = false) {
    const context = await browser.newContext({
      viewport,
      locale: locale === 'ar' ? 'ar-EG' : 'en-US',
    });

    await context.addCookies([
      {
        name: 'mohasby_nav',
        value: encodeURIComponent(JSON.stringify({ collapsed: isCollapsed, openGroups: ['accounting'] })),
        domain: 'localhost',
        path: '/',
      },
    ]);

    const page = await context.newPage();
    await page.goto(`${BASE_URL}${locale === 'ar' ? '/dashboard' : '/en/dashboard'}`);
    await page.evaluate((data) => {
      localStorage.setItem('mohasby_recent_pages', data);
    }, SAMPLE_RECENT_PAGES);

    await page.reload({ waitUntil: 'networkidle' });
    return { context, page };
  }

  // 1. 1440px Arabic Home with Recent Pages
  console.log('Capturing: home-with-recent-ar-1440.png ...');
  {
    const { context, page } = await setupPage({ width: 1440, height: 900 }, 'ar', false);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'home-with-recent-ar-1440.png') });
    await context.close();
  }

  // 2. 1440px English Home with Recent Pages
  console.log('Capturing: home-with-recent-en-1440.png ...');
  {
    const { context, page } = await setupPage({ width: 1440, height: 900 }, 'en', false);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'home-with-recent-en-1440.png') });
    await context.close();
  }

  // 3. 1440px Arabic Sidebar Expanded on Chart of Accounts
  console.log('Capturing: sidebar-expanded-ar-1440.png ...');
  {
    const { context, page } = await setupPage({ width: 1440, height: 900 }, 'ar', false);
    await page.goto(`${BASE_URL}/dashboard/accounting/chart-of-accounts`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'sidebar-expanded-ar-1440.png') });
    await context.close();
  }

  // 4. 1440px Arabic Collapsed Rail
  console.log('Capturing: sidebar-rail-ar-1440.png ...');
  {
    const { context, page } = await setupPage({ width: 1440, height: 900 }, 'ar', true);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'sidebar-rail-ar-1440.png') });
    await context.close();
  }

  // 5. 1440px Arabic Rail with Flyout Open
  console.log('Capturing: rail-flyout-ar-1440.png ...');
  {
    const { context, page } = await setupPage({ width: 1440, height: 900 }, 'ar', true);
    const accountingBtn = page.locator('aside button[aria-haspopup="menu"]').first();
    await accountingBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'rail-flyout-ar-1440.png') });
    await context.close();
  }

  // 6. 1440px English Rail with Flyout Open
  console.log('Capturing: rail-flyout-en-1440.png ...');
  {
    const { context, page } = await setupPage({ width: 1440, height: 900 }, 'en', true);
    const accountingBtn = page.locator('aside button[aria-haspopup="menu"]').first();
    await accountingBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'rail-flyout-en-1440.png') });
    await context.close();
  }

  // 7. 1440px Arabic Command Palette Open with Search Query
  console.log('Capturing: palette-open-ar-1440.png ...');
  {
    const { context, page } = await setupPage({ width: 1440, height: 900 }, 'ar', false);
    await page.keyboard.press('Control+K');
    await page.waitForTimeout(300);
    await page.keyboard.type('الاستاذ');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'palette-open-ar-1440.png') });
    await context.close();
  }

  // 8. 768px Arabic Drawer Open
  console.log('Capturing: drawer-open-ar-768.png ...');
  {
    const { context, page } = await setupPage({ width: 768, height: 1024 }, 'ar', false);
    const hamburger = page.locator('button[aria-label="Open navigation drawer"]');
    await hamburger.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'drawer-open-ar-768.png') });
    await context.close();
  }

  // 9. 768px English Drawer Open
  console.log('Capturing: drawer-open-en-768.png ...');
  {
    const { context, page } = await setupPage({ width: 768, height: 1024 }, 'en', false);
    const hamburger = page.locator('button[aria-label="Open navigation drawer"]');
    await hamburger.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'drawer-open-en-768.png') });
    await context.close();
  }

  // 10. 375px Arabic Mobile Home
  console.log('Capturing: home-mobile-ar-375.png ...');
  {
    const { context, page } = await setupPage({ width: 375, height: 812 }, 'ar', false);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'home-mobile-ar-375.png') });
    await context.close();
  }

  // 11. 375px Arabic Mobile Drawer Open
  console.log('Capturing: drawer-open-ar-375.png ...');
  {
    const { context, page } = await setupPage({ width: 375, height: 812 }, 'ar', false);
    const hamburger = page.locator('button[aria-label="Open navigation drawer"]');
    await hamburger.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'drawer-open-ar-375.png') });
    await context.close();
  }

  // 12. 375px Arabic Mobile Command Palette Open as full sheet
  console.log('Capturing: palette-mobile-ar-375.png ...');
  {
    const { context, page } = await setupPage({ width: 375, height: 812 }, 'ar', false);
    const searchBtn = page.locator('button[aria-label="ابحث عن صفحة..."]');
    await searchBtn.click();
    await page.waitForTimeout(300);
    await page.keyboard.type('ميزان');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'palette-mobile-ar-375.png') });
    await context.close();
  }

  // 13. 375px English Mobile Drawer Open
  console.log('Capturing: drawer-open-en-375.png ...');
  {
    const { context, page } = await setupPage({ width: 375, height: 812 }, 'en', false);
    const hamburger = page.locator('button[aria-label="Open navigation drawer"]');
    await hamburger.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'drawer-open-en-375.png') });
    await context.close();
  }

  await browser.close();
  console.log('All 13 Phase D3 self-review screenshots captured successfully!');
}

main().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
