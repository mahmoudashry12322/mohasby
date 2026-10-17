import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";
import { entryAction, createEntry, entrySchema } from "@/lib/accounting/ledger";
import { POST as journalActionPost } from "@/app/api/journal/[id]/route";
import { GET as journalGet } from "@/app/api/journal/route";

function digest(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

test("Journal entry reversal UX and concurrency safeguards across tenants", async (t) => {
  // 1. Create isolated test company
  const company = await prisma.company.create({
    data: {
      name: "شركة اختبار عكس القيود " + Date.now(),
      users: {
        create: {
          name: "مدير الاختبار",
          email: `admin_${Date.now()}@test.local`,
          passwordHash: "test_hash",
          role: "admin",
        },
      },
    },
    include: { users: true },
  });

  const user = company.users[0];
  const actor = {
    id: user.id,
    companyId: company.id,
    role: "admin",
  };

  const rawToken = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: digest(rawToken),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });

  const baseUrl = process.env.APP_URL || "https://mohasby.mahmoudashry.site";
  const cookieHeader = `mohasby_session=${rawToken}`;

  // Helper to make authenticated API requests
  function makeRequest(path: string, body?: unknown, method = "POST") {
    return new Request(`${baseUrl}${path}`, {
      method: body ? method : "GET",
      headers: {
        Cookie: cookieHeader,
        Origin: baseUrl,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // Setup basic chart of accounts
  await prisma.account.createMany({
    data: [
      {
        companyId: company.id,
        code: "101",
        name: "خزينة رئيسية",
        accountClass: "الأصول",
        nature: "مدين",
        statementType: "قائمة المركز المالي",
        level: 4,
      },
      {
        companyId: company.id,
        code: "401",
        name: "إيرادات مبيعات",
        accountClass: "الإيرادات",
        nature: "دائن",
        statementType: "قائمة الدخل",
        level: 4,
      },
    ],
  });

  await t.test("Initial reversal succeeds and sets cross references", async () => {
    // Create and post an original entry
    const entry = await createEntry(
      actor,
      entrySchema.parse({
        date: "2026-10-15",
        description: "مبيعات نقدية أصلية",
        requestKey: "req-orig-" + Date.now(),
        lines: [
          { accountCode: "101", debit: "5000", credit: "0" },
          { accountCode: "401", debit: "0", credit: "5000" },
        ],
      }),
    );
    await entryAction(actor, entry.id, "post");

    // Check GET /api/journal before reversal
    const getResBefore = await journalGet(makeRequest("/api/journal"));
    assert.equal(getResBefore.status, 200);
    const beforeData = await getResBefore.json();
    const origInListBefore = beforeData.entries.find(
      (e: any) => e.id === entry.id,
    );
    assert.equal(origInListBefore.reversedBy, null);
    assert.equal(origInListBefore.reversedEntry, null);

    // Reverse via API
    const reverseRes = await journalActionPost(
      makeRequest(`/api/journal/${entry.id}`, {
        action: "reverse",
        date: "2026-10-15",
      }),
      { params: Promise.resolve({ id: entry.id }) },
    );
    assert.equal(reverseRes.status, 200);
    const reverseData = await reverseRes.json();
    assert.equal(reverseData.success, true);
    const revEntry = reverseData.entry;
    assert.ok(revEntry.number > entry.number);

    // Check GET /api/journal after reversal
    const getResAfter = await journalGet(makeRequest("/api/journal"));
    const afterData = await getResAfter.json();
    const origInListAfter = afterData.entries.find(
      (e: any) => e.id === entry.id,
    );
    const revInListAfter = afterData.entries.find(
      (e: any) => e.id === revEntry.id,
    );

    // Original entry MUST point to reversing entry
    assert.deepEqual(origInListAfter.reversedBy, {
      id: revEntry.id,
      number: revEntry.number,
    });
    assert.equal(origInListAfter.reversedEntry, null);

    // Reversal entry MUST point to original entry
    assert.deepEqual(revInListAfter.reversedEntry, {
      id: entry.id,
      number: entry.number,
    });
    assert.equal(revInListAfter.reversedBy, null);
  });

  await t.test("Repeated reversal returns clear 409 error instead of silence", async () => {
    // Fetch current entries count and sum
    const countBefore = await prisma.journalEntry.count({
      where: { companyId: company.id },
    });
    const entries = await prisma.journalEntry.findMany({
      where: { companyId: company.id },
      include: { lines: true },
    });
    const orig = entries.find((e) => !e.reversalOf && e.description.includes("مبيعات نقدية أصلية"))!;

    // Call API again on already reversed entry
    const repeatRes = await journalActionPost(
      makeRequest(`/api/journal/${orig.id}`, {
        action: "reverse",
        date: "2026-10-15",
      }),
      { params: Promise.resolve({ id: orig.id }) },
    );

    assert.equal(repeatRes.status, 409);
    const repeatData = await repeatRes.json();
    assert.equal(repeatData.success, false);
    assert.match(repeatData.error, /هذا القيد تم عكسه مسبقًا بالقيد رقم/);

    // Verify count did not change
    const countAfter = await prisma.journalEntry.count({
      where: { companyId: company.id },
    });
    assert.equal(countAfter, countBefore);
  });

  await t.test("Attempting to reverse a reversal entry returns clear 409", async () => {
    const rev = await prisma.journalEntry.findFirst({
      where: { companyId: company.id, reversalOf: { not: null } },
    });
    assert.ok(rev);

    const res = await journalActionPost(
      makeRequest(`/api/journal/${rev.id}`, {
        action: "reverse",
        date: "2026-10-15",
      }),
      { params: Promise.resolve({ id: rev.id }) },
    );

    assert.equal(res.status, 409);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /قيد عكسي/);
  });

  await t.test("Concurrent reversal requests create exactly one reversal entry and reject duplicates", async () => {
    // Create new entry
    const entry = await createEntry(
      actor,
      entrySchema.parse({
        date: "2026-10-15",
        description: "قيد فحص التزامن",
        requestKey: "req-conc-" + Date.now(),
        lines: [
          { accountCode: "101", debit: "3000", credit: "0" },
          { accountCode: "401", debit: "0", credit: "3000" },
        ],
      }),
    );
    await entryAction(actor, entry.id, "post");

    const countBefore = await prisma.journalEntry.count({
      where: { companyId: company.id },
    });

    // Fire 5 concurrent requests simultaneously
    const results = await Promise.all(
      Array.from({ length: 5 }).map(() =>
        journalActionPost(
          makeRequest(`/api/journal/${entry.id}`, {
            action: "reverse",
            date: "2026-10-15",
          }),
          { params: Promise.resolve({ id: entry.id }) },
        ).then(async (r) => ({
          status: r.status,
          body: await r.json(),
        })),
      ),
    );

    // Exactly one must be 200 OK
    const successes = results.filter((r) => r.status === 200);
    const conflicts = results.filter((r) => r.status === 409);

    assert.equal(successes.length, 1);
    assert.equal(conflicts.length, 4);

    for (const c of conflicts) {
      assert.match(c.body.error, /تم عكسه مسبقًا/);
    }

    // Exactly 1 new entry was created in DB
    const countAfter = await prisma.journalEntry.count({
      where: { companyId: company.id },
    });
    assert.equal(countAfter, countBefore + 1);
  });

  // Cleanup test company and its records
  await prisma.auditLog.deleteMany({ where: { companyId: company.id } });
  // Set entries to DRAFT so the balance trigger doesn't trigger on partial deletion
  await prisma.journalEntry.updateMany({
    where: { companyId: company.id },
    data: { status: "DRAFT", reversalOf: null },
  });
  await prisma.journalLine.deleteMany({ where: { companyId: company.id } });
  await prisma.journalEntry.deleteMany({ where: { companyId: company.id } });
  await prisma.account.deleteMany({ where: { companyId: company.id } });
  await prisma.sequence.deleteMany({ where: { companyId: company.id } });
  await prisma.session.deleteMany({ where: { user: { companyId: company.id } } });
  await prisma.user.deleteMany({ where: { companyId: company.id } });
  await prisma.company.deleteMany({ where: { id: company.id } });
});
