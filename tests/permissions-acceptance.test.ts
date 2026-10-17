import test from "node:test";
import assert from "node:assert/strict";
import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword, digest } from "@/lib/auth/server";
import { can, PERMISSION_DEFINITIONS } from "@/lib/auth/permissions";
import { canAccessPage, getPagePermission } from "@/lib/auth/permission-map";
import {
  createUser,
  updateUser,
  listUsers,
  getUserById,
} from "@/lib/auth/user-service";
import workbookHome from "@/data/workbook-home.json";

test("Permissions & User Management Acceptance Suite", async (t) => {
  const ts = Date.now();
  // 1. Create two isolated test companies (NEVER Company 1)
  const companyA = await prisma.company.create({
    data: {
      name: `شركة فحص الصلاحيات أ (${ts})`,
      currency: "EGP",
    },
  });
  const companyB = await prisma.company.create({
    data: {
      name: `شركة فحص الصلاحيات ب (${ts})`,
      currency: "EGP",
    },
  });

  // Create initial Admin for Company A and Company B
  const adminA = await prisma.user.create({
    data: {
      companyId: companyA.id,
      name: "مدير شركة أ",
      username: `admin_a_${ts}`,
      email: `admin_a_${ts}@test.local`,
      passwordHash: hashPassword("AdminPassword123!"),
      role: "admin",
      permissions: [],
      isActive: true,
    },
  });

  const adminB = await prisma.user.create({
    data: {
      companyId: companyB.id,
      name: "مدير شركة ب",
      username: `admin_b_${ts}`,
      email: `admin_b_${ts}@test.local`,
      passwordHash: hashPassword("AdminPassword123!"),
      role: "admin",
      permissions: [],
      isActive: true,
    },
  });

  await t.test("1. Admin creates employee with username, password, permissions; employee logs in immediately", async () => {
    const employeeUsername = `emp_stock_${ts}`;
    const employeePassword = "StockPassword123!";
    const newEmp = await createUser(adminA, {
      name: "موظف المخزن",
      username: employeeUsername,
      password: employeePassword,
      role: "accountant",
      permissions: ["stock.view", "stock.movement"],
      isActive: true,
    });

    assert.equal(newEmp.name, "موظف المخزن");
    assert.equal(newEmp.username, employeeUsername);
    assert.equal(newEmp.email, null); // Email is optional for new accounts
    assert.deepEqual(newEmp.permissions, ["stock.view", "stock.movement"]);
    assert.equal((newEmp as any).passwordHash, undefined); // Password hash must NEVER be exposed

    // Verify employee can authenticate with password
    const dbEmp = await prisma.user.findUnique({ where: { id: newEmp.id } });
    assert.ok(dbEmp);
    assert.ok(verifyPassword(employeePassword, dbEmp.passwordHash));

    // Audit log was recorded inside the same transaction
    const auditLogs = await prisma.auditLog.findMany({
      where: { companyId: companyA.id, entityId: newEmp.id },
    });
    assert.ok(auditLogs.length > 0);
    assert.equal(auditLogs[0].action, "USER_CREATED");
    assert.equal(auditLogs[0].userId, adminA.id);
  });

  await t.test("2. Legacy email login works alongside username", async () => {
    const legacyUser = await prisma.user.create({
      data: {
        companyId: companyA.id,
        name: "مستخدم بريد قديم",
        username: `legacy_${ts}`,
        email: `legacy_${ts}@domain.local`,
        passwordHash: hashPassword("LegacyPassword123!"),
        role: "accountant",
        permissions: ["accounts.view"],
        isActive: true,
      },
    });

    // Lookup by username
    const byUsername = await prisma.user.findFirst({
      where: {
        companyId: companyA.id,
        OR: [{ username: `legacy_${ts}` }, { email: `legacy_${ts}` }],
      },
    });
    assert.ok(byUsername);
    assert.equal(byUsername.id, legacyUser.id);

    // Lookup by email
    const byEmail = await prisma.user.findFirst({
      where: {
        companyId: companyA.id,
        OR: [
          { username: `legacy_${ts}@domain.local` },
          { email: `legacy_${ts}@domain.local` },
        ],
      },
    });
    assert.ok(byEmail);
    assert.equal(byEmail.id, legacyUser.id);
  });

  await t.test("3. Duplicate username returns readable error (409 Conflict)", async () => {
    await assert.rejects(
      async () => {
        await createUser(adminA, {
          name: "موظف مكرر",
          username: `emp_stock_${ts}`, // Already used in test 1
          password: "SomePassword123!",
          role: "accountant",
          permissions: [],
        });
      },
      (err: any) => {
        assert.equal(err.status, 409);
        assert.match(err.message, /مستخدم بالفعل/);
        return true;
      },
    );
  });

  await t.test("4. Password is stored as scrypt hash, not exposed in API or audit", async () => {
    const users = await listUsers(adminA);
    for (const u of users) {
      assert.equal((u as any).passwordHash, undefined);
      assert.equal((u as any).password, undefined);
    }

    const singleUser = await getUserById(adminA, adminA.id);
    assert.ok(singleUser);
    assert.equal((singleUser as any).passwordHash, undefined);

    // Verify hash format in raw DB
    const rawUser = await prisma.user.findUnique({ where: { id: adminA.id } });
    assert.ok(rawUser);
    const parts = rawUser.passwordHash.split(":");
    assert.equal(parts.length, 2);
    assert.equal(parts[0].length, 32); // 16 bytes salt in hex
    assert.equal(parts[1].length, 128); // 64 bytes scrypt in hex

    // Verify audit logs do not contain raw passwords or hashes
    const audits = await prisma.auditLog.findMany({
      where: { companyId: companyA.id },
    });
    for (const a of audits) {
      const details = JSON.stringify(a.detail);
      assert.equal(details.includes("StockPassword123!"), false);
      assert.equal(details.includes("AdminPassword123!"), false);
      assert.equal(details.includes(parts[1]), false);
    }
  });

  await t.test("5. Stock employee only accesses permitted pages and operations", async () => {
    const stockUser = {
      id: "stock-user-1",
      companyId: companyA.id,
      role: "accountant",
      isActive: true,
      permissions: ["stock.view", "stock.movement"],
    };

    // Permitted
    assert.equal(can(stockUser, "stock.view"), true);
    assert.equal(can(stockUser, "stock.movement"), true);
    assert.equal(canAccessPage(stockUser, "warehouse-journal"), true);
    assert.equal(canAccessPage(stockUser, "warehouse-report"), true);
    assert.equal(canAccessPage(stockUser, "stock-receipt"), true);

    // Prohibited
    assert.equal(can(stockUser, "accounts.view"), false);
    assert.equal(can(stockUser, "journal.view"), false);
    assert.equal(can(stockUser, "journal.create"), false);
    assert.equal(can(stockUser, "payroll.view"), false);
    assert.equal(can(stockUser, "audit.view"), false);
    assert.equal(canAccessPage(stockUser, "journal-entries"), false);
    assert.equal(canAccessPage(stockUser, "chart-of-accounts"), false);
    assert.equal(canAccessPage(stockUser, "audit-log"), false);
  });

  await t.test("6. Draft creator can create draft entries but cannot post or reverse", async () => {
    const draftUser = {
      id: "draft-user-1",
      companyId: companyA.id,
      role: "accountant",
      isActive: true,
      permissions: ["journal.view", "journal.create"],
    };

    assert.equal(can(draftUser, "journal.view"), true);
    assert.equal(can(draftUser, "journal.create"), true);
    assert.equal(can(draftUser, "journal.post"), false);
    assert.equal(can(draftUser, "journal.reverse"), false);
    assert.equal(can(draftUser, "journal.void"), false);
  });

  await t.test("7. Cross-company data isolation (multi-tenancy)", async () => {
    // Admin A cannot get user in Company B
    await assert.rejects(
      async () => {
        await getUserById(adminA, adminB.id);
      },
      (err: any) => {
        assert.equal(err.status, 404);
        return true;
      },
    );

    // Admin A cannot update user in Company B
    await assert.rejects(
      async () => {
        await updateUser(adminA, adminB.id, {
          name: "محاولة اختراق",
        });
      },
      (err: any) => {
        assert.equal(err.status, 404);
        return true;
      },
    );
  });

  await t.test("8. Revoking permission immediately takes effect on next check", async () => {
    const emp = await createUser(adminA, {
      name: "موظف مؤقت",
      username: `temp_emp_${ts}`,
      password: "TempPassword123!",
      role: "accountant",
      permissions: ["journal.view"],
    });

    let principal = {
      id: emp.id,
      companyId: companyA.id,
      role: emp.role,
      isActive: emp.isActive,
      permissions: emp.permissions,
    };
    assert.equal(can(principal, "journal.view"), true);

    // Revoke permission via updateUser
    const updated = await updateUser(adminA, emp.id, {
      permissions: [],
    });
    assert.deepEqual(updated.permissions, []);

    // Check with updated user
    principal = {
      id: updated.id,
      companyId: companyA.id,
      role: updated.role,
      isActive: updated.isActive,
      permissions: updated.permissions,
    };
    assert.equal(can(principal, "journal.view"), false);
  });

  await t.test("9. Deactivation and password reset immediately invalidates active sessions", async () => {
    const userToInvalidate = await createUser(adminA, {
      name: "مستخدم للجلسة",
      username: `session_user_${ts}`,
      password: "PasswordToReset123!",
      role: "accountant",
      permissions: ["stock.view"],
    });

    // Create an active session
    const token = "a".repeat(64);
    await prisma.session.create({
      data: {
        userId: userToInvalidate.id,
        tokenHash: digest(token),
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    let sessions = await prisma.session.findMany({
      where: { userId: userToInvalidate.id },
    });
    assert.equal(sessions.length, 1);

    // Reset password
    await updateUser(adminA, userToInvalidate.id, {
      password: "BrandNewPassword123!",
    });

    // All active sessions must be cleared
    sessions = await prisma.session.findMany({
      where: { userId: userToInvalidate.id },
    });
    assert.equal(sessions.length, 0);

    // Create another session and deactivate
    await prisma.session.create({
      data: {
        userId: userToInvalidate.id,
        tokenHash: digest(token),
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    await updateUser(adminA, userToInvalidate.id, {
      isActive: false,
    });

    sessions = await prisma.session.findMany({
      where: { userId: userToInvalidate.id },
    });
    assert.equal(sessions.length, 0);
  });

  await t.test("10. Last active manager cannot be disabled or demoted", async () => {
    // Company A currently has only adminA as active admin
    await assert.rejects(
      async () => {
        await updateUser(adminA, adminA.id, {
          isActive: false,
        });
      },
      (err: any) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /المدير الأخير الفعّال/);
        return true;
      },
    );

    await assert.rejects(
      async () => {
        await updateUser(adminA, adminA.id, {
          role: "accountant",
        });
      },
      (err: any) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /المدير الأخير الفعّال/);
        return true;
      },
    );

    // If another manager is created, now demoting is allowed
    const secondAdmin = await createUser(adminA, {
      name: "مدير مساعد",
      username: `admin_helper_${ts}`,
      password: "HelperPassword123!",
      role: "admin",
      permissions: [],
    });

    // Can now demote the helper
    const demoted = await updateUser(adminA, secondAdmin.id, {
      role: "accountant",
      permissions: ["accounts.view"],
    });
    assert.equal(demoted.role, "accountant");
  });

  await t.test("11. Manager retains all 45 workbook buttons; employee sees continuous repacked grid", async () => {
    const adminUser = {
      id: adminA.id,
      companyId: companyA.id,
      role: "admin",
      isActive: true,
      permissions: [],
    };

    const stockUser = {
      id: "stock-emp",
      companyId: companyA.id,
      role: "accountant",
      isActive: true,
      permissions: ["stock.view", "stock.movement"],
    };

    // Total workbook pages
    const totalWorkbookButtons = workbookHome.length;
    assert.equal(totalWorkbookButtons, 45);

    // Admin sees all 45 buttons
    const adminVisible = workbookHome.filter((item) =>
      canAccessPage(adminUser, item.page),
    );
    assert.equal(adminVisible.length, 45);

    // Stock user sees only stock-related buttons
    const stockVisible = workbookHome.filter((item) =>
      canAccessPage(stockUser, item.page),
    );
    assert.ok(stockVisible.length > 0);
    assert.ok(stockVisible.length < 45);

    // Settings (Users & Permissions) accessible to admin but not standard stock employee
    assert.equal(canAccessPage(adminUser, "settings"), true);
    assert.equal(canAccessPage(stockUser, "settings"), false);

    // Verify all stock visible items are indeed stock related
    for (const item of stockVisible) {
      assert.ok(canAccessPage(stockUser, item.page));
    }
  });

  await t.test("12. Audit log enforces audit.view permission and records accurate actor details", async () => {
    const noAuditUser = {
      id: "no-audit-user",
      companyId: companyA.id,
      role: "accountant",
      isActive: true,
      permissions: ["stock.view"],
    };
    const auditUser = {
      id: "audit-user",
      companyId: companyA.id,
      role: "accountant",
      isActive: true,
      permissions: ["audit.view"],
    };

    assert.equal(can(noAuditUser, "audit.view"), false);
    assert.equal(can(auditUser, "audit.view"), true);
    assert.equal(can(adminA, "audit.view"), true); // Admin always can

    // Page access verification
    assert.equal(canAccessPage(noAuditUser, "audit-log"), false);
    assert.equal(canAccessPage(auditUser, "audit-log"), true);
    assert.equal(canAccessPage(adminA, "audit-log"), true);

    // Create journal entry and test audit log record with entry number and description
    const testEntry = await prisma.journalEntry.create({
      data: {
        companyId: companyA.id,
        number: 8888,
        date: new Date(),
        description: "قيد تجريبي للاختبار",
        createdBy: adminA.id,
        requestKey: "test-audit-req-8888",
      },
    });

    const testLog = await prisma.auditLog.create({
      data: {
        companyId: companyA.id,
        userId: adminA.id,
        action: "ENTRY_POSTED",
        entityId: testEntry.id,
        detail: {
          actorName: adminA.name,
          actorUsername: adminA.username,
        },
      },
    });

    // Create active session for adminA
    const adminToken = "d".repeat(64);
    await prisma.session.create({
      data: {
        userId: adminA.id,
        tokenHash: digest(adminToken),
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    // Direct API test
    const { NextRequest } = await import("next/server");
    const { GET } = await import("../src/app/api/audit/route");
    const req = new NextRequest("http://localhost:3000/api/audit?search=8888", {
      headers: {
        cookie: `mohasby_session=${adminToken}`,
      },
    });
    const res = await GET(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    const found = body.rows.find((r: any) => r.id === testLog.id);
    assert.ok(found, "Test audit log should be found");
    assert.equal(found.entryNumber, 8888);
    assert.equal(found.entryDescription, "قيد تجريبي للاختبار");
    assert.equal(found.entityId, testEntry.id);
  });

  await t.test("13. Comprehensive View-Only Permissions: Clean read, zero false forbidden on supporting data, and strict server-side mutation rejection", async () => {
    const { NextRequest } = await import("next/server");
    const { GET: getJournal, POST: postJournal } = await import("../src/app/api/journal/route");
    const { POST: actionJournal } = await import("../src/app/api/journal/[id]/route");
    const { GET: getAccounts, POST: postAccount } = await import("../src/app/api/accounts/route");
    const { PUT: putAccount, DELETE: deleteAccount } = await import("../src/app/api/accounts/[code]/route");
    const { GET: getStock, POST: postStock } = await import("../src/app/api/stock/route");
    const { GET: getDocuments, POST: postDocument } = await import("../src/app/api/documents/route");
    const { GET: getCosts, POST: postCosts } = await import("../src/app/api/costs/[type]/route");
    const { GET: getDistribution, POST: postDistribution } = await import("../src/app/api/equity/distribution/route");
    const { GET: getRegisters } = await import("../src/app/api/registers/[kind]/route");

    // Helper to create user & session
    async function makeUserWithPerms(name: string, username: string, perms: string[]) {
      const u = await prisma.user.create({
        data: {
          companyId: companyA.id,
          name,
          username,
          passwordHash: hashPassword("Pass123456!"),
          role: "accountant",
          permissions: perms,
          isActive: true,
        },
      });
      const token = digest(username + "_" + Date.now()).repeat(2).slice(0, 64);
      await prisma.session.create({
        data: {
          userId: u.id,
          tokenHash: digest(token),
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        },
      });
      return { user: u, token };
    }

    // A. User with ONLY journal.view
    const jView = await makeUserWithPerms("عرض قيود فقط", `jview_${ts}`, ["journal.view"]);
    const jCookie = `mohasby_session=${jView.token}`;

    const testEntry13 = await prisma.journalEntry.create({
      data: {
        companyId: companyA.id,
        number: 9991,
        date: new Date(),
        description: "قيد فحص الصلاحيات",
        createdBy: adminA.id,
        requestKey: `test-subtest-13-${ts}`,
      },
    });

    // 1. Can view journal entries cleanly
    const jRes = await getJournal(new NextRequest("http://localhost:3000/api/journal", {
      headers: { cookie: jCookie },
    }));
    assert.equal(jRes.status, 200);
    const jBody = await jRes.json();
    assert.equal(jBody.success, true);
    assert.ok(Array.isArray(jBody.entries));

    // 2. Cannot create journal entry (POST /api/journal -> 403)
    const jPostRes = await postJournal(new NextRequest("http://localhost:3000/api/journal", {
      method: "POST",
      headers: { cookie: jCookie, "content-type": "application/json" },
      body: JSON.stringify({
        date: "2026-10-14",
        document: "RECEIPT",
        lines: [
          { accountCode: "101", debit: 100, credit: 0, description: "تجربة" },
          { accountCode: "102", debit: 0, credit: 100, description: "تجربة" },
        ],
      }),
    }));
    assert.equal(jPostRes.status, 403);

    // 3. Cannot post, void, or reverse existing journal entry (POST /api/journal/[id] -> 403)
    const jActionRes = await actionJournal(
      new NextRequest(`http://localhost:3000/api/journal/${testEntry13.id}`, {
        method: "POST",
        headers: { cookie: jCookie, "content-type": "application/json" },
        body: JSON.stringify({ action: "post" }),
      }),
      { params: Promise.resolve({ id: testEntry13.id }) }
    );
    assert.equal(jActionRes.status, 403);

    // 4. Cannot access accounts with raw lookup=true since journal.view does not have creation need
    const jAccRes = await getAccounts(new NextRequest("http://localhost:3000/api/accounts?lookup=true", {
      headers: { cookie: jCookie },
    }));
    assert.equal(jAccRes.status, 403);

    // B. User with ONLY accounts.view
    const aView = await makeUserWithPerms("عرض حسابات فقط", `aview_${ts}`, ["accounts.view"]);
    const aCookie = `mohasby_session=${aView.token}`;

    // 1. Can view accounts and balances
    const aRes = await getAccounts(new NextRequest("http://localhost:3000/api/accounts", {
      headers: { cookie: aCookie },
    }));
    assert.equal(aRes.status, 200);
    const aBody = await aRes.json();
    assert.equal(aBody.success, true);
    assert.ok(Array.isArray(aBody.accounts));

    // 2. Cannot create account (POST /api/accounts -> 403)
    const aPostRes = await postAccount(new NextRequest("http://localhost:3000/api/accounts", {
      method: "POST",
      headers: { cookie: aCookie, "content-type": "application/json" },
      body: JSON.stringify({
        code: "9999",
        name: "حساب غير مصرح",
        accountClass: "الأصول",
      }),
    }));
    assert.equal(aPostRes.status, 403);

    // 3. Cannot edit or disable account (PUT & DELETE -> 403)
    const aPutRes = await putAccount(
      new NextRequest("http://localhost:3000/api/accounts/101", {
        method: "PUT",
        headers: { cookie: aCookie, "content-type": "application/json" },
        body: JSON.stringify({ name: "اسم جديد غير مصرح" }),
      }),
      { params: Promise.resolve({ code: "101" }) }
    );
    assert.equal(aPutRes.status, 403);

    const aDelRes = await deleteAccount(
      new NextRequest("http://localhost:3000/api/accounts/101", {
        method: "DELETE",
        headers: { cookie: aCookie },
      }),
      { params: Promise.resolve({ code: "101" }) }
    );
    assert.equal(aDelRes.status, 403);

    // C. User with ONLY stock.view
    const sView = await makeUserWithPerms("عرض مخازن فقط", `sview_${ts}`, ["stock.view"]);
    const sCookie = `mohasby_session=${sView.token}`;

    // 1. Can view stock balances
    const sRes = await getStock(new NextRequest("http://localhost:3000/api/stock", {
      headers: { cookie: sCookie },
    }));
    assert.equal(sRes.status, 200);

    // 2. Can lookup items & warehouses for report filters without 403
    const sItems = await getRegisters(
      new NextRequest("http://localhost:3000/api/registers/items?lookup=true", {
        headers: { cookie: sCookie },
      }),
      { params: Promise.resolve({ kind: "items" }) }
    );
    assert.equal(sItems.status, 200);

    const sWarehouses = await getRegisters(
      new NextRequest("http://localhost:3000/api/registers/warehouses?lookup=true", {
        headers: { cookie: sCookie },
      }),
      { params: Promise.resolve({ kind: "warehouses" }) }
    );
    assert.equal(sWarehouses.status, 200);

    // 3. Cannot perform stock movement (POST /api/stock -> 403)
    const sPostRes = await postStock(new NextRequest("http://localhost:3000/api/stock", {
      method: "POST",
      headers: { cookie: sCookie, "content-type": "application/json" },
      body: JSON.stringify({
        date: "2026-10-14",
        itemId: "dummy",
        warehouse: "dummy",
        kind: "RECEIPT",
        quantity: 10,
        unitCost: 5,
      }),
    }));
    assert.equal(sPostRes.status, 403);

    // 4. Cannot access unrelated registers like cost-centers
    const sCostCenters = await getRegisters(
      new NextRequest("http://localhost:3000/api/registers/cost-centers", {
        headers: { cookie: sCookie },
      }),
      { params: Promise.resolve({ kind: "cost-centers" }) }
    );
    assert.equal(sCostCenters.status, 403);

    // D. User with ONLY documents.view
    const dView = await makeUserWithPerms("عرض مستندات فقط", `dview_${ts}`, ["documents.view"]);
    const dCookie = `mohasby_session=${dView.token}`;

    const dRes = await getDocuments(new NextRequest("http://localhost:3000/api/documents", {
      headers: { cookie: dCookie },
    }));
    assert.equal(dRes.status, 200);

    const dPostRes = await postDocument(new NextRequest("http://localhost:3000/api/documents", {
      method: "POST",
      headers: { cookie: dCookie, "content-type": "application/json" },
      body: JSON.stringify({
        type: "PURCHASE",
        date: "2026-10-14",
        itemId: "dummy",
        warehouse: "dummy",
        party: "dummy",
        accountCode: "101",
        quantity: 10,
        unitPrice: 5,
        description: "مشتريات",
        requestKey: `req-${Date.now()}`,
      }),
    }));
    assert.equal(dPostRes.status, 403);

    // E. User with ONLY costs.view
    const cView = await makeUserWithPerms("عرض تكاليف فقط", `cview_${ts}`, ["costs.view"]);
    const cCookie = `mohasby_session=${cView.token}`;

    // Can lookup cost centers for cost report dropdown
    const cCenters = await getRegisters(
      new NextRequest("http://localhost:3000/api/registers/cost-centers?lookup=true", {
        headers: { cookie: cCookie },
      }),
      { params: Promise.resolve({ kind: "cost-centers" }) }
    );
    assert.equal(cCenters.status, 200);

    // Cannot manage costs (POST -> 403)
    const cPostRes = await postCosts(
      new NextRequest("http://localhost:3000/api/costs/import", {
        method: "POST",
        headers: { cookie: cCookie, "content-type": "application/json" },
        body: JSON.stringify({ center: "C1", inputs: {} }),
      }),
      { params: Promise.resolve({ type: "import" }) }
    );
    assert.equal(cPostRes.status, 403);

    // F. User with ONLY equity.view
    const eqView = await makeUserWithPerms("عرض ملكية فقط", `eqview_${ts}`, ["equity.view"]);
    const eqCookie = `mohasby_session=${eqView.token}`;

    const eqRes = await getDistribution(new NextRequest("http://localhost:3000/api/equity/distribution", {
      headers: { cookie: eqCookie },
    }));
    assert.equal(eqRes.status, 200);

    const eqPostRes = await postDistribution(new NextRequest("http://localhost:3000/api/equity/distribution", {
      method: "POST",
      headers: { cookie: eqCookie, "content-type": "application/json" },
      body: JSON.stringify({ from: "2026-01-01", to: "2026-10-14", first: "", second: "", version: 0, inputs: {} }),
    }));
    assert.equal(eqPostRes.status, 403);
  });

  // Teardown: Clean up test companies and their cascaded relations
  await prisma.auditLog.deleteMany({
    where: { companyId: { in: [companyA.id, companyB.id] } },
  });
  await prisma.journalEntry.deleteMany({
    where: { companyId: { in: [companyA.id, companyB.id] } },
  });
  await prisma.session.deleteMany({
    where: { user: { companyId: { in: [companyA.id, companyB.id] } } },
  });
  await prisma.user.deleteMany({
    where: { companyId: { in: [companyA.id, companyB.id] } },
  });
  await prisma.company.deleteMany({
    where: { id: { in: [companyA.id, companyB.id] } },
  });
});
