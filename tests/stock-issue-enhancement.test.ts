import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";
import { moveStock, stockBalances, closeInventory } from "@/lib/accounting/periodic-stock";
import { locked } from "@/lib/accounting/ledger";
import { GET as stockGet, POST as stockPost } from "@/app/api/stock/route";
import { GET as auditGet } from "@/app/api/audit/route";
import { D } from "@/lib/accounting/calculations";

function digest(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

test("Stock issue enhancement: warehouse selection, cost preview, atomic checks & audit trail", async (t) => {
  // 1. Create isolated test company (NEVER touches company 1 or 19)
  const company = await prisma.company.create({
    data: {
      name: "شركة اختبار فحص الصرف والمخازن " + Date.now(),
      users: {
        create: [
          {
            name: "مدير المخزون المالي",
            email: `admin_${Date.now()}@stocktest.local`,
            passwordHash: "test_hash",
            role: "admin",
          },
          {
            name: "أمين مستودع بدون تكلفة",
            email: `keeper_${Date.now()}@stocktest.local`,
            passwordHash: "test_hash",
            role: "accountant",
            permissions: ["stock.view", "stock.movement"],
          },
        ],
      },
    },
    include: { users: true },
  });

  const adminUser = company.users.find((u) => u.role === "admin")!;
  const keeperUser = company.users.find((u) => u.role === "accountant")!;

  const adminSessionToken = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      userId: adminUser.id,
      tokenHash: digest(adminSessionToken),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });

  const keeperSessionToken = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      userId: keeperUser.id,
      tokenHash: digest(keeperSessionToken),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });

  const baseUrl = process.env.APP_URL || "https://mohasby.mahmoudashry.site";

  function makeReq(token: string, path: string, body?: unknown, method = "POST") {
    return new Request(`${baseUrl}${path}`, {
      method: body ? method : "GET",
      headers: {
        Cookie: `mohasby_session=${token}`,
        Origin: baseUrl,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  try {
    // 2. Set up initial registers: 2 Warehouses and 1 Item
    const wh1 = await prisma.register.create({
      data: {
        companyId: company.id,
        kind: "warehouses",
        code: "WH-MAIN",
        name: "المخزن الرئيسي",
        data: { type: "STANDARD" },
        isActive: true,
      },
    });

    const wh2 = await prisma.register.create({
      data: {
        companyId: company.id,
        kind: "warehouses",
        code: "WH-BRANCH",
        name: "مخزن الفرع",
        data: { type: "STANDARD" },
        isActive: true,
      },
    });

    const wh3 = await prisma.register.create({
      data: {
        companyId: company.id,
        kind: "warehouses",
        code: "WH-EMPTY",
        name: "مخزن فارغ",
        data: { type: "STANDARD" },
        isActive: true,
      },
    });

    // Setup chart of accounts for financial inventory movements
    await prisma.account.createMany({
      data: [
        {
          companyId: company.id,
          code: "105",
          name: "مخزون بضاعة",
          accountClass: "الأصول",
          nature: "مدين",
          statementType: "قائمة المركز المالي",
          level: 4,
          isActive: true,
        },
        {
          companyId: company.id,
          code: "501",
          name: "مشتريات بضاعة",
          accountClass: "المصروفات",
          nature: "مدين",
          statementType: "قائمة الدخل",
          level: 4,
          isActive: true,
        },
        {
          companyId: company.id,
          code: "502",
          name: "تغير في المخزون",
          accountClass: "المصروفات",
          nature: "مدين",
          statementType: "قائمة الدخل",
          level: 4,
          isActive: true,
        },
        {
          companyId: company.id,
          code: "201",
          name: "موردين محليين",
          accountClass: "الخصوم",
          nature: "دائن",
          statementType: "قائمة المركز المالي",
          level: 4,
          isActive: true,
        },
      ],
    });

    const item = await prisma.register.create({
      data: {
        companyId: company.id,
        kind: "items",
        code: "ITM-01",
        name: "سماد مركب نتروجيني",
        data: {
          unit: "kg",
          inventoryAccount: "105",
          purchaseAccount: "501",
          expenseAccount: "502",
        },
        isActive: true,
      },
    });

    // 3. Test Preview when item has NO stock in any warehouse
    {
      const req = makeReq(
        adminSessionToken,
        `/api/stock?preview=true&itemId=${item.id}&date=2026-10-16`,
      );
      const res = await stockGet(req as any);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.item.id, item.id);
      assert.equal(data.item.unit, "kg");
      assert.equal(data.warehouses.length, 3);
      assert.ok(data.warehouses.every((w: any) => !w.hasPositiveBalance));
      assert.equal(data.cost.hasCostBasis, false);
      assert.ok(data.cost.costBasisReason.length > 0);
    }

    // 4. Test initial RECEIPT into WH-MAIN
    {
      const receiptBody = {
        kind: "RECEIPT",
        date: "2026-10-10",
        itemId: item.id,
        warehouse: "WH-MAIN",
        quantity: "100",
        unitCost: "20",
        counterpart: "201",
        reference: "REC-100",
        description: "توريد بضاعة للمخزن الرئيسي",
        requestKey: "req-rec-001",
      };
      const req = makeReq(adminSessionToken, "/api/stock", receiptBody);
      const res = await stockPost(req as any);
      assert.equal(res.status, 201);
      const resData = await res.json();
      assert.equal(resData.movement.kind, "RECEIPT");
      assert.equal(Number(resData.movement.quantity), 100);
    }

    // 5. Test Single warehouse with positive balance:
    // WH-MAIN has 100, others have 0 -> single eligible warehouse
    {
      const req = makeReq(
        adminSessionToken,
        `/api/stock?preview=true&itemId=${item.id}&date=2026-10-16`,
      );
      const res = await stockGet(req as any);
      assert.equal(res.status, 200);
      const data = await res.json();

      const eligible = data.warehouses.filter((w: any) => w.hasPositiveBalance);
      assert.equal(eligible.length, 1);
      assert.equal(eligible[0].warehouse, "WH-MAIN");
      assert.equal(eligible[0].quantity, "100.000");

      // Cost basis should reflect average cost = 20
      assert.equal(data.cost.hasCostAccess, true);
      assert.equal(data.cost.hasCostBasis, true);
      assert.equal(Number(data.cost.averageCost), 20);
    }

    // 6. Test Cost Masking for user without `costs.view` permission
    {
      const req = makeReq(
        keeperSessionToken,
        `/api/stock?preview=true&itemId=${item.id}&date=2026-10-16`,
      );
      const res = await stockGet(req as any);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.cost.hasCostAccess, false);
      assert.equal(data.cost.averageCost, null);
    }

    // 7. Add stock to second warehouse WH-BRANCH (50 units)
    {
      const receiptBody = {
        kind: "RECEIPT",
        date: "2026-10-12",
        itemId: item.id,
        warehouse: "WH-BRANCH",
        quantity: "50",
        unitCost: "20",
        counterpart: "201",
        reference: "REC-50",
        description: "توريد مخزن الفرع",
        requestKey: "req-rec-002",
      };
      const req = makeReq(adminSessionToken, "/api/stock", receiptBody);
      const res = await stockPost(req as any);
      assert.equal(res.status, 201);
    }

    // 8. Test Multiple warehouses with positive balances:
    // Both WH-MAIN (100) and WH-BRANCH (50) have positive balances
    {
      const req = makeReq(
        adminSessionToken,
        `/api/stock?preview=true&itemId=${item.id}&date=2026-10-16`,
      );
      const res = await stockGet(req as any);
      const data = await res.json();
      const eligible = data.warehouses.filter((w: any) => w.hasPositiveBalance);
      assert.equal(eligible.length, 2);

      const mainBal = eligible.find((w: any) => w.warehouse === "WH-MAIN");
      const branchBal = eligible.find((w: any) => w.warehouse === "WH-BRANCH");
      assert.equal(mainBal.quantity, "100.000");
      assert.equal(branchBal.quantity, "50.000");
    }

    // 9. Test Issue 30 from WH-MAIN:
    // In periodic inventory, ISSUE movement must NOT create an immediate journal entry!
    // Client cannot forge unitCost via API
    {
      const issueBody = {
        kind: "ISSUE",
        date: "2026-10-14",
        itemId: item.id,
        warehouse: "WH-MAIN",
        quantity: "30",
        unitCost: "9999", // Attempt to forge unitCost -> must be neutralized to "0"
        reference: "OUT-01",
        description: "صرف سماد للتشغيل",
        requestKey: "req-issue-001",
      };
      const req = makeReq(adminSessionToken, "/api/stock", issueBody);
      const res = await stockPost(req as any);
      assert.equal(res.status, 201);
      const data = await res.json();

      assert.equal(data.movement.kind, "ISSUE");
      assert.equal(data.movement.direction, -1);
      assert.equal(Number(data.movement.quantity), 30);
      assert.equal(data.movement.entryId, null); // NO immediate journal entry!

      // Verify remaining balance in WH-MAIN is now 70
      const previewReq = makeReq(
        adminSessionToken,
        `/api/stock?preview=true&itemId=${item.id}&date=2026-10-16`,
      );
      const prevRes = await stockGet(previewReq as any);
      const prevData = await prevRes.json();
      const mainWh = prevData.warehouses.find((w: any) => w.warehouse === "WH-MAIN");
      assert.equal(mainWh.quantity, "70.000");
    }

    // 10. Test Overdraw Rejection: attempt to issue 71 when available is 70
    {
      const overdrawBody = {
        kind: "ISSUE",
        date: "2026-10-15",
        itemId: item.id,
        warehouse: "WH-MAIN",
        quantity: "71",
        reference: "OUT-OVERDRAW",
        description: "محاولة صرف تتجاوز الرصيد",
        requestKey: "req-issue-overdraw",
      };
      const req = makeReq(adminSessionToken, "/api/stock", overdrawBody);
      const res = await stockPost(req as any);
      assert.equal(res.status, 409);
      const errData = await res.json();
      assert.ok(errData.error.includes("الرصيد لا يكفي"));

      // Ensure balance is still 70
      const prevReq = makeReq(
        adminSessionToken,
        `/api/stock?preview=true&itemId=${item.id}&date=2026-10-16`,
      );
      const prevRes = await stockGet(prevReq as any);
      const prevData = await prevRes.json();
      const mainWh = prevData.warehouses.find((w: any) => w.warehouse === "WH-MAIN");
      assert.equal(mainWh.quantity, "70.000");
    }

    // 11. Test Idempotency with same requestKey
    {
      const issueAgain = {
        kind: "ISSUE",
        date: "2026-10-14",
        itemId: item.id,
        warehouse: "WH-MAIN",
        quantity: "30",
        reference: "OUT-01",
        description: "صرف سماد للتشغيل",
        requestKey: "req-issue-001", // Exact same key
      };
      const req = makeReq(adminSessionToken, "/api/stock", issueAgain);
      const res = await stockPost(req as any);
      assert.equal(res.status, 201); // Returns prior movement without duplicate
      const data = await res.json();
      assert.equal(data.movement.requestKey, "req-issue-001");

      // Balance remains 70 (not 40)
      const prevReq = makeReq(
        adminSessionToken,
        `/api/stock?preview=true&itemId=${item.id}&date=2026-10-16`,
      );
      const prevRes = await stockGet(prevReq as any);
      const prevData = await prevRes.json();
      const mainWh = prevData.warehouses.find((w: any) => w.warehouse === "WH-MAIN");
      assert.equal(mainWh.quantity, "70.000");
    }

    // 12. Test Concurrent Issues Serialization and Negative Stock Prevention
    // Starting with 70 in WH-MAIN: issue 50 and issue 50 concurrently.
    // One must succeed, leaving 20. The other must fail with 409.
    {
      const promise1 = stockPost(
        makeReq(adminSessionToken, "/api/stock", {
          kind: "ISSUE",
          date: "2026-10-15",
          itemId: item.id,
          warehouse: "WH-MAIN",
          quantity: "50",
          reference: "CONC-1",
          description: "صرف متزامن 1",
          requestKey: "req-conc-001",
        }) as any,
      );

      const promise2 = stockPost(
        makeReq(adminSessionToken, "/api/stock", {
          kind: "ISSUE",
          date: "2026-10-15",
          itemId: item.id,
          warehouse: "WH-MAIN",
          quantity: "50",
          reference: "CONC-2",
          description: "صرف متزامن 2",
          requestKey: "req-conc-002",
        }) as any,
      );

      const [res1, res2] = await Promise.all([promise1, promise2]);
      const statuses = [res1.status, res2.status].sort();
      assert.deepEqual(statuses, [201, 409]);

      // Verify balance is exactly 20.000
      const prevReq = makeReq(
        adminSessionToken,
        `/api/stock?preview=true&itemId=${item.id}&date=2026-10-16`,
      );
      const prevRes = await stockGet(prevReq as any);
      const prevData = await prevRes.json();
      const mainWh = prevData.warehouses.find((w: any) => w.warehouse === "WH-MAIN");
      assert.equal(mainWh.quantity, "20.000");
    }

    // 13. Test Audit Log API & search
    {
      const auditReq = makeReq(adminSessionToken, "/api/audit?action=STOCK_POSTED");
      const auditRes = await auditGet(auditReq as any);
      assert.equal(auditRes.status, 200);
      const auditData = await auditRes.json();
      assert.ok(auditData.rows.length >= 2);

      const issueAudit = auditData.rows.find(
        (r: any) => r.stockDetails?.reference === "OUT-01",
      );
      assert.ok(issueAudit);
      assert.equal(issueAudit.stockDetails.kind, "ISSUE");
      assert.equal(issueAudit.stockDetails.itemName, "سماد مركب نتروجيني");
      assert.equal(issueAudit.stockDetails.warehouseName, "المخزن الرئيسي");
      assert.equal(Number(issueAudit.stockDetails.quantity), 30);
      assert.equal(issueAudit.stockDetails.unit, "kg");
      assert.equal(issueAudit.stockDetails.method, "PERIODIC_WEIGHTED_AVERAGE");
      assert.equal(issueAudit.stockDetails.valuationMethod, "متوسط تكلفة الفترة");
      assert.equal(issueAudit.stockDetails.hasImmediateEntry, false);

      // Test searching by reference "OUT-01"
      const searchReq = makeReq(adminSessionToken, "/api/audit?search=OUT-01");
      const searchRes = await auditGet(searchReq as any);
      const searchData = await searchRes.json();
      assert.ok(
        searchData.rows.some((r: any) => r.stockDetails?.reference === "OUT-01"),
      );
    }

    // 14. Test Inventory Close does not double count and retains engine integrity
    {
      const closeRes = await locked(company.id, (tx) =>
        closeInventory(tx, adminUser, new Date("2026-10-31")),
      );
      assert.ok(closeRes);
      assert.equal(closeRes.companyId, company.id);

      // Verify balances after closing
      const balances = await stockBalances(
        company.id,
        new Date("2026-10-31"),
      );
      const mainBalance = balances.find(
        (b) => b.itemId === item.id && b.warehouse === "WH-MAIN",
      );
      assert.equal(mainBalance?.quantity, "20.000");
      assert.equal(Number(mainBalance?.averageCost), 20);
    }
  } finally {
    // Clean up isolated test company
    await prisma.auditLog.deleteMany({ where: { companyId: company.id } });
    await prisma.stockMovement.deleteMany({ where: { companyId: company.id } });
    await prisma.inventoryClose.deleteMany({ where: { companyId: company.id } });
    await prisma.journalEntry.updateMany({
      where: { companyId: company.id },
      data: { status: "DRAFT", reversalOf: null },
    });
    await prisma.journalLine.deleteMany({ where: { companyId: company.id } });
    await prisma.journalEntry.deleteMany({ where: { companyId: company.id } });
    await prisma.account.deleteMany({ where: { companyId: company.id } });
    await prisma.sequence.deleteMany({ where: { companyId: company.id } });
    await prisma.register.deleteMany({ where: { companyId: company.id } });
    await prisma.session.deleteMany({
      where: { user: { companyId: company.id } },
    });
    await prisma.user.deleteMany({ where: { companyId: company.id } });
    await prisma.company.deleteMany({ where: { id: company.id } });
  }
});
