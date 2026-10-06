import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/server";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Setting up isolated QA test company and users...");

  // 1. Create or find QA Company
  let qaCompany = await prisma.company.findFirst({
    where: { name: "شركة اختبار الجودة QA (شركة مستقلة)" },
  });

  if (!qaCompany) {
    qaCompany = await prisma.company.create({
      data: {
        name: "شركة اختبار الجودة QA (شركة مستقلة)",
        currency: "EGP",
        isDefault: false,
      },
    });
    console.log(`Created QA Company: ${qaCompany.name} (ID: ${qaCompany.id})`);
  } else {
    console.log(`Using existing QA Company: ${qaCompany.name} (ID: ${qaCompany.id})`);
  }

  // 2. Clone standard accounts from Company 1 to QA Company
  const c1Accounts = await prisma.account.findMany({
    where: { companyId: 1 },
    orderBy: { level: "asc" },
  });

  let copied = 0;
  for (const acc of c1Accounts) {
    await prisma.account.upsert({
      where: {
        companyId_code: {
          companyId: qaCompany.id,
          code: acc.code,
        },
      },
      update: {},
      create: {
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
    copied++;
  }
  console.log(`Seeded ${copied} accounts into QA Company ID ${qaCompany.id}.`);

  // 3. Create or Update QA Users with dynamic secure password
  const testPassword =
    process.env.QA_PASSWORD ||
    crypto.randomBytes(24).toString("base64url") + "Aa1!";
  const passwordHash = hashPassword(testPassword);

  const users = [
    { email: "qa-admin@example.test", name: "مدير اختبار QA", role: "admin" },
    { email: "qa-accountant@example.test", name: "محاسب اختبار QA", role: "accountant" },
    { email: "qa-auditor@example.test", name: "مراجع اختبار QA", role: "auditor" },
  ];

  for (const u of users) {
    const existingUser = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        companyId: qaCompany.id,
        role: u.role,
        isActive: true,
        passwordHash,
      },
      create: {
        companyId: qaCompany.id,
        email: u.email,
        name: u.name,
        role: u.role,
        isActive: true,
        passwordHash,
      },
    });
    // Invalidate existing sessions for this user
    await prisma.session.deleteMany({
      where: { userId: existingUser.id },
    });
    console.log(`Configured user: ${u.email} (${u.role}) - revoked existing sessions`);
  }

  console.log("QA Setup completed successfully!");
}

main()
  .catch((e) => {
    console.error("QA Setup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
