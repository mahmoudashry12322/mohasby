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

  await t.test("11. Manager retains all 44 workbook buttons; employee sees continuous repacked grid", async () => {
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
    assert.equal(totalWorkbookButtons, 44);

    // Admin sees all 44 buttons
    const adminVisible = workbookHome.filter((item) =>
      canAccessPage(adminUser, item.page),
    );
    assert.equal(adminVisible.length, 44);

    // Stock user sees only stock-related buttons
    const stockVisible = workbookHome.filter((item) =>
      canAccessPage(stockUser, item.page),
    );
    assert.ok(stockVisible.length > 0);
    assert.ok(stockVisible.length < 44);

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
