import { chromium } from "@playwright/test";
import path from "path";

const CHROME_PATH = "/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome";
const BASE_URL = "https://mohasby.mahmoudashry.site";
const ARTIFACTS_DIR = "/root/.gemini/antigravity-ide/brain/1a168ba3-767e-47cc-9d35-8ea12c3a5701/screenshots";

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: "ar-EG",
  });

  const page = await context.newPage();

  console.log("1. Capturing login screen...");
  await page.goto(`${BASE_URL}/ar/login`, { waitUntil: "networkidle" });
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, "08-login-username-autocomplete.png"),
    fullPage: false,
  });

  console.log("2. Logging in as qa-admin...");
  await page.fill("#identifier", "qa-admin");
  await page.fill("#password", "QaAdminPassword123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
  await page.waitForTimeout(2000);

  console.log("3. Navigating to Settings -> Users & Permissions...");
  await page.goto(`${BASE_URL}/ar/dashboard/setup/settings`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, "09-admin-permissions-matrix.png"),
    fullPage: true,
  });

  console.log("3b. Opening Add User modal...");
  const addUserBtn = page.locator('button:has-text("إضافة مستخدم جديد")');
  if (await addUserBtn.isVisible()) {
    await addUserBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "13-add-user-modal-matrix.png"),
      fullPage: false,
    });
    // Close modal by clicking cancel
    const cancelBtn = page.locator('button:has-text("إلغاء")');
    if (await cancelBtn.isVisible()) await cancelBtn.click();
  }

  console.log("4. Navigating to Audit Log...");
  await page.goto(`${BASE_URL}/ar/dashboard/setup/audit-log`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, "10-audit-log-details.png"),
    fullPage: false,
  });

  console.log("5. Clearing session and logging in as qa-auditor...");
  await context.clearCookies();
  await page.goto(`${BASE_URL}/ar/login`, { waitUntil: "networkidle" });
  await page.fill("#identifier", "qa-auditor");
  await page.fill("#password", "QaAuditorPassword123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
  await page.waitForTimeout(2000);

  console.log("6. Capturing employee repacked dashboard...");
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, "11-employee-repacked-dashboard.png"),
    fullPage: false,
  });

  console.log("7. Testing direct forbidden access to /ar/dashboard/setup/settings...");
  await page.goto(`${BASE_URL}/ar/dashboard/setup/settings`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, "12-forbidden-page.png"),
    fullPage: false,
  });

  await browser.close();
  console.log("All screenshots captured successfully!");
}

main().catch((err) => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
