import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/server";
const db = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(),
    password = process.env.ADMIN_PASSWORD;
  if (!email || !password)
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) in the environment.",
    );
  const company = await db.company.findFirst({ orderBy: { id: "asc" } });
  if (!company) throw new Error("Run the chart-of-accounts seed first.");
  if (await db.user.findUnique({ where: { email } }))
    throw new Error(
      "User already exists; passwords are never overwritten by setup.",
    );
  await db.user.create({
    data: {
      companyId: company.id,
      email,
      name: process.env.ADMIN_NAME || "مدير النظام",
      passwordHash: hashPassword(password),
      role: "admin",
    },
  });
  console.log("Administrator created.");
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
