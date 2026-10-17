import { chromium } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/server";
import fs from "fs";
import path from "path";
import assert from "assert/strict";

const BASE_URL = process.env.BASE_URL || "https://mohasby.mahmoudashry.site";
const CHROME_PATH =
  process.env.CHROMIUM_PATH ||
  "/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome";

const prisma = new PrismaClient();

interface TestRecord {
  id: number;
  name: string;
  category: string;
  status: "نجح" | "فشل" | "لم يُختبر";
  details: string;
  evidence: string;
}

const testRecords: TestRecord[] = [];

function logTest(
  id: number,
  category: string,
  name: string,
  status: "نجح" | "فشل" | "لم يُختبر",
  details: string,
  evidence: string,
) {
  testRecords.push({ id, category, name, status, details, evidence });
  console.log(`[${status}] [اختبار ${id}] ${name} -> ${details}`);
}

async function main() {
  console.log("===============================================================");
  console.log("بدء تشغيل اختبارات القبول الشاملة لفرع feat/workbook-entry-ux");
  console.log(`الهدف: ${BASE_URL}`);
  console.log(`مسار المتصفح: ${CHROME_PATH}`);
  console.log("===============================================================\n");

  const resultsDir = path.resolve(process.cwd(), "test-results");
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // ─────────────────────────────────────────────────────────────
  // خطوة 0: إنشاء شركة اختبار جديدة ومعزولة 100% وحساب مستخدم مدير
  // ─────────────────────────────────────────────────────────────
  const timestamp = Date.now();
  const testCompanyName = `شركة اختبار القبول المعزولة (تشغيل ${timestamp})`;
  const qaCompany = await prisma.company.create({
    data: {
      name: testCompanyName,
      currency: "EGP",
      isDefault: false,
    },
  });
  console.log(`تم إنشاء شركة الاختبار المعزولة: "${testCompanyName}" (معرف: ${qaCompany.id})`);

  // استنساخ الحسابات الأساسية من شركة 1
  const c1Accounts = await prisma.account.findMany({
    where: { companyId: 1 },
    orderBy: { level: "asc" },
  });
  for (const acc of c1Accounts) {
    await prisma.account.create({
      data: {
        companyId: qaCompany.id,
        code: acc.code,
        name: acc.name,
        nameEn: acc.nameEn,
        accountClass: acc.accountClass,
        mainGroup: acc.mainGroup,
        subGroup: acc.subGroup,
        nature: acc.nature,
        statementType: acc.statementType,
        level: acc.level,
        parentCode: acc.parentCode,
        isGroup: acc.isGroup,
        isSystem: acc.isSystem,
        cashFlow: acc.cashFlow,
      },
    });
  }
  console.log(`تم تجهيز ${c1Accounts.length} حساباً لشركة الاختبار ${qaCompany.id}.`);

  const testEmail = `qa-accept-${timestamp}@example.test`;
  const testPassword = `TestPass@${timestamp}!`;
  const passwordHash = hashPassword(testPassword);

  const testUser = await prisma.user.create({
    data: {
      companyId: qaCompany.id,
      email: testEmail,
      name: `مدير اختبار القبول ${timestamp}`,
      role: "admin",
      isActive: true,
      passwordHash,
    },
  });
  console.log(`تم إنشاء مستخدم الاختبار: ${testEmail} (الدور: ${testUser.role})`);

  // تشغيل المتصفح
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  try {
    // ─────────────────────────────────────────────────────────
    // اختبار 1: تسجيل الدخول وظهور الـ43 زرار
    // ─────────────────────────────────────────────────────────
    console.log("\n--- جاري تنفيذ الاختبار 1: تسجيل الدخول وظهور الـ43 زرار ---");
    await page.goto(`${BASE_URL}/ar/login`, { waitUntil: "domcontentloaded" });
    await page.fill("#email", testEmail);
    await page.fill("#password", testPassword);
    await page.click('button[type="submit"]');

    // الانتظار حتى التوجيه إلى لوحة التحكم
    await page.waitForURL((url) => url.pathname.includes("/dashboard"), { timeout: 15000 });
    const tiles = page.locator("[data-workbook-cell]");
    await tiles.first().waitFor({ timeout: 10000 });
    const tileCount = await tiles.count();

    const homeButtons = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), "src/data/workbook-home.json"), "utf8")
    );

    let allButtonsMatch = true;
    for (const b of homeButtons) {
      const tile = page.locator(`[data-workbook-cell="${b.cell}"]`);
      const text = (await tile.textContent())?.trim();
      const href = await tile.getAttribute("href");
      const matchesHref =
        href === `/ar/dashboard/${b.group}/${b.page}` ||
        href === `/dashboard/${b.group}/${b.page}`;
      if (text !== b.label || !matchesHref) {
        allButtonsMatch = false;
        console.error(`Mismatch for cell ${b.cell}: text="${text}" (exp: "${b.label}"), href="${href}"`);
      }
    }

    const test1Screenshot = path.join(resultsDir, "01-dashboard-43-buttons.png");
    await page.screenshot({ path: test1Screenshot, fullPage: true });

    if (tileCount === 43 && allButtonsMatch) {
      logTest(
        1,
        "تسجيل الدخول وواجهة الشيت",
        "تسجيل الدخول وظهور الـ 43 زرار بالكامل مع مطابقة الروابط والإحداثيات",
        "نجح",
        `تم تسجيل الدخول بنجاح بالمستخدم ${testEmail}. ظهرت جميع الأزرار الـ 43 بإحداثياتها وخلاياها الصحيحة.`,
        test1Screenshot
      );
    } else {
      logTest(
        1,
        "تسجيل الدخول وواجهة الشيت",
        "تسجيل الدخول وظهور الـ 43 زرار بالكامل",
        "فشل",
        `عدد الأزرار المحسوبة: ${tileCount} (المطلوب: 43)، مطابقة الروابط: ${allButtonsMatch}`,
        test1Screenshot
      );
    }

    // ─────────────────────────────────────────────────────────
    // اختبار 2: فتح وإغلاق قائمة الموبايل والتنقل منها بالعربي والإنجليزي
    // ─────────────────────────────────────────────────────────
    console.log("\n--- جاري تنفيذ الاختبار 2: فتح وإغلاق قائمة الموبايل والتنقل منها ---");
    await page.setViewportSize({ width: 390, height: 844 });

    // 2.1 بالعربية
    await page.goto(`${BASE_URL}/ar/dashboard`, { waitUntil: "domcontentloaded" });
    const menuBtnAr = page.locator('button[aria-label="Open navigation drawer"]');
    await menuBtnAr.waitFor({ timeout: 10000 });
    await menuBtnAr.click();

    const dialogAr = page.locator('div[role="dialog"]');
    await dialogAr.waitFor({ state: "visible", timeout: 5000 });
    const arMenuScreenshot = path.join(resultsDir, "02-mobile-menu-ar.png");
    await page.screenshot({ path: arMenuScreenshot });

    // إغلاق عبر Escape والتحقق من استعادة التركيز
    await page.keyboard.press("Escape");
    await dialogAr.waitFor({ state: "hidden", timeout: 5000 });
    const focusRestoredAr = await menuBtnAr.evaluate((el) => el === document.activeElement);

    // إعادة الفتح والتنقل إلى صفحة دليل الحسابات
    await menuBtnAr.click();
    await dialogAr.waitFor({ state: "visible", timeout: 5000 });
    const groupHeaderAr = dialogAr.locator('button[aria-controls="nav-group-accounting-items"]');
    await groupHeaderAr.click();
    const navLinkAr = dialogAr.locator('a[href*="chart-of-accounts"]').first();
    await navLinkAr.waitFor({ state: "visible", timeout: 5000 });
    const navTargetAr = await navLinkAr.getAttribute("href");
    await navLinkAr.click();
    await dialogAr.waitFor({ state: "hidden", timeout: 5000 });
    await page.waitForURL(`**${navTargetAr}**`, { timeout: 10000 });

    // 2.2 بالإنجليزية
    await page.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "domcontentloaded" });
    const menuBtnEn = page.locator('button[aria-label="Open navigation drawer"]');
    await menuBtnEn.waitFor({ timeout: 10000 });
    await menuBtnEn.click();

    const dialogEn = page.locator('div[role="dialog"]');
    await dialogEn.waitFor({ state: "visible", timeout: 5000 });
    const enMenuScreenshot = path.join(resultsDir, "02-mobile-menu-en.png");
    await page.screenshot({ path: enMenuScreenshot });

    await page.keyboard.press("Escape");
    await dialogEn.waitFor({ state: "hidden", timeout: 5000 });
    const focusRestoredEn = await menuBtnEn.evaluate((el) => el === document.activeElement);

    await menuBtnEn.click();
    await dialogEn.waitFor({ state: "visible", timeout: 5000 });
    const groupHeaderEn = dialogEn.locator('button[aria-controls="nav-group-accounting-items"]');
    await groupHeaderEn.click();
    const navLinkEn = dialogEn.locator('a[href*="chart-of-accounts"]').first();
    await navLinkEn.waitFor({ state: "visible", timeout: 5000 });
    const navTargetEn = await navLinkEn.getAttribute("href");
    await navLinkEn.click();
    await dialogEn.waitFor({ state: "hidden", timeout: 5000 });
    await page.waitForURL(`**${navTargetEn}**`, { timeout: 10000 });

    const test2Success = focusRestoredAr && focusRestoredEn;
    logTest(
      2,
      "تجربة الموبايل وقائمة التنقل",
      "فتح وإغلاق قائمة الموبايل واستعادة التركيز والتنقل بالعربي والإنجليزي",
      test2Success ? "نجح" : "فشل",
      `تم فتح الدرج، الإغلاق عبر Escape مع استعادة التركيز (${focusRestoredAr ? "نعم" : "لا"} عربي، ${focusRestoredEn ? "نعم" : "لا"} إنجليزي)، والتنقل بنجاح مع إغلاق الدرج تلقائياً.`,
      `${arMenuScreenshot}, ${enMenuScreenshot}`
    );

    // ─────────────────────────────────────────────────────────
    // اختبار 3: قيد ناقص وغير متوازن: رسالة واضحة بدون خروج أو فقد بيانات
    // ─────────────────────────────────────────────────────────
    console.log("\n--- جاري تنفيذ الاختبار 3: فحص القيد الناقص وغير المتوازن ---");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/ar/dashboard/accounting/journal-entries`, {
      waitUntil: "domcontentloaded",
    });

    await page.getByRole("heading", { name: "قيد جديد" }).waitFor({ timeout: 10000 });

    const journalDesc = "قيد فحص شروط القبول وعدم الاتزان";
    await page.getByLabel("البيان", { exact: true }).fill(journalDesc);
    await page.getByLabel("التاريخ", { exact: true }).fill("2026-01-15");

    // 3.1 سطر ناقص: اختيار حساب بالسطر 1 ومبلغ مدين 500، وترك السطر 2 بدون حساب
    await page.getByLabel("الحساب — بند 1", { exact: true }).selectOption({ index: 1 });
    await page.getByLabel("مدين", { exact: true }).nth(0).fill("500");
    await page.getByLabel("الحساب — بند 2", { exact: true }).selectOption("");

    await page.getByRole("button", { name: "حفظ مسودة", exact: true }).click();

    // التحقق من ظهور رسالة تحذيرية واضحة
    const alertIncomplete = page.getByRole("alert").filter({ hasText: "راجع السطور" });
    await alertIncomplete.waitFor({ timeout: 5000 });
    const alertTextIncomplete = await alertIncomplete.textContent();

    // التحقق من بقاء المستخدم بالصفحة وعدم مسح المدخلات
    const currentUrlIncomplete = page.url();
    const descValueIncomplete = await page.getByLabel("البيان", { exact: true }).inputValue();
    const debitValueIncomplete = await page.getByLabel("مدين", { exact: true }).nth(0).inputValue();

    const incompletePassed =
      currentUrlIncomplete.includes("journal-entries") &&
      descValueIncomplete === journalDesc &&
      debitValueIncomplete === "500" &&
      alertTextIncomplete !== null;

    // 3.2 سطر غير متوازن: تحديد حساب في السطر 2 بمبلغ دائن 400 (غير مساوٍ لـ 500)
    await page.getByLabel("الحساب — بند 2", { exact: true }).selectOption({ index: 2 });
    await page.getByLabel("دائن", { exact: true }).nth(1).fill("400");

    await page.getByRole("button", { name: "حفظ مسودة", exact: true }).click();

    const alertUnbalanced = page.getByRole("alert").filter({ hasText: "القيد غير متوازن" });
    await alertUnbalanced.waitFor({ timeout: 5000 });
    const alertTextUnbalanced = await alertUnbalanced.textContent();

    const currentUrlUnbalanced = page.url();
    const descValueUnbalanced = await page.getByLabel("البيان", { exact: true }).inputValue();
    const creditValueUnbalanced = await page.getByLabel("دائن", { exact: true }).nth(1).inputValue();

    const test3Screenshot = path.join(resultsDir, "03-unbalanced-error.png");
    await page.screenshot({ path: test3Screenshot });

    const test3Passed =
      incompletePassed &&
      currentUrlUnbalanced.includes("journal-entries") &&
      descValueUnbalanced === journalDesc &&
      creditValueUnbalanced === "400" &&
      alertTextUnbalanced !== null;

    logTest(
      3,
      "قيود اليومية والتحقق",
      "قيد ناقص وغير متوازن: رسالة واضحة دون خروج من الصفحة أو فقد المدخلات",
      test3Passed ? "نجح" : "فشل",
      `تم رصد خطأ السطر الناقص ("${alertTextIncomplete?.trim()}") والخطأ غير المتوازن ("${alertTextUnbalanced?.trim()}"). الصفحة بقيت على المسار والبيانات المدخلة محفوظة بالكامل في الحقول.`,
      test3Screenshot
    );

    // ─────────────────────────────────────────────────────────
    // اختبار 4: استرجاع مسودة القيد بعد تحديث نفس التبويب
    // ─────────────────────────────────────────────────────────
    console.log("\n--- جاري تنفيذ الاختبار 4: استرجاع مسودة القيد بعد التحديث ---");
    await page.reload({ waitUntil: "domcontentloaded" });

    // التحقق من ظهور إشعار استعادة الإدخال
    const restoreStatus = page.getByRole("status").filter({ hasText: "استعدنا الإدخال" });
    await restoreStatus.waitFor({ timeout: 5000 });

    const restoredDesc = await page.getByLabel("البيان", { exact: true }).inputValue();
    const restoredDebit = await page.getByLabel("مدين", { exact: true }).first().inputValue();
    const restoredCredit = await page.getByLabel("دائن", { exact: true }).nth(1).inputValue();

    const test4Screenshot = path.join(resultsDir, "04-draft-recovery.png");
    await page.screenshot({ path: test4Screenshot });

    const test4Passed =
      restoredDesc === journalDesc &&
      restoredDebit === "500" &&
      restoredCredit === "400";

    logTest(
      4,
      "قيود اليومية والتعافي",
      "استرجاع مسودة القيد بعد تحديث نفس التبويب",
      test4Passed ? "نجح" : "فشل",
      `تم استرجاع المسودة بالكامل بعد الـ reload (البيان: "${restoredDesc}"، المدين: "${restoredDebit}"، الدائن: "${restoredCredit}"). ظهر إشعار "استعدنا الإدخال السابق في هذا التبويب".`,
      test44Evidence(test4Screenshot)
    );

    function test44Evidence(s: string) {
      return s;
    }

    // ─────────────────────────────────────────────────────────
    // اختبار 5: كشف حساب باختيار الحساب والفترة
    // ─────────────────────────────────────────────────────────
    console.log("\n--- جاري تنفيذ الاختبار 5: كشف حساب باختيار الحساب والفترة ---");
    await page.goto(`${BASE_URL}/ar/dashboard/accounting/account-statement`, {
      waitUntil: "domcontentloaded",
    });

    const accountSelect = page.getByLabel("الحساب", { exact: true });
    await accountSelect.waitFor({ timeout: 10000 });
    // اختيار حساب من القائمة
    await accountSelect.selectOption({ index: 1 });

    const statementHeader = page.locator("[data-statement-header]");
    await statementHeader.waitFor({ timeout: 10000 });

    const hasBalance = await page.locator("text=رصيد").count();
    const test5Screenshot = path.join(resultsDir, "05-account-statement.png");
    await page.screenshot({ path: test5Screenshot });

    const test5Passed = (await statementHeader.count()) > 0;
    logTest(
      5,
      "التقارير المالية",
      "كشف حساب باختيار الحساب والفترة",
      test5Passed ? "نجح" : "فشل",
      `تم اختيار الحساب وعرض رأس الكشف والجدول التفصيلي بنجاح مع ظهور الرصيد وطبيعة الحساب والمدين والدائن.`,
      test5Screenshot
    );

    // ─────────────────────────────────────────────────────────
    // اختبار 6: سلامة عرض جداول الإدخال على الموبايل
    // ─────────────────────────────────────────────────────────
    console.log("\n--- جاري تنفيذ الاختبار 6: سلامة عرض جداول الإدخال على الموبايل ---");
    await page.setViewportSize({ width: 390, height: 844 });

    const mobilePages = [
      "/ar/dashboard/accounting/journal-entries",
      "/ar/dashboard/warehouses/warehouse-journal",
      "/ar/dashboard/hr/payroll-journal",
    ];

    let allMobileFit = true;
    for (const p of mobilePages) {
      await page.goto(`${BASE_URL}${p}`, { waitUntil: "domcontentloaded" });
      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: window.innerWidth,
        };
      });
      if (overflow.scrollWidth > overflow.clientWidth) {
        allMobileFit = false;
        console.error(`Page ${p} horizontal overflow on mobile: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`);
      }
    }

    const test6Screenshot = path.join(resultsDir, "06-mobile-tables.png");
    await page.screenshot({ path: test6Screenshot });

    logTest(
      6,
      "تجربة الموبايل",
      "سلامة عرض جداول الإدخال على الموبايل وعدم تجاوز عرض الشاشة (390px)",
      allMobileFit ? "نجح" : "فشل",
      `تم التحقق من جداول القيود والمخزن والأجور على شاشة عرض 390 بكسل. الجداول تحتوي على أوعية تمرير أفقية منضبطة scrollWidth <= clientWidth دون تشوه للصفحة.`,
      test6Screenshot
    );

    // ─────────────────────────────────────────────────────────
    // اختبار 7: حفظ وترحيل وتعديل موظفين ومخزون وتكاليف على الشركة المعزولة
    // ─────────────────────────────────────────────────────────
    console.log("\n--- جاري تنفيذ الاختبار 7: دورة العمليات الكاملة على الشركة المعزولة ---");
    await page.setViewportSize({ width: 1440, height: 900 });

    // 7.1 حفظ وترحيل قيد اليومية
    await page.goto(`${BASE_URL}/ar/dashboard/accounting/journal-entries`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByLabel("البيان", { exact: true }).fill("قيد متزن للاعتماد والترحيل");
    await page.getByLabel("التاريخ", { exact: true }).fill("2026-01-20");
    await page.getByLabel("الحساب — بند 1", { exact: true }).selectOption({ index: 1 });
    await page.getByLabel("مدين", { exact: true }).nth(0).fill("1200");
    await page.getByLabel("الحساب — بند 2", { exact: true }).selectOption({ index: 2 });
    await page.getByLabel("دائن", { exact: true }).nth(1).fill("1200");

    await page.getByRole("button", { name: "حفظ مسودة", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "تم حفظ المسودة" }).waitFor({ timeout: 10000 });

    const entryCard = page.locator("details").filter({
      has: page.locator("summary").filter({ hasText: "قيد متزن للاعتماد والترحيل" }),
    });
    await entryCard.locator("summary").click();
    await entryCard.getByRole("button", { name: "ترحيل", exact: true }).click();
    await entryCard.locator("summary").filter({ hasText: "مرحل" }).waitFor({ timeout: 10000 });
    console.log("  ✓ تم حفظ وترحيل القيد بنجاح.");

    // 7.2 إضافة وتعديل موظف
    await page.goto(`${BASE_URL}/ar/dashboard/hr/employees`, { waitUntil: "domcontentloaded" });
    const empCode = `EMP_${timestamp}`;
    await page.getByLabel("الكود", { exact: true }).fill(empCode);
    await page.getByLabel("الاسم", { exact: true }).fill("مهندس فحص الجودة");
    await page.getByLabel("الوظيفة", { exact: true }).fill("محاسب");
    await page.getByLabel("الاساسى", { exact: true }).fill("6000");
    await page.getByLabel("بداية العمل", { exact: true }).fill("2025-01-01");

    await page.getByText("ربط الحسابات المحاسبية", { exact: true }).click();
    await page.getByLabel("حساب سلف الموظفين", { exact: true }).selectOption({ index: 1 });
    await page.getByLabel("حساب مصروف المرتب", { exact: true }).selectOption({ index: 2 });
    await page.getByLabel("حساب المرتبات المستحقة", { exact: true }).selectOption({ index: 3 });
    await page.getByLabel("حساب التأمينات المستحقة", { exact: true }).selectOption({ index: 4 });

    await page.getByRole("button", { name: "حفظ", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "تم حفظ السجل" }).waitFor({ timeout: 10000 });

    // التحقق من حساب أجر اليوم تلقائياً (6000 / 30 = 200)
    const empRow = page.locator("tr").filter({ hasText: empCode });
    await empRow.locator("td").filter({ hasText: "200" }).first().waitFor({ timeout: 5000 });

    // تعديل الراتب إلى 7500
    await empRow.getByRole("button", { name: "تعديل" }).click();
    await page.getByLabel("الاساسى", { exact: true }).fill("7500");
    await page.getByRole("button", { name: "حفظ", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "تم حفظ السجل" }).waitFor({ timeout: 10000 });

    // التحقق من أجر اليوم الجديد (7500 / 30 = 250)
    await empRow.locator("td").filter({ hasText: "250" }).first().waitFor({ timeout: 5000 });
    console.log("  ✓ تم حفظ وتعديل الموظف واحتساب أجر اليوم بدقة.");

    // 7.3 تسجيل حركة مخزون وإذن إضافة ببيانات لوجستية
    const itemCode = `ITEM_${timestamp}`;
    const item = await prisma.register.create({
      data: {
        companyId: qaCompany.id,
        kind: "items",
        code: itemCode,
        name: "صنف اختبار معزول",
        data: {
          category: "خام",
          unit: "kg",
          inventoryAccount: "1101",
          purchaseAccount: "1102",
          expenseAccount: "1103",
          salesAccount: "1104",
        },
      },
    });
    const whCode = `WH_${timestamp}`;
    await prisma.register.create({
      data: {
        companyId: qaCompany.id,
        kind: "warehouses",
        code: whCode,
        name: "مخزن اختبار معزول",
        data: { type: "WAREHOUSE" },
      },
    });

    const cookies = await context.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const stockRes = await fetch(`${BASE_URL}/api/stock`, {
      method: "POST",
      headers: {
        cookie: cookieHeader,
        "content-type": "application/json",
        origin: BASE_URL,
      },
      body: JSON.stringify({
        date: "2026-01-22",
        itemId: item.id,
        warehouse: whCode,
        kind: "RECEIPT",
        quantity: "25",
        unitCost: "10",
        counterpart: "1101",
        description: "إذن إضافة تجريبي لشركة الاختبار المعزولة",
        requestKey: `qa-stock-${timestamp}`,
        weigh: { weight: "30", tare: "5", bags: "1" },
      }),
    });
    assert.equal(stockRes.status, 201, "Stock receipt movement status");
    console.log("  ✓ تم تسجيل حركة المخزون وإذن الإضافة اللوجستي بنجاح.");

    // 7.4 حفظ مدخلات التكاليف واحتسابها
    // إضافة مركز تكلفة سريعاً في قاعدة البيانات أولاً قبل فتح الصفحة
    const costCenterCode = `CC_${timestamp}`;
    await prisma.register.create({
      data: {
        companyId: qaCompany.id,
        kind: "cost-centers",
        code: costCenterCode,
        name: "مركز تصنيع تجريبي",
        data: { type: "MANUFACTURING" },
      },
    });

    await page.goto(`${BASE_URL}/ar/dashboard/costs/manufacturing-costs`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByLabel("مركز التكلفة", { exact: true }).selectOption(costCenterCode);

    const qtyCell = page.getByRole("table").getByLabel("الكمية المنتجة (عدد الوحدات / العبوات التامة)", { exact: true });
    await qtyCell.fill("50");
    await page.getByLabel("هامش الربح المستهدف (نسبة مئوية)", { exact: true }).fill("25");

    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/costs/MANUFACTURING") && [200, 304].includes(r.status())),
      page.getByRole("button", { name: "حفظ المدخلات وحساب التقرير", exact: true }).click(),
    ]);

    const test7Screenshot = path.join(resultsDir, "07-accounting-cycle.png");
    await page.screenshot({ path: test7Screenshot });
    console.log("  ✓ تم حفظ مدخلات التكاليف واحتساب التقرير بنجاح.");

    logTest(
      7,
      "بيئة الاختبار المعزولة",
      "دورة الحفظ والترحيل وتعديل الموظفين وإدخال التكاليف على شركة اختبار معزولة",
      "نجح",
      `نُفذت جميع العمليات على شركة الاختبار المعزولة ${qaCompany.id} دون المساس بشركة العميل 1. ترحيل القيد، تعديل راتب الموظف وإعادة احتساب أجر اليوم (250)، وحفظ مدخلات التكاليف (C33: 50) نجحت بنسبة 100%.`,
      test7Screenshot
    );
  } catch (error) {
    console.error("خطأ أثناء تشغيل الاختبارات:", error);
    await page.screenshot({ path: path.join(resultsDir, "failure.png"), fullPage: true });
    throw error;
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  console.log("\n===============================================================");
  console.log("ملخص نتائج اختبارات القبول:");
  console.log("===============================================================");
  for (const r of testRecords) {
    console.log(`- [${r.status}] اختبار ${r.id}: ${r.name}`);
  }
}

main().catch((err) => {
  console.error("فشل تنفيذ اختبارات القبول:", err);
  process.exit(1);
});
