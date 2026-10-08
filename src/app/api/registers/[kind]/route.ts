import { authorize } from "@/lib/auth/server";
import prisma from "@/lib/prisma";
import { body, fail, HttpError, ok } from "@/lib/server/http";
import {
  registerBase,
  registerSchemas,
  RegisterKind,
} from "@/lib/accounting/registers";
import { audit, locked } from "@/lib/accounting/ledger";
import { Prisma } from "@prisma/client";
function kindOf(k: string) {
  if (!Object.hasOwn(registerSchemas, k))
    throw new HttpError(404, "السجل غير موجود");
  return k as RegisterKind;
}
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  const resolved = await params;
  try {
    const user = await authorize();
    const kind = kindOf(resolved.kind);
    return ok({
      rows: await prisma.register.findMany({
        where: { companyId: user.companyId, kind },
        orderBy: { code: "asc" },
      }),
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  const resolved = await params;
  try {
    const user = await authorize(request, true),
      kind = kindOf(resolved.kind);
    const input = registerBase.parse(await body(request));
    const data = registerSchemas[kind].parse(
      input.data,
    ) as Prisma.InputJsonObject;
    const row = await locked(user.companyId, async (tx) => {
      if (
        ["parties", "employees"].includes(kind) &&
        (await tx.register.findFirst({
          where: {
            companyId: user.companyId,
            code: input.code,
            kind: kind === "employees" ? "parties" : "employees",
          },
        }))
      )
        throw new HttpError(
          409,
          "كود الموظف والطرف يجب أن يكون فريدًا بين الدليلين",
        );
      for (const [key, value] of Object.entries(data))
        if (key.toLowerCase().includes("account") && value) {
          if (
            !(await tx.account.findFirst({
              where: {
                companyId: user.companyId,
                code: String(value),
                isActive: true,
                isGroup: false,
              },
            }))
          )
            throw new HttpError(400, "الحساب التفصيلي غير موجود: " + value);
        }
      const existing = await tx.register.findUnique({
        where: {
          companyId_kind_code: {
            companyId: user.companyId,
            kind,
            code: input.code,
          },
        },
      });
      if (existing && existing.version !== input.version)
        throw new HttpError(409, "السجل تغير. أعد تحميل الصفحة قبل التعديل");
      if (
        existing &&
        kind === "employees" &&
        (await tx.journalLine.count({
          where: { companyId: user.companyId, party: existing.code },
        }))
      ) {
        const old = existing.data as Record<string, string>;
        for (const field of [
          "advanceAccount",
          "expenseAccount",
          "payableAccount",
          "insuranceAccount",
          "startDate",
        ])
          if (old[field] !== data[field])
            throw new HttpError(
              409,
              "حسابات الموظف وتاريخ بداية العمل لا تتغير بعد تسجيل قيود له",
            );
      }
      if (
        existing &&
        kind === "items" &&
        (await tx.stockMovement.count({ where: { itemId: existing.id } }))
      ) {
        const old = existing.data as Record<string, string>;
        for (const field of [
          "unit",
          "inventoryAccount",
          "purchaseAccount",
          "expenseAccount",
        ])
          if (old[field] !== data[field])
            throw new HttpError(
              409,
              "وحدة وحسابات الصنف المستخدم في حركة لا تتغير",
            );
      }
      if (
        existing &&
        kind === "assets" &&
        (await tx.journalEntry.count({
          where: {
            companyId: user.companyId,
            reference: existing.id,
            document: "DEPRECIATION",
          },
        }))
      )
        throw new HttpError(
          409,
          "الأصل له إهلاك مرحل. تغيير أساس الإهلاك يتطلب تسوية محاسبية",
        );
      if (kind === "banks" && data.accountCode)
        await tx.account.update({
          where: {
            companyId_code: {
              companyId: user.companyId,
              code: String(data.accountCode),
            },
          },
          data: { cashFlow: "CASH" },
        });
      const saved = await tx.register.upsert({
        where: {
          companyId_kind_code: {
            companyId: user.companyId,
            kind,
            code: input.code,
          },
        },
        create: {
          companyId: user.companyId,
          kind,
          code: input.code,
          name: input.name,
          data,
          isActive: input.isActive,
        },
        update: {
          name: input.name,
          data,
          isActive: input.isActive,
          version: { increment: 1 },
        },
      });
      await audit(tx, user, "REGISTER_SAVED", saved.id, {
        kind,
        code: input.code,
      });
      return saved;
    });
    return ok({ row });
  } catch (e) {
    return fail(e);
  }
}
