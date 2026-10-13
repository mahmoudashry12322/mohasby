import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/server";

const prisma = new PrismaClient();

async function main() {
  console.log("Setting up new training company: «تدريب محمود — اختبار يدوي»...");

  // 1. Create or ensure Company
  let company = await prisma.company.findFirst({
    where: { name: "تدريب محمود — اختبار يدوي" },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "تدريب محمود — اختبار يدوي",
        currency: "EGP",
        isDefault: false,
        closedThrough: null,
      },
    });
    console.log(`Created Company: ${company.name} (ID: ${company.id})`);
  } else {
    console.log(`Found existing Company: ${company.name} (ID: ${company.id})`);
  }

  // 2. Clone standard chart of accounts from Company 1 with zero balances
  const c1Accounts = await prisma.account.findMany({
    where: { companyId: 1 },
    orderBy: { level: "asc" },
  });

  let copied = 0;
  for (const acc of c1Accounts) {
    await prisma.account.upsert({
      where: {
        companyId_code: {
          companyId: company.id,
          code: acc.code,
        },
      },
      update: {
        balance: 0,
      },
      create: {
        companyId: company.id,
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
        balance: 0,
        cashFlow: acc.cashFlow,
      },
    });
    copied++;
  }
  console.log(`Seeded ${copied} accounts with 0.00 balances into Company ID ${company.id}`);

  // 3. Create open fiscal period covering October 2026
  const period = await prisma.fiscalPeriod.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: "السنة المالية 2026",
      },
    },
    update: {
      start: new Date("2026-01-01"),
      end: new Date("2026-12-31"),
      isClosed: false,
    },
    create: {
      companyId: company.id,
      name: "السنة المالية 2026",
      start: new Date("2026-01-01"),
      end: new Date("2026-12-31"),
      isClosed: false,
    },
  });
  console.log(`Created/verified open Fiscal Period: ${period.name} (${period.start.toISOString().slice(0, 10)} to ${period.end.toISOString().slice(0, 10)})`);

  // 4. Create Manager User
  const managerUsername = "mahmoud_training";
  const managerPassword = "MahmoudTraining2026!";
  const passwordHash = hashPassword(managerPassword);

  const user = await prisma.user.upsert({
    where: { username: managerUsername },
    update: {
      companyId: company.id,
      name: "محمود عشري",
      role: "admin",
      isActive: true,
      passwordHash,
      permissions: [],
    },
    create: {
      companyId: company.id,
      username: managerUsername,
      email: "mahmoud.training@mohasby.site",
      name: "محمود عشري",
      role: "admin",
      isActive: true,
      passwordHash,
      permissions: [],
    },
  });

  // Revoke any prior session tokens for this user
  await prisma.session.deleteMany({ where: { userId: user.id } });

  console.log(`Manager user created successfully: ID: ${user.id}, Username: ${user.username}`);

  // 5. Verify zero entries, zero stock, zero transactions
  const entryCount = await prisma.journalEntry.count({ where: { companyId: company.id } });
  const registerCount = await prisma.register.count({ where: { companyId: company.id } });
  console.log(`Verification: Journal entries = ${entryCount}, Registers/Stock = ${registerCount}`);

  console.log("\n--- CREDENTIALS ---");
  console.log(`Company Name: ${company.name}`);
  console.log(`Company ID: ${company.id}`);
  console.log(`Login URL: https://mohasby.mahmoudashry.site/ar/login`);
  console.log(`Username (اسم الدخول): ${managerUsername}`);
  console.log(`Password (كلمة المرور): ${managerPassword}`);
  console.log("-------------------\n");
}

main()
  .catch((e) => {
    console.error("Error setting up training company:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
