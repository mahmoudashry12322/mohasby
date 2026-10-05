import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// Load messages
const arMessages = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'messages/ar.json'), 'utf8'));
const enMessages = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'messages/en.json'), 'utf8'));

// 8 Groups & 44 Pages definition matching nav.config.ts
const NAV_GROUPS = [
  {
    slug: 'accounting',
    labelKey: 'accounting',
    items: [
      { slug: 'chart-of-accounts', labelKey: 'chartOfAccounts' },
      { slug: 'opening-balances', labelKey: 'openingBalances' },
      { slug: 'journal-entries', labelKey: 'journalEntries' },
      { slug: 'general-ledger', labelKey: 'generalLedger' },
      { slug: 'account-statement', labelKey: 'accountStatement' },
      { slug: 'trial-balance', labelKey: 'trialBalance' },
      { slug: 'account-reconciliation', labelKey: 'accountReconciliation' },
      { slug: 'inventory-adjustments', labelKey: 'inventoryAdjustments' },
      { slug: 'asset-depreciation', labelKey: 'assetDepreciation' },
      { slug: 'income-statement', labelKey: 'incomeStatement' },
      { slug: 'profit-and-loss', labelKey: 'profitAndLoss' },
      { slug: 'balance-sheet', labelKey: 'balanceSheet' },
      { slug: 'statement-of-equity', labelKey: 'statementOfEquity' },
      { slug: 'cash-flow-direct', labelKey: 'cashFlowDirect' },
      { slug: 'cash-flow-indirect', labelKey: 'cashFlowIndirect' },
      { slug: 'account-lists', labelKey: 'accountLists' },
      { slug: 'lookup-lists', labelKey: 'lookupLists' },
    ],
  },
  {
    slug: 'warehouses',
    labelKey: 'warehouses',
    items: [
      { slug: 'warehouse-journal', labelKey: 'warehouseJournal' },
      { slug: 'warehouse-report', labelKey: 'warehouseReport' },
      { slug: 'ending-inventory-report', labelKey: 'endingInventoryReport' },
      { slug: 'warehouse-waste', labelKey: 'warehouseWaste' },
    ],
  },
  {
    slug: 'cold-storage',
    labelKey: 'coldStorage',
    items: [
      { slug: 'cold-storage-journal', labelKey: 'coldStorageJournal' },
      { slug: 'cold-storage-report', labelKey: 'coldStorageReport' },
      { slug: 'cold-storages-report', labelKey: 'coldStoragesReport' },
      { slug: 'item-report', labelKey: 'itemReport' },
    ],
  },
  {
    slug: 'banking',
    labelKey: 'banking',
    items: [
      { slug: 'banks', labelKey: 'banks' },
      { slug: 'bank-transactions', labelKey: 'bankTransactions' },
      { slug: 'bank-statement', labelKey: 'bankStatement' },
      { slug: 'bank-reconciliation', labelKey: 'bankReconciliation' },
      { slug: 'cheque-portfolio', labelKey: 'chequePortfolio' },
    ],
  },
  {
    slug: 'costs',
    labelKey: 'costs',
    items: [
      { slug: 'cost-journal', labelKey: 'costJournal' },
      { slug: 'import-costs', labelKey: 'importCosts' },
      { slug: 'export-costs', labelKey: 'exportCosts' },
      { slug: 'farming-costs', labelKey: 'farmingCosts' },
      { slug: 'manufacturing-costs', labelKey: 'manufacturingCosts' },
    ],
  },
  {
    slug: 'reports',
    labelKey: 'reports',
    items: [
      { slug: 'sales-report', labelKey: 'salesReport' },
      { slug: 'purchases-report', labelKey: 'purchasesReport' },
      { slug: 'cost-centers-report', labelKey: 'costCentersReport' },
      { slug: 'outstanding-balances-report', labelKey: 'outstandingBalancesReport' },
    ],
  },
  {
    slug: 'hr',
    labelKey: 'hr',
    items: [
      { slug: 'employees', labelKey: 'employees' },
      { slug: 'payroll-journal', labelKey: 'payrollJournal' },
      { slug: 'payroll-statement', labelKey: 'payrollStatement' },
    ],
  },
  {
    slug: 'setup',
    labelKey: 'setup',
    items: [
      { slug: 'customers', labelKey: 'customers' },
      { slug: 'suppliers', labelKey: 'suppliers' },
    ],
  },
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:3088';
const CHROME_PATH = '/var/www/essentra.mahmoudashry.site/chrome/linux-152.0.7977.64/chrome-linux64/chrome';

async function main() {
  console.log('====================================================');
  console.log('Mohasby Dashboard Shell — Playwright Route Verifier');
  console.log(`Target: ${BASE_URL}`);
  console.log('====================================================\n');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  let passed = 0;
  let failed = 0;
  const errors = [];

  const locales = ['ar', 'en'];

  for (const loc of locales) {
    const isAr = loc === 'ar';
    const messages = isAr ? arMessages : enMessages;
    const homePrefix = isAr ? '/dashboard' : '/en/dashboard';

    console.log(`\n--- Testing Locale: ${loc.toUpperCase()} (${isAr ? 'RTL' : 'LTR'}) ---`);

    // 1. Test Home Route
    try {
      const homeUrl = `${BASE_URL}${homePrefix}`;
      const res = await page.goto(homeUrl, { waitUntil: 'domcontentloaded' });
      if (!res || res.status() !== 200) {
        throw new Error(`Expected HTTP 200, got ${res ? res.status() : 'null'}`);
      }
      const title = await page.title();
      if (!title.includes('محاسبي') && !title.includes('Mohasby')) {
        throw new Error(`Unexpected title on home: ${title}`);
      }
      passed++;
      process.stdout.write(`  ✓ [Home] ${homePrefix} (200 OK)\n`);
    } catch (err) {
      failed++;
      errors.push({ route: homePrefix, error: err.message });
      process.stdout.write(`  ✗ [Home] ${homePrefix}: ${err.message}\n`);
    }

    // 2. Test All 44 Pages
    for (const group of NAV_GROUPS) {
      const groupTitle = messages.nav.groups[group.labelKey];

      for (const item of group.items) {
        const itemTitle = messages.nav.items[item.labelKey];
        const routePath = `${homePrefix}/${group.slug}/${item.slug}`;
        const fullUrl = `${BASE_URL}${routePath}`;

        try {
          const res = await page.goto(fullUrl, { waitUntil: 'domcontentloaded' });
          if (!res || res.status() !== 200) {
            throw new Error(`Expected HTTP 200, got ${res ? res.status() : 'null'}`);
          }

          // Assert Document Title
          const title = await page.title();
          const expectedTitleEnd = isAr ? 'محاسبي' : 'Mohasby';
          if (!title.includes(itemTitle) || !title.includes(expectedTitleEnd)) {
            throw new Error(`Title mismatch: expected to contain "${itemTitle}" and "${expectedTitleEnd}", got "${title}"`);
          }

          // Assert Breadcrumb Trail
          const breadcrumbText = await page.locator('nav[aria-label="Breadcrumb"]').innerText();
          if (!breadcrumbText.includes(itemTitle)) {
            throw new Error(`Breadcrumb missing item title: "${itemTitle}". Got: "${breadcrumbText}"`);
          }
          if (!breadcrumbText.includes(groupTitle)) {
            throw new Error(`Breadcrumb missing group title: "${groupTitle}". Got: "${breadcrumbText}"`);
          }

          // Assert Active Sidebar Item
          const activeSidebarItem = page.locator('aside a[aria-current="page"]');
          const activeCount = await activeSidebarItem.count();
          if (activeCount === 0) {
            throw new Error('No active sidebar item found with aria-current="page"');
          }
          const activeText = await activeSidebarItem.first().innerText();
          if (!activeText.includes(itemTitle)) {
            throw new Error(`Active item text mismatch: expected "${itemTitle}", got "${activeText}"`);
          }

          passed++;
          process.stdout.write(`  ✓ ${routePath}\n`);
        } catch (err) {
          failed++;
          errors.push({ route: routePath, error: err.message });
          process.stdout.write(`  ✗ ${routePath}: ${err.message}\n`);
        }
      }
    }
  }

  // 3. Test Branded 404 & 403 Pages
  console.log('\n--- Testing Shell Error Pages ---');
  for (const loc of ['ar', 'en']) {
    const isAr = loc === 'ar';
    const messages = isAr ? arMessages : enMessages;
    const prefix = isAr ? '/dashboard' : '/en/dashboard';

    // Test 403 Forbidden
    const forbiddenPath = `${prefix}/forbidden`;
    try {
      const res = await page.goto(`${BASE_URL}${forbiddenPath}`, { waitUntil: 'domcontentloaded' });
      if (!res || res.status() !== 200) {
        throw new Error(`Expected HTTP 200, got ${res ? res.status() : 'null'}`);
      }
      const heading = await page.locator('h1, h2').allInnerTexts();
      const expectedTitle = messages.shell.forbiddenTitle;
      if (!heading.some(h => h.includes(expectedTitle))) {
        throw new Error(`Expected heading "${expectedTitle}", found: ${heading.join(' | ')}`);
      }
      passed++;
      process.stdout.write(`  ✓ [403] ${forbiddenPath}\n`);
    } catch (err) {
      failed++;
      errors.push({ route: forbiddenPath, error: err.message });
      process.stdout.write(`  ✗ [403] ${forbiddenPath}: ${err.message}\n`);
    }
  }

  await browser.close();

  console.log('\n====================================================');
  console.log(`Route Verification Complete:`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${passed + failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    console.error('Failed Routes Details:');
    errors.forEach(e => console.error(` - ${e.route}: ${e.error}`));
    process.exit(1);
  } else {
    console.log('All 92 routes verified successfully with zero errors!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error running verify-all-routes:', err);
  process.exit(1);
});
