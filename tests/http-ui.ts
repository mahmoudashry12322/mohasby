import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaClient } from "@prisma/client";
import { spawn } from "node:child_process";
import { createHash, scryptSync } from "node:crypto";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
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
      7,
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
    assert.equal(exportCost.data.values.C7, "100");
    assert.equal(exportCost.data.values.E7, "2000");
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
      }
      for (const prefix of ["ar", "en"]) {
        const response = await page.goto(
          base + "/" + prefix + "/dashboard/accounting/trial-balance",
        );
        assert.equal(response?.status(), 200, prefix);
        await page.getByText("الخزينة", { exact: true }).waitFor();
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(base + "/dashboard/warehouses/warehouse-report");
      await page
        .getByRole("cell", { name: "صنف الاختبار", exact: true })
        .first()
        .waitFor();
      await page.screenshot({
        path: "test-results/mobile-stock.png",
        fullPage: true,
      });
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
