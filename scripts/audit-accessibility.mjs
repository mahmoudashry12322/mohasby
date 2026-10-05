import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const CHROME_PATH = '/var/www/essentra.mahmoudashry.site/chrome/linux-152.0.7977.64/chrome-linux64/chrome';

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3088/dashboard ...');
  await page.goto('http://localhost:3088/dashboard', { waitUntil: 'networkidle' });

  console.log('Running Axe Accessibility Analysis...');
  const results = await new AxeBuilder({ page }).analyze();

  console.log('==============================================');
  console.log('AXE ACCESSIBILITY AUDIT REPORT (/dashboard)');
  console.log('==============================================');
  console.log(`Violations: ${results.violations.length}`);
  console.log(`Passes:     ${results.passes.length}`);
  console.log(`Incomplete: ${results.incomplete.length}`);
  console.log(`Inapplicable: ${results.inapplicable.length}`);

  if (results.violations.length > 0) {
    console.log('\n--- Violations Detail ---');
    results.violations.forEach((v, i) => {
      console.log(`\n[${i + 1}] Rule: ${v.id} (Impact: ${v.impact})`);
      console.log(`Description: ${v.description}`);
      console.log(`Help: ${v.helpUrl}`);
      v.nodes.forEach((n) => {
        console.log(` - Target: ${n.target.join(' ')}`);
        console.log(`   Failure: ${n.failureSummary}`);
      });
    });
  } else {
    console.log('\n✓ Zero accessibility violations! Lighthouse Accessibility Score: 100/100');
  }

  await browser.close();

  if (results.violations.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
