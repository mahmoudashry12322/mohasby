import { z } from "zod";
import { authorize, hashPassword } from "@/lib/auth/server";
import prisma from "@/lib/prisma";
import { body, fail, HttpError, ok } from "@/lib/server/http";
import { closeInventory } from "@/lib/accounting/periodic-stock";
import { audit, dateOnly, locked } from "@/lib/accounting/ledger";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const user = await authorize();
    return ok({
      company: user.company,
      periods: await prisma.fiscalPeriod.findMany({
        where: { companyId: user.companyId },
        orderBy: { start: "desc" },
      }),
      users:
        user.role === "admin"
          ? await prisma.user.findMany({
              where: { companyId: user.companyId },
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
              },
            })
          : [],
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    const user = await authorize(request, true, true),
      raw = await body(request);
    const result = await locked(user.companyId, async (tx) => {
      if (raw.action === "company") {
        const input = z
          .object({
            name: z.string().min(1).max(200),
            taxNumber: z.string().max(100),
            commercialReg: z.string().max(100),
          })
          .parse(raw);
        const saved = await tx.company.update({
          where: { id: user.companyId },
          data: input,
        });
        await audit(tx, user, "COMPANY_UPDATED", String(user.companyId));
        return saved;
      }
      if (raw.action === "period") {
        const input = z
          .object({
            name: z.string().min(1).max(100),
            start: dateOnly,
            end: dateOnly,
          })
          .parse(raw);
        if (input.start > input.end)
          throw new HttpError(400, "الفترة غير صالحة");
        if (
          await tx.fiscalPeriod.count({
            where: {
              companyId: user.companyId,
              start: { lte: new Date(input.end) },
              end: { gte: new Date(input.start) },
            },
          })
        )
          throw new HttpError(409, "الفترة تتداخل مع فترة موجودة");
        const saved = await tx.fiscalPeriod.create({
          data: {
            companyId: user.companyId,
            name: input.name,
            start: new Date(input.start),
            end: new Date(input.end),
          },
        });
        await audit(tx, user, "PERIOD_CREATED", saved.id);
        return saved;
      }
      if (raw.action === "close" || raw.action === "reopen") {
        const input = z.object({ id: z.string() }).parse(raw),
          period = await tx.fiscalPeriod.findFirst({
            where: { id: input.id, companyId: user.companyId },
          });
        if (!period) throw new HttpError(404, "الفترة غير موجودة");
        if (
          raw.action === "close" &&
          (await tx.journalEntry.count({
            where: {
              companyId: user.companyId,
              status: "DRAFT",
              date: { lte: period.end },
            },
          }))
        )
          throw new HttpError(
            409,
            "رحّل أو ألغِ المسودات حتى تاريخ الإقفال أولاً",
          );
        if (raw.action === "close") await closeInventory(tx, user, period.end);
        if (
          raw.action === "reopen" &&
          user.company.closedThrough &&
          period.start <= user.company.closedThrough
        )
          throw new HttpError(
            409,
            "إقفال مخزون نهائي. التصحيح بقيد في فترة مفتوحة، مع الاحتفاظ بالتاريخ",
          );
        const saved = await tx.fiscalPeriod.update({
          where: { id: period.id },
          data: { isClosed: raw.action === "close" },
        });
        await audit(
          tx,
          user,
          raw.action === "close" ? "PERIOD_CLOSED" : "PERIOD_REOPENED",
          period.id,
        );
        return saved;
      }
      if (raw.action === "user") {
        const input = z
          .object({
            id: z.string().optional(),
            email: z.string().email(),
            name: z.string().min(1).max(200),
            role: z.enum(["admin", "accountant", "auditor"]),
            isActive: z.boolean(),
            password: z.string().max(256).optional(),
          })
          .parse(raw);
        if (input.id === user.id && (input.role !== "admin" || !input.isActive))
          throw new HttpError(400, "لا يمكنك إيقاف حسابك أو إزالة صلاحيتك");
        if (
          input.id &&
          !(await tx.user.findFirst({
            where: { id: input.id, companyId: user.companyId },
          }))
        )
          throw new HttpError(404, "المستخدم غير موجود");
        if (!input.id && !input.password)
          throw new HttpError(400, "كلمة المرور مطلوبة");
        const passwordHash = input.password
          ? hashPassword(input.password)
          : undefined;
        const data = {
          email: input.email.toLowerCase(),
          name: input.name,
          role: input.role,
          isActive: input.isActive,
          ...(passwordHash ? { passwordHash } : {}),
        };
        const saved = input.id
          ? await tx.user.update({ where: { id: input.id }, data })
          : await tx.user.create({
              data: {
                ...data,
                companyId: user.companyId,
                passwordHash: passwordHash!,
              },
            });
        if (input.id)
          await tx.session.deleteMany({ where: { userId: input.id } });
        await audit(tx, user, "USER_UPDATED", saved.id);
        return { id: saved.id };
      }
      throw new HttpError(400, "عملية غير معروفة");
    });
    return ok({ result });
  } catch (e) {
    return fail(e);
  }
}
