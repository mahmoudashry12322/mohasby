import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaClient } from "@prisma/client";
import { spawn } from "node:child_process";
import { createHash, scryptSync } from "node:crypto";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import homeButtons from "../src/data/workbook-home.json";
const fetch = (url: string, init?: RequestInit) =>
  globalThis.fetch(url, {
    ...init,
    signal: init?.signal || AbortSignal.timeout(15000),
  });

async function main() {
  await fs.mkdir("test-results", { recursive: true });
  const db = await PGlite.create();
  for (const folder of (await fs.readdir("prisma/migrations"))
    .filter((f) => /^\d/.test(f))
    .sort())
    await db.exec(
      await fs.readFile(
        "prisma/migrations/" + folder + "/migration.sql",
        "utf8",
      ),
    );
  const server = new PGLiteSocketServer({ db, host: "127.0.0.1", port: 55441 });
  await server.start();
  const url =
    "postgresql://postgres:postgres@127.0.0.1:55441/postgres?connection_limit=1&statement_cache_size=0";
  const prisma = new PrismaClient({ datasourceUrl: url });
  const company = await prisma.company.create({
    data: { name: "شركة الاختبار" },
  });
  const password = "Integration-test-2468!",
    salt = "fixture-salt",
    passwordHash = salt + ":" + scryptSync(password, salt, 64).toString("hex");
  await prisma.user.create({
    data: {
      companyId: company.id,
      email: "admin@example.test",
      name: "مدير الاختبار",
      role: "admin",
      passwordHash,
    },
  });
  await prisma.user.create({
    data: {
      companyId: company.id,
      email: "auditor@example.test",
      name: "المراجع",
      role: "auditor",
      passwordHash,
    },
  });
  for (const [code, name, accountClass, nature, statementType] of [
    ["100", "الخزينة", "الأصول", "مدين", "قائمة المركز المالي"],
    ["110", "المخزون", "الأصول", "مدين", "قائمة المركز المالي"],
    ["200", "الموردين", "الخصوم", "دائن", "قائمة المركز المالي"],
    ["300", "رأس المال", "حقوق الملكية", "دائن", "قائمة المركز المالي"],
    ["400", "المبيعات", "الإيرادات", "دائن", "قائمة الدخل"],
    ["500", "المشتريات", "المصروفات", "مدين", "قائمة الدخل"],
    ["510", "تغير المخزون", "المصروفات", "مدين", "قائمة الدخل"],
    ["120", "سلف الموظفين", "الأصول", "مدين", "قائمة المركز المالي"],
    ["210", "مرتبات مستحقة", "الخصوم", "دائن", "قائمة المركز المالي"],
    ["220", "تأمينات مستحقة", "الخصوم", "دائن", "قائمة المركز المالي"],
    ["520", "مصروف المرتبات", "المصروفات", "مدين", "قائمة الدخل"],
  ])
    await prisma.account.create({
      data: {
        companyId: company.id,
        code,
        name,
        accountClass,
        nature,
        statementType,
        level: 1,
      },
    });
  await prisma.$disconnect();
  await db.exec("DEALLOCATE ALL");
  const child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "-H",
      "127.0.0.1",
      "-p",
      "3099",
    ],
    {
      env: {
        ...process.env,
        DATABASE_URL: url,
        APP_URL: "http://localhost:3099",
        NODE_ENV: "production",
        ASSISTANT_PROVIDER: "mock",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let log = "";
  child.stdout.on("data", (d) => {
    log += d;
    process.stdout.write(d);
  });
  child.stderr.on("data", (d) => {
    log += d;
    process.stderr.write(d);
  });
  const base = "http://localhost:3099";
  let browser;
  console.log("HTTP: starting production server");
  try {
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try {
        await fetch(base + "/api/auth/me", {
          signal: AbortSignal.timeout(1000),
        });
        ready = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    assert.ok(ready, log);
    console.log("HTTP: checking sessions");
    const anon = await fetch(base + "/api/accounts");
    assert.equal(anon.status, 401);
    assert.equal(
      (
        await fetch(base + "/api/accounts", {
          headers: { cookie: "mohasby_session=forged" },
        })
      ).status,
      401,
    );
    async function login(email: string) {
      const r = await fetch(base + "/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      assert.equal(r.status, 200, await r.clone().text());
      return r.headers.get("set-cookie")!.split(";")[0];
    }
    const cookie = await login("admin@example.test");
    async function call(path: string, body?: unknown, session = cookie) {
      const response = await fetch(base + path, {
        method: body ? "POST" : "GET",
        headers: { cookie: session, "content-type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { status: response.status, data: await response.json() };
    }
    assert.equal(
      (await call("/api/accounts?companyId=999")).data.accounts.length,
      11,
    );
    console.log("HTTP: checking ledger");
    const draft = await call("/api/journal", {
      date: "2026-01-01",
      description: "قيد افتتاحي",
      kind: "OPENING",
      requestKey: "http-test-opening",
      lines: [
        { accountCode: "100", debit: "1000" },
        { accountCode: "300", credit: "1000" },
      ],
    });
    assert.equal(draft.status, 201, JSON.stringify(draft.data));
    assert.equal(
      (await call("/api/journal/" + draft.data.entry.id, { action: "post" }))
        .status,
      200,
    );
    assert.equal(
      (await call("/api/journal/" + draft.data.entry.id, { action: "post" }))
        .status,
      200,
    );
    const auditor = await login("auditor@example.test");
    assert.equal(
      (await call("/api/journal", { bad: true }, auditor)).status,
      403,
    );
    assert.equal((await call("/api/auth/logout", {}, auditor)).status, 200);
    const csrf = await fetch(base + "/api/journal", {
      method: "POST",
      headers: {
        cookie,
        origin: "https://attacker.invalid",
        "content-type": "application/json",
      },
      body: "{}",
    });
    assert.equal(csrf.status, 403);
    const assistant = await fetch(base + "/api/assistant/chat", {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({
        message: "كيف أدخل قيدًا؟",
        locale: "ar",
        currentRoute: "/ar/dashboard/accounting/journal-entries",
      }),
    });
    assert.equal(assistant.status, 200);
    const stream = await assistant.text();
    assert.match(stream, /data: \[DONE\]/);
    assert.match(stream, /مرحباً/);
    console.log("HTTP: checking documents");
    await call("/api/registers/parties", {
      code: "V1",
      name: "مورد الاختبار",
      data: { type: "SUPPLIER", accountCode: "200" },
    });
    await call("/api/registers/warehouses", {
      code: "W1",
      name: "المخزن الرئيسي",
      data: { type: "WAREHOUSE" },
    });
    await call("/api/registers/cost-centers", {
      code: "CE",
      name: "مركز تصدير الاختبار",
      data: { type: "EXPORT" },
    });
    const item = await call("/api/registers/items", {
      code: "I1",
      name: "صنف الاختبار",
      data: {
        category: "خام",
        unit: "kg",
        inventoryAccount: "110",
        purchaseAccount: "500",
        expenseAccount: "510",
        salesAccount: "400",
      },
    });
    assert.equal(item.status, 200, JSON.stringify(item.data));
    const doc = await call("/api/documents", {
      type: "PURCHASE",
      date: "2026-01-02",
      itemId: item.data.row.id,
      warehouse: "W1",
      party: "V1",
      accountCode: "200",
      quantity: "100",
      unitPrice: "20",
      description: "شراء اختباري",
      costCenter: "CE",
      requestKey: "http-test-purchase",
    });
    assert.equal(doc.status, 200, JSON.stringify(doc.data));
    assert.equal((await call("/api/stock")).data.balances[0].value, "2000.00");
    const exportCost = await call("/api/costs/EXPORT?center=CE");
    assert.equal(exportCost.status, 200);
    assert.equal(exportCost.data.values.C8, "100");
    assert.equal(exportCost.data.values.E8, "2000");
    for (const report of [
      "trial-balance",
      "ledger",
      "financial",
      "cash-flow",
      "cash-flow-indirect",
      "parties",
    ])
      assert.equal((await call("/api/reports/" + report)).status, 200, report);
    await call("/api/registers/cost-centers", {
      code: "C1",
      name: "مركز تصنيع الاختبار",
      data: { type: "MANUFACTURING" },
    });
    assert.equal(
      (await call("/api/costs/MANUFACTURING?center=C1")).status,
      200,
    );
    assert.equal(
      (await call("/api/equity?from=2026-01-01&to=2026-01-31")).status,
      200,
    );
    console.log("HTTP: checking final workbook payroll and distribution");
    const employeeData = {
      job: "محاسب",
      basicSalary: "6000",
      startDate: "2025-01-01",
      advanceAccount: "120",
      expenseAccount: "520",
      payableAccount: "210",
      insuranceAccount: "220",
    };
    const employee = await call("/api/registers/employees", {
      code: "EMP1",
      name: "موظف الاختبار",
      data: employeeData,
    });
    assert.equal(employee.status, 200, JSON.stringify(employee.data));
    assert.equal(
      (
        await call("/api/registers/parties", {
          code: "EMP1",
          name: "كود مكرر",
          data: { type: "CUSTOMER" },
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await call("/api/journal", {
          date: "2026-01-01",
          description: "مستند محجوز",
          document: "PAYROLL",
          requestKey: "spoof-payroll-doc",
          lines: [
            { accountCode: "120", debit: "1", party: "EMP1" },
            { accountCode: "100", credit: "1" },
          ],
        })
      ).status,
      400,
    );
    const salaryMovement = {
      action: "movement",
      employee: "EMP1",
      date: "2026-01-03",
      absenceDays: "1",
      deductionDays: "0.5",
      insurance: "120",
      allowances: "300",
      bonusDays: "2",
      overtimeDays: "1",
      overtimeHours: "4",
      advance: "1000",
      cashAccount: "100",
      requestKey: "http-test-payroll",
    };
    const movement = await call("/api/payroll", salaryMovement);
    assert.equal(movement.status, 200, JSON.stringify(movement.data));
    assert.equal(
      (await call("/api/payroll", salaryMovement)).data.movement.id,
      movement.data.movement.id,
    );
    assert.equal(
      (await call("/api/payroll", { ...salaryMovement, allowances: "301" }))
        .status,
      409,
    );
    let payroll = await call("/api/payroll?month=2026-01");
    assert.equal(payroll.data.rows[0].net, "5580.00");
    assert.equal(payroll.data.rows[0].advanceLines.length, 1);
    const manualAdvance = await call("/api/journal", {
      date: "2026-01-10",
      description: "سلفة مسودة",
      requestKey: "late-payroll-draft",
      lines: [
        { accountCode: "120", debit: "5", party: "EMP1" },
        { accountCode: "100", credit: "5" },
      ],
    });
    assert.equal(manualAdvance.status, 201);
    const salaryPost = await call("/api/payroll", {
      action: "post",
      employee: "EMP1",
      month: "2026-01",
    });
    assert.equal(salaryPost.status, 200, JSON.stringify(salaryPost.data));
    assert.equal(
      (
        await call("/api/payroll", {
          action: "post",
          employee: "EMP1",
          month: "2026-01",
        })
      ).data.entryId,
      salaryPost.data.entryId,
    );
    assert.equal(
      (
        await call("/api/journal/" + manualAdvance.data.entry.id, {
          action: "post",
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await call("/api/payroll", {
          ...salaryMovement,
          requestKey: "after-payroll-post",
        })
      ).status,
      409,
    );
    const salaryUpdated = await call("/api/registers/employees", {
      code: "EMP1",
      name: "موظف الاختبار",
      version: employee.data.row.version,
      data: { ...employeeData, basicSalary: "6500" },
    });
    assert.equal(salaryUpdated.status, 200);
    assert.equal(
      (await call("/api/payroll?month=2026-01")).data.rows[0].net,
      "5580.00",
    );
    assert.equal(
      (await call("/api/payroll?month=2027-01")).data.rows[0].net,
      "6500.00",
    );
    assert.equal(
      (
        await call("/api/payroll", {
          action: "movement",
          employee: "EMP1",
          date: "2026-02-01",
          absenceDays: "100",
          requestKey: "negative-net-salary",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await call("/api/payroll", {
          action: "post",
          employee: "EMP1",
          month: "2026-02",
        })
      ).status,
      400,
    );
    assert.equal(
      (await call("/api/payroll", salaryMovement, auditor)).status,
      401,
    );
    const salaryAuditor = await login("auditor@example.test");
    assert.equal(
      (await call("/api/payroll", salaryMovement, salaryAuditor)).status,
      403,
    );
    const negativeMovement = await call("/api/payroll", {
      action: "movement",
      employee: "EMP1",
      date: "2026-02-01",
      absenceDays: "100",
      requestKey: "negative-net-salary",
    });
    const cancelNegative = {
      action: "void-movement",
      id: negativeMovement.data.movement.id,
    };
    assert.equal((await call("/api/payroll", cancelNegative)).status, 200);
    assert.equal((await call("/api/payroll", cancelNegative)).status, 200);
    assert.equal(
      (await call("/api/payroll?month=2026-02")).data.rows[0].net,
      "6500.00",
    );
    const temporaryAdvance = await call("/api/payroll", {
      action: "movement",
      employee: "EMP1",
      date: "2026-02-02",
      advance: "100",
      cashAccount: "100",
      requestKey: "void-advance-salary",
    });
    assert.equal(
      temporaryAdvance.status,
      200,
      JSON.stringify(temporaryAdvance.data),
    );
    assert.equal(
      (await call("/api/payroll?month=2026-02")).data.rows[0].net,
      "6400.00",
    );
    assert.equal(
      (
        await call("/api/payroll", {
          action: "void-movement",
          id: temporaryAdvance.data.movement.id,
        })
      ).status,
      200,
    );
    assert.equal(
      (await call("/api/payroll?month=2026-02")).data.rows[0].net,
      "6500.00",
    );
    assert.equal(
      (
        await call("/api/payroll", {
          action: "void-movement",
          id: movement.data.movement.id,
        })
      ).status,
      409,
    );
    for (const code of ["P1", "P2"])
      assert.equal(
        (
          await call("/api/registers/parties", {
            code,
            name: code,
            data: { type: "PARTNER" },
          })
        ).status,
        200,
      );
    const distributionTemplate = (
      await import("../src/data/distribution-template.json")
    ).default;
    const distributionInputs = Object.fromEntries(
      Object.keys(distributionTemplate.inputs).map((k) => [k, "0"]),
    );
    Object.assign(distributionInputs, {
      C8: "600",
      C9: "400",
      E8: "100",
      E9: "100",
      C49: "1000",
      C52: "600",
      C55: "20",
      D55: "40",
    });
    const distribution = await call("/api/equity/distribution", {
      from: "2026-01-01",
      to: "2026-01-31",
      first: "P1",
      second: "P2",
      version: 0,
      inputs: distributionInputs,
    });
    assert.equal(distribution.status, 200, JSON.stringify(distribution.data));
    const distributionReport = await call(
      "/api/equity/distribution?from=2026-01-01&to=2026-01-31",
    );
    assert.equal(distributionReport.data.values.C59, "-30");
    assert.deepEqual(distributionReport.data.errors, {});
    const incomplete = await call("/api/journal", {
      date: "2026-01-01",
      description: "ناقص",
      requestKey: "incomplete-http-test",
      lines: [
        { accountCode: "100", debit: "1" },
        { accountCode: "", credit: "1" },
      ],
    });
    assert.equal(incomplete.status, 400);
    const weighedDoc = await call("/api/documents", {
      type: "PURCHASE",
      date: "2026-01-04",
      itemId: item.data.row.id,
      warehouse: "W1",
      party: "V1",
      accountCode: "200",
      quantity: "0",
      unitPrice: "0",
      reference: "WEIGH-1",
      description: "مستند وزن اختباري",
      requestKey: "ux-weighted-document",
      weigh: {
        weight: "1000",
        tare: "100",
        bags: "10",
        bagDeduction: "2",
        discountRate: "0.05",
        inspectionRate: "0.1",
        pricePerTonne: "1000",
      },
    });
    assert.equal(weighedDoc.status, 200, JSON.stringify(weighedDoc.data));
    const statement = await call("/api/reports/ledger?account=200&party=V1");
    const weightRow = statement.data.rows.find(
      (r: any) => r.reference === "WEIGH-1",
    );
    assert.deepEqual(
      [
        weightRow.bags,
        weightRow.gross,
        weightRow.bagLoss,
        weightRow.net,
        weightRow.credit,
      ],
      ["10", "900", "20", "752.4", "752.40"],
    );
    assert.equal(weightRow.discountRate, "5%");
    const negativeWeight = await call("/api/stock", {
      date: "2026-01-04",
      itemId: item.data.row.id,
      warehouse: "W1",
      kind: "RECEIPT",
      quantity: "1",
      unitCost: "1",
      counterpart: "200",
      description: "وزن غير صحيح",
      requestKey: "negative-gross-test",
      weigh: { weight: "5", tare: "10", bags: "0" },
    });
    assert.equal(negativeWeight.status, 400);
    try {
      console.log("HTTP: starting browser");
      browser = await chromium.launch({
        headless: true,
        executablePath: process.env.CHROMIUM_PATH || undefined,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      });
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1100 },
      });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(20000);
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("dialog", (dialog) => void dialog.accept());
      const token = cookie.split("=")[1];
      await context.addCookies([
        {
          name: "mohasby_session",
          value: token,
          domain: "localhost",
          path: "/",
          httpOnly: true,
        },
      ]);
      await page.goto(base + "/ar/dashboard");
      const tiles = page.locator("[data-workbook-cell]");
      await tiles.first().waitFor();
      assert.equal(await tiles.count(), 45);
      for (const b of homeButtons) {
        const tile = page.locator('[data-workbook-cell="' + b.cell + '"]');
        assert.equal((await tile.textContent())?.trim(), b.label);
        assert.equal(
          await tile.getAttribute("href"),
          "/ar/dashboard/" + b.group + "/" + b.page,
        );
        const style = await tile.evaluate((el) => ({
          column: getComputedStyle(el).gridColumnStart,
          row: getComputedStyle(el).gridRowStart,
        }));
        assert.deepEqual(
          style,
          { column: String(b.column), row: String(b.row) },
          b.cell,
        );
      }
      await page.screenshot({
        path: "test-results/final-workbook-home.png",
        fullPage: true,
      });
      await page.goto(base + "/dashboard/accounting/journal-entries");
      await page.getByRole("heading", { name: "قيد جديد" }).waitFor();
      await page.getByLabel("البيان", { exact: true }).fill("قيد من الواجهة");
      await page.getByLabel("التاريخ", { exact: true }).fill("2026-01-03");
      await page
        .getByLabel("الحساب — بند 1", { exact: true })
        .selectOption("100");
      await page
        .getByLabel("الحساب — بند 2", { exact: true })
        .selectOption("300");
      await page.getByLabel("مدين", { exact: true }).nth(0).fill("5");
      await page.getByLabel("دائن", { exact: true }).nth(1).fill("5");
      // Incomplete line must stay in the form with an actionable error, never a full-page error.
      await page.getByLabel("الحساب — بند 2", { exact: true }).selectOption("");
      await page
        .getByRole("button", { name: "حفظ مسودة", exact: true })
        .click();
      await page
        .getByRole("alert")
        .filter({ hasText: "راجع السطور" })
        .waitFor();
      assert.ok(page.url().includes("journal-entries"));
      assert.equal(
        await page.getByLabel("البيان", { exact: true }).inputValue(),
        "قيد من الواجهة",
      );
      await page.reload();
      await page
        .getByRole("status")
        .filter({ hasText: "استعدنا الإدخال" })
        .waitFor();
      assert.equal(
        await page.getByLabel("البيان", { exact: true }).inputValue(),
        "قيد من الواجهة",
      );
      assert.equal(
        await page.getByLabel("مدين", { exact: true }).first().inputValue(),
        "5",
      );
      await page
        .getByLabel("الحساب — بند 2", { exact: true })
        .selectOption("300");
      await page.getByLabel("دائن", { exact: true }).nth(1).fill("4");
      await page
        .getByRole("button", { name: "حفظ مسودة", exact: true })
        .click();
      await page
        .getByRole("alert")
        .filter({ hasText: "القيد غير متوازن" })
        .waitFor();
      await page.getByLabel("دائن", { exact: true }).nth(1).fill("5");
      // An HTML proxy error also remains inline and preserves the values.
      await page.route("**/api/journal", async (route) => {
        if (route.request().method() === "POST")
          await route.fulfill({
            status: 500,
            contentType: "text/html",
            body: "<h1>Upstream unavailable</h1>",
          });
        else await route.continue();
      });
      await page
        .getByRole("button", { name: "حفظ مسودة", exact: true })
        .click();
      await page
        .getByRole("alert")
        .filter({ hasText: "تعذر قراءة رد الخادم" })
        .waitFor();
      assert.equal(
        await page.getByLabel("البيان", { exact: true }).inputValue(),
        "قيد من الواجهة",
      );
      await page.unroute("**/api/journal");
      await page
        .getByRole("button", { name: "حفظ مسودة", exact: true })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: "تم حفظ المسودة" })
        .waitFor();
      const entryCard = page.locator("details").filter({
        has: page.locator("summary").filter({ hasText: "قيد من الواجهة" }),
      });
      await entryCard.locator("summary").click();
      await entryCard
        .getByRole("button", { name: "ترحيل", exact: true })
        .click();
      await entryCard.locator("summary").filter({ hasText: "مرحل" }).waitFor();
      await page.screenshot({
        path: "test-results/journal-review.png",
        fullPage: true,
      });
      await page.goto(base + "/dashboard/accounting/trial-balance");
      await page.getByText("الخزينة", { exact: true }).waitFor();
      await page.screenshot({
        path: "test-results/trial-review.png",
        fullPage: true,
      });
      const { getAllRouteParams } = await import("../src/lib/nav/nav.config");
      for (const route of getAllRouteParams()) {
        const response = await page.goto(
          base + "/dashboard/" + route.group + "/" + route.page,
        );
        assert.equal(response?.status(), 200, route.page);
        await page.locator("main h1").first().waitFor();
        assert.equal(
          await page.locator(`[data-page-guide="${route.page}"]`).count(),
          1,
          route.page,
        );
      }
      for (const prefix of ["ar", "en"]) {
        const response = await page.goto(
          base + "/" + prefix + "/dashboard/accounting/trial-balance",
        );
        assert.equal(response?.status(), 200, prefix);
        await page.getByText("الخزينة", { exact: true }).waitFor();
      }
      await page.goto(base + "/ar/dashboard/hr/payroll-statement");
      await page.getByLabel("الشهر والسنة").fill("2026-01");
      await page.getByRole("cell", { name: "5580.00", exact: true }).waitFor();
      await page.screenshot({
        path: "test-results/payroll-review.png",
        fullPage: true,
      });
      await page.goto(base + "/ar/dashboard/accounting/journal-entries");
      await page
        .locator("summary")
        .filter({ hasText: "المستندات والوزن" })
        .click();
      await page
        .getByLabel("حساب القيمة من الوزن وخصومات الأجولة والفحص", {
          exact: true,
        })
        .check();
      for (const [label, value] of [
        ["الوزن", "1000"],
        ["الفارغ", "100"],
        ["عدد الأجولة", "10"],
        ["خصم الجوال بالكيلو", "2"],
        ["نسبة الخصم (0–1)", "0.05"],
        ["نسبة الفحص (0–1)", "0.1"],
        ["السعر للطن", "1000"],
      ])
        await page.getByLabel(label, { exact: true }).fill(value);
      await page
        .getByRole("button", {
          name: "احسب القائم والصافي والقيمة",
          exact: true,
        })
        .click();
      await page.getByLabel("القيمة", { exact: true }).waitFor();
      assert.equal(
        await page.getByLabel("القيمة", { exact: true }).inputValue(),
        "752.4",
      );
      console.log("UI: checking employee editing and workbook reports");
      // Employee columns are separate, and account configuration is selected by name.
      await page.goto(base + "/ar/dashboard/hr/employees");
      await page
        .getByRole("cell", { name: "موظف الاختبار", exact: true })
        .waitFor();
      await page
        .getByRole("columnheader", { name: "اجر اليوم", exact: true })
        .waitFor();
      await page
        .getByRole("cell", { name: "216.666667", exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "تعديل", exact: true })
        .first()
        .click();
      await page.getByText("ربط الحسابات المحاسبية", { exact: true }).click();
      assert.equal(
        await page
          .getByLabel("حساب سلف الموظفين", { exact: true })
          .inputValue(),
        "120",
      );
      await page.getByLabel("موبايل", { exact: true }).fill("01000000000");
      await page.getByRole("button", { name: "حفظ", exact: true }).click();
      await page
        .getByRole("status")
        .filter({ hasText: "تم حفظ السجل" })
        .waitFor();
      await page
        .getByRole("cell", { name: "01000000000", exact: true })
        .waitFor();
      await page.screenshot({
        path: "test-results/workbook-employees.png",
        fullPage: true,
      });
      // Sheet inputs sit at their original coordinates, and save real backend values.
      await page.goto(base + "/ar/dashboard/costs/manufacturing-costs");
      await page.getByLabel("مركز التكلفة", { exact: true }).selectOption("C1");
      const quantityInput = page
        .getByRole("table")
        .getByLabel("الكمية المنتجة (عدد الوحدات / العبوات التامة)", {
          exact: true,
        });
      await quantityInput.fill("10");
      await page
        .getByLabel("هامش الربح المستهدف (نسبة مئوية)", { exact: true })
        .fill("20");
      await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes("/api/costs/MANUFACTURING") &&
            r.request().method() === "GET",
        ),
        page
          .getByRole("button", {
            name: "حفظ المدخلات وحساب التقرير",
            exact: true,
          })
          .click(),
      ]);
      assert.equal(
        (await call("/api/costs/MANUFACTURING?center=C1")).data.inputs.C33,
        "10",
      );
      await page.goto(base + "/ar/dashboard/accounting/account-statement");
      await page
        .getByText("اختر الحساب بالاسم لعرض كشفه.", { exact: false })
        .waitFor();
      await page.getByLabel("الحساب", { exact: true }).selectOption("200");
      await page
        .getByLabel("الحساب التحليلي", { exact: true })
        .selectOption("V1");
      await page.locator("[data-statement-header]").waitFor();
      await page
        .getByRole("columnheader", { name: "القائم", exact: true })
        .waitFor();
      await page
        .getByRole("cell", { name: "شراء اختباري", exact: true })
        .waitFor();
      await page.screenshot({
        path: "test-results/workbook-account-statement.png",
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(base + "/ar/dashboard");
      console.log("UI: checking mobile menu and stock entry");
      for (const prefix of ["ar", "en"]) {
        await page.goto(base + "/" + prefix + "/dashboard");
        const menu = page.getByRole("button", {
          name: "Open navigation drawer",
          exact: true,
        });
        await menu.click();
        await page.getByRole("dialog", { name: "Mobile Navigation" }).waitFor();
        await page.keyboard.press("Escape");
        await page
          .getByRole("dialog", { name: "Mobile Navigation" })
          .waitFor({ state: "hidden" });
        assert.equal(
          await menu.evaluate((el) => el === document.activeElement),
          true,
        );
        await menu.click();
        await page
          .getByRole("dialog", { name: "Mobile Navigation" })
          .getByRole("link")
          .first()
          .click();
        await page
          .getByRole("dialog", { name: "Mobile Navigation" })
          .waitFor({ state: "hidden" });
      }
      await page.goto(base + "/ar/dashboard");
      assert.equal(await page.locator("[data-workbook-cell]").count(), 45);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      );
      await page.screenshot({
        path: "test-results/final-workbook-home-mobile.png",
        fullPage: true,
      });
      await page.goto(base + "/dashboard/warehouses/warehouse-report");
      await page
        .getByRole("cell", { name: "صنف الاختبار", exact: true })
        .first()
        .waitFor();
      await page.screenshot({
        path: "test-results/mobile-stock.png",
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Open navigation drawer", exact: true })
        .click();
      await page.getByRole("dialog", { name: "Mobile Navigation" }).waitFor();
      await page.screenshot({
        path: "test-results/workbook-mobile-menu.png",
        fullPage: true,
      });
      await page
        .getByRole("dialog", { name: "Mobile Navigation" })
        .getByRole("link", { name: "اذن اضافة", exact: true })
        .click();
      await page
        .locator("main")
        .getByRole("heading", { name: "اذن اضافة", exact: true })
        .waitFor();
      await page
        .getByLabel("الصنف", { exact: true })
        .selectOption(item.data.row.id);
      await page
        .getByLabel("المخزن / الثلاجة", { exact: true })
        .selectOption("W1");
      await page
        .getByLabel("البيان", { exact: true })
        .fill("إذن وزن من الموبايل");
      await page
        .getByLabel("الحساب المقابل (مورد / تكلفة / رأس مال)", { exact: true })
        .selectOption("200");
      await page.getByLabel("تكلفة الوحدة للوارد", { exact: true }).fill("2");
      await page.getByLabel("رقم السيارة", { exact: true }).fill("TEST-123");
      await page
        .getByLabel("إدخال الوزن والفارغ بدل الكمية (كجم)", { exact: true })
        .check();
      await page.getByLabel("الوزن", { exact: true }).fill("25");
      await page.getByLabel("الفارغ", { exact: true }).fill("5");
      await page.getByLabel("العدد", { exact: true }).fill("2");
      await page
        .getByRole("button", { name: "حفظ وترحيل", exact: true })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: "تم تسجيل حركة المخزون" })
        .waitFor();
      const savedStock = (await call("/api/stock")).data.rows.find(
        (r: any) => r.metadata.logistics?.truck === "TEST-123",
      );
      assert.equal(savedStock.quantity, "20");
      assert.equal(savedStock.metadata.stockWeigh.bags, "2");
      const mobileWidth = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      }));
      assert.ok(
        mobileWidth.page <= mobileWidth.viewport,
        JSON.stringify(mobileWidth),
      );
      await page.evaluate(() => {
        window.scrollTo(0, 0);
        document
          .querySelectorAll<HTMLElement>('[role="region"]')
          .forEach((el) => (el.scrollLeft = 0));
      });
      await page.screenshot({
        path: "test-results/workbook-mobile-entry.png",
        fullPage: true,
      });
      assert.deepEqual(
        pageErrors,
        [],
        "No client rendering exceptions during any workflow",
      );
      console.log(
        "PASS: browser journal create/post, report rendering, all " +
          getAllRouteParams().length +
          " dashboard routes and mobile stock.",
      );
    } catch (e) {
      await browser
        ?.contexts()[0]
        ?.pages()[0]
        ?.screenshot({ path: "test-results/failure.png", fullPage: true });
      throw new Error("Browser verification failed: " + (e as Error).message);
    }
    console.log(
      "PASS: HTTP sessions, spoofed-cookie rejection, company scoping, auditor permissions, CSRF, posting, purchase/stock/ledger transaction and reports.",
    );
  } catch (e) {
    console.error(log.slice(-3500));
    throw e;
  } finally {
    await browser?.close();
    child.kill("SIGTERM");
    await prisma.$disconnect();
    await server.stop();
    await db.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
