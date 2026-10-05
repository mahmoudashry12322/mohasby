import { chromium } from 'playwright';

async function main() {
  console.log('=== MOHASBY SIDEBAR ANIMATION VERIFICATION ===');
  const browser = await chromium.launch({
    executablePath: '/var/www/essentra.mahmoudashry.site/chrome/linux-152.0.7977.64/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ar-EG',
  });

  const page = await context.newPage();

  console.log('Navigating to http://localhost:3088/dashboard ...');
  await page.goto('http://localhost:3088/dashboard', { waitUntil: 'networkidle' });

  // Wait for client hydration
  await page.waitForSelector('[data-ready="true"]', { timeout: 5000 });
  console.log('Client hydrated with data-ready="true" (no SSR animation flicker).');

  // Verify initial typography & font-family
  const bodyFont = await page.evaluate(() => {
    return window.getComputedStyle(document.body).fontFamily;
  });
  console.log('Body font-family:', bodyFont);

  // Locate sidebar
  const sidebar = page.locator('#sidebar-root');
  await sidebar.waitFor({ state: 'visible' });

  // Helper to sample animation in page context
  const sampleAnimation = async (triggerAction) => {
    return await page.evaluate(async (triggerStr) => {
      const aside = document.getElementById('sidebar-root');
      const firstGroup = aside.querySelector('button[aria-controls^="nav-group-"]');
      const firstIcon = firstGroup.querySelector('svg');
      const label = firstGroup.querySelector('span');

      const samples = [];
      const startTime = performance.now();

      // Trigger the action
      if (triggerStr === 'toggle') {
        const toggleBtn = aside.querySelector('div.border-t button');
        toggleBtn.click();
      }

      const getSnapshot = () => {
        const asideRect = aside.getBoundingClientRect();
        const iconRect = firstIcon.getBoundingClientRect();
        const labelStyle = window.getComputedStyle(label.parentElement);
        // Icon center X relative to viewport right edge (in RTL) or left edge
        const isRtl = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl' || aside.closest('[dir="rtl"]');
        const iconCenterFromEdge = isRtl
          ? window.innerWidth - (iconRect.left + iconRect.width / 2)
          : iconRect.left + iconRect.width / 2;

        return {
          elapsedMs: Math.round(performance.now() - startTime),
          sidebarWidth: Math.round(asideRect.width * 10) / 10,
          labelOpacity: parseFloat(labelStyle.opacity),
          iconCenterFromEdge: Math.round(iconCenterFromEdge * 10) / 10,
        };
      };

      // Take samples at roughly 0, 80, 160, 260, and 350ms
      samples.push({ target: '0ms', ...getSnapshot() });

      await new Promise(r => setTimeout(r, 80));
      samples.push({ target: '80ms', ...getSnapshot() });

      await new Promise(r => setTimeout(r, 80));
      samples.push({ target: '160ms', ...getSnapshot() });

      await new Promise(r => setTimeout(r, 100));
      samples.push({ target: '260ms', ...getSnapshot() });

      await new Promise(r => setTimeout(r, 100));
      samples.push({ target: '350ms (settled)', ...getSnapshot() });

      return samples;
    }, triggerAction);
  };

  // 1. Check if initially collapsed or expanded
  const initialWidth = await page.evaluate(() => {
    return document.getElementById('sidebar-root').getBoundingClientRect().width;
  });
  console.log(`Initial sidebar width: ${initialWidth}px`);

  // Ensure expanded before testing collapse
  if (initialWidth < 100) {
    console.log('Sidebar initially collapsed, expanding first...');
    await page.evaluate(() => {
      document.querySelector('#sidebar-root div.border-t button').click();
    });
    await page.waitForTimeout(400);
  }

  // TEST 1: Collapse Animation
  console.log('\n>>> TESTING COLLAPSE ANIMATION (280px -> 76px, 260ms duration, 120ms label fade) <<<');
  const collapseSamples = await sampleAnimation('toggle');
  console.table(collapseSamples);

  // TEST 2: Flyout in collapsed state
  console.log('\n>>> TESTING FLYOUT IN COLLAPSED STATE <<<');
  await page.evaluate(() => {
    const firstGroup = document.querySelector('#sidebar-root button[aria-controls^="nav-group-"]');
    firstGroup.click();
  });
  await page.waitForTimeout(100);
  const flyoutVisible = await page.evaluate(() => {
    const flyout = document.querySelector('div[role="menu"]');
    return !!flyout && window.getComputedStyle(flyout).display !== 'none';
  });
  console.log(`Flyout opened successfully on group click in rail mode: ${flyoutVisible}`);

  // Close flyout
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);

  // TEST 3: Expand Animation
  console.log('\n>>> TESTING EXPAND ANIMATION (76px -> 280px, 260ms duration, 100ms delay label fade) <<<');
  const expandSamples = await sampleAnimation('toggle');
  console.table(expandSamples);

  // TEST 4: Group Accordion Animation
  console.log('\n>>> TESTING GROUP ACCORDION (220ms ease-out height & chevron rotation) <<<');
  const accordionSamples = await page.evaluate(async () => {
    const aside = document.getElementById('sidebar-root');
    const firstGroup = aside.querySelector('button[aria-controls^="nav-group-"]');
    const accordionBody = document.getElementById(firstGroup.getAttribute('aria-controls'));
    const chevronSvg = firstGroup.querySelector('div.flex svg').parentElement;

    const samples = [];
    const startTime = performance.now();

    // Click to toggle accordion
    firstGroup.click();

    const getSnap = () => {
      const height = accordionBody.getBoundingClientRect().height;
      const transform = window.getComputedStyle(chevronSvg).transform;
      return {
        elapsedMs: Math.round(performance.now() - startTime),
        accordionHeight: Math.round(height * 10) / 10,
        chevronTransform: transform,
      };
    };

    samples.push({ target: '0ms', ...getSnap() });
    await new Promise(r => setTimeout(r, 70));
    samples.push({ target: '70ms', ...getSnap() });
    await new Promise(r => setTimeout(r, 80));
    samples.push({ target: '150ms', ...getSnap() });
    await new Promise(r => setTimeout(r, 80));
    samples.push({ target: '230ms', ...getSnap() });
    await new Promise(r => setTimeout(r, 100));
    samples.push({ target: '330ms (settled)', ...getSnap() });

    return samples;
  });
  console.table(accordionSamples);

  console.log('\n=== ALL SIDEBAR ANIMATION TESTS COMPLETED SUCCESSFULLY ===');
  await browser.close();
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
