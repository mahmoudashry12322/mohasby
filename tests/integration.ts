// Uses PostgreSQL compiled to WASM locally. Run the same service tests against
// PostgreSQL in CI/deployment before release; PGlite has a single connection.
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import fs from "node:fs/promises";
import assert from "node:assert/strict";

async function main() {
  const external = process.env.TEST_DATABASE_URL;
  const db = external ? null : await PGlite.create();
  if (db)
    for (const folder of (await fs.readdir("prisma/migrations"))
      .filter((f) => /^\d/.test(f))
      .sort())
      await db.exec(
        await fs.readFile(
          "prisma/migrations/" + folder + "/migration.sql",
          "utf8",
        ),
      );
  const server = db
    ? new PGLiteSocketServer({ db, host: "127.0.0.1", port: 55439 })
    : null;
  await server?.start();
  process.env.DATABASE_URL =
    external ||
    "postgresql://postgres:postgres@127.0.0.1:55439/postgres?connection_limit=1";
  const { default: prisma } = await import("../src/lib/prisma");
  const { createEntry, entrySchema, entryAction } =
    await import("../src/lib/accounting/ledger");
  const { trialBalance } = await import("../src/lib/accounting/reports");
  const { moveStock, stockSchema, stockBalances, closeInventory } =
    await import("../src/lib/accounting/periodic-stock");
  const { locked } = await import("../src/lib/accounting/ledger");
  try {
    const company = await prisma.company.create({
        data: { name: "Integration fixture" },
      }),
      other = await prisma.company.create({ data: { name: "Other company" } });
    const actor = { companyId: company.id, id: "test-admin", role: "admin" };
    for (const [code, name, accountClass, nature, statementType] of [
      ["100", "Cash", "الأصول", "مدين", "قائمة المركز المالي"],
      ["110", "Inventory", "الأصول", "مدين", "قائمة المركز المالي"],
      ["200", "Payables", "الخصوم", "دائن", "قائمة المركز المالي"],
      ["300", "Capital", "حقوق الملكية", "دائن", "قائمة المركز المالي"],
      ["500", "Purchases", "المصروفات", "مدين", "قائمة الدخل"],
      ["510", "Inventory change", "المصروفات", "مدين", "قائمة الدخل"],
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
    await prisma.account.create({
      data: {
        companyId: other.id,
        code: "OTHER",
        name: "Other",
        accountClass: "الأصول",
        nature: "مدين",
        statementType: "قائمة المركز المالي",
        level: 1,
      },
    });
    const input = entrySchema.parse({
      date: "2026-01-01",
      description: "Opening",
      kind: "OPENING",
      requestKey: "test-opening",
      lines: [
        { accountCode: "100", debit: "1000" },
        { accountCode: "300", credit: "1000" },
      ],
    });
    const entry = await createEntry(actor, input);
    assert.equal(entry.status, "DRAFT");
    assert.equal((await createEntry(actor, input)).id, entry.id);
    await assert.rejects(() =>
      createEntry(actor, { ...input, description: "different payload" }),
    );
    assert.equal(
      (
        await trialBalance(
          company.id,
          new Date("2026-01-01"),
          new Date("2026-01-31"),
        )
      ).find((a) => a.code === "100")?.balance,
      "0.00",
    );
    await entryAction(actor, entry.id, "post");
    await entryAction(actor, entry.id, "post");
    assert.equal(
      (
        await trialBalance(
          company.id,
          new Date("2026-01-01"),
          new Date("2026-01-31"),
        )
      ).find((a) => a.code === "100")?.balance,
      "1000.00",
    );
    await assert.rejects(() =>
      entryAction({ ...actor, companyId: other.id }, entry.id, "post"),
    );
    await assert.rejects(() =>
      createEntry(
        actor,
        entrySchema.parse({
          ...input,
          requestKey: "test-invalid",
          lines: [
            { accountCode: "OTHER", debit: "1" },
            { accountCode: "300", credit: "1" },
          ],
        }),
      ),
    );
    const rev = await entryAction(actor, entry.id, "reverse", "2026-01-02");
    assert.equal(
      (await entryAction(actor, entry.id, "reverse", "2026-01-02")).id,
      rev.id,
    );
    assert.equal(
      (
        await trialBalance(
          company.id,
          new Date("2026-01-01"),
          new Date("2026-01-31"),
        )
      ).find((a) => a.code === "100")?.balance,
      "0.00",
    );
    await prisma.register.create({
      data: {
        companyId: company.id,
        kind: "warehouses",
        code: "W1",
        name: "Warehouse",
      },
    });
    const item = await prisma.register.create({
      data: {
        companyId: company.id,
        kind: "items",
        code: "I1",
        name: "Item",
        data: {
          unit: "kg",
          inventoryAccount: "110",
          purchaseAccount: "500",
          expenseAccount: "510",
        },
      },
    });
    async function move(
      kind: string,
      date: string,
      quantity: string,
      unitCost: string,
      key: string,
    ) {
      return moveStock(
        actor,
        stockSchema.parse({
          date,
          itemId: item.id,
          warehouse: "W1",
          kind,
          quantity,
          unitCost,
          counterpart: "200",
          description: kind,
          requestKey: key,
        }),
      );
    }
    await move("OPENING", "2026-01-01", "100", "10", "stock-opening");
    await move("RECEIPT", "2026-01-03", "100", "20", "stock-receipt");
    await move("ISSUE", "2026-01-04", "50", "0", "stock-issue");
    let balance = (await stockBalances(company.id, new Date("2026-01-31")))[0];
    assert.equal(balance.quantity, "150.000");
    assert.equal(balance.averageCost, "15.000000");
    assert.equal(balance.value, "2250.00");
    await assert.rejects(() =>
      move("ISSUE", "2026-01-04", "151", "0", "stock-overdraw"),
    );
    assert.equal(await prisma.stockMovement.count(), 3);
    await locked(company.id, (tx) =>
      closeInventory(tx, actor, new Date("2026-01-31")),
    );
    const trial = await trialBalance(
      company.id,
      new Date("2026-01-01"),
      new Date("2026-01-31"),
    );
    assert.equal(trial.find((a) => a.code === "110")?.balance, "2250.00");
    assert.equal(trial.find((a) => a.code === "510")?.balance, "-1250.00");
    assert.equal(trial.find((a) => a.code === "510")?.movementCredit, "0.00");
    assert.equal(
      trial.find((a) => a.code === "510")?.adjustmentCredit,
      "1250.00",
    );
    await assert.rejects(() =>
      move("RECEIPT", "2026-01-30", "1", "1", "stock-closed"),
    );
    await move("RECEIPT", "2026-02-01", "50", "25", "stock-february");
    balance = (await stockBalances(company.id, new Date("2026-02-28")))[0];
    assert.equal(balance.averageCost, "17.500000");
    assert.equal(balance.value, "3500.00");
    await prisma.register.create({
      data: {
        companyId: company.id,
        kind: "cost-centers",
        code: "F1",
        name: "Farm test",
        data: { type: "FARMING", farm: "F", pivot: "P", season: "S" },
      },
    });
    const { default: templates } =
      await import("../src/data/cost-templates.json");
    const farmEntry = await createEntry(
      actor,
      entrySchema.parse({
        date: "2026-02-01",
        description: "Farm cost",
        requestKey: "farm-cost-test",
        lines: [
          {
            accountCode: "500",
            debit: "10",
            costCenter: "F1",
            costItem: templates.FARMING.labels.B13,
          },
          { accountCode: "200", credit: "10" },
        ],
      }),
    );
    await entryAction(actor, farmEntry.id, "post");
    const { costSchedule } = await import("../src/lib/accounting/costs");
    assert.equal(
      (
        await costSchedule(
          company.id,
          "FARMING",
          "F1",
          new Date("2026-02-01"),
          new Date("2026-02-28"),
        )
      ).values.D13,
      "10",
    );
    if (external) {
      const concurrent = entrySchema.parse({
        date: "2026-02-02",
        description: "Concurrent replay",
        requestKey: "concurrent-replay",
        lines: [
          { accountCode: "100", debit: "1" },
          { accountCode: "300", credit: "1" },
        ],
      });
      const duplicate = await Promise.all(
        Array.from({ length: 8 }, () => createEntry(actor, concurrent)),
      );
      assert.equal(new Set(duplicate.map((e) => e.id)).size, 1);
      const sequence = await Promise.all(
        Array.from({ length: 8 }, (_, i) =>
          createEntry(actor, {
            ...concurrent,
            requestKey: "concurrent-unique-" + i,
          }),
        ),
      );
      assert.equal(new Set(sequence.map((e) => e.number)).size, 8);
      const attempts = await Promise.allSettled([
        move("ISSUE", "2026-02-03", "150", "0", "concurrent-stock-a"),
        move("ISSUE", "2026-02-03", "150", "0", "concurrent-stock-b"),
      ]);
      assert.equal(attempts.filter((a) => a.status === "fulfilled").length, 1);
      console.log(
        "PASS: real PostgreSQL concurrent replay, numbering and stock-overdraw serialization.",
      );
    }
    console.log(
      "PASS: posting, balance, reversal, idempotency, tenant isolation, periodic weighted inventory, close, next-period carryforward, rollback and negative stock.",
    );
  } finally {
    await prisma.$disconnect();
    await server?.stop();
    await db?.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
