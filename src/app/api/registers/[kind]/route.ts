import { authorize } from "@/lib/auth/server";
import { can, requirePermission } from "@/lib/auth/permissions.server";
import { getRegisterPermissions } from "@/lib/auth/permission-map";
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
    const user = await authorize(request);
    const kind = kindOf(resolved.kind);
    const url = new URL(request.url);
    const partyType = url.searchParams.get("partyType") || undefined;
    const isLookup = url.searchParams.get("lookup") === "true";

    const { view: requiredViewPerm } = getRegisterPermissions(kind, partyType);
    const hasViewPerm = can(user, requiredViewPerm);

    // General lookup permissions (for dropdowns when user is creating vouchers/documents)
    const hasLookupNeed =
      can(user, "journal.create") ||
      can(user, "journal.edit") ||
      can(user, "documents.create") ||
      can(user, "stock.movement") ||
      can(user, "payroll.post") ||
      can(user, "assets.manage");

    if (kind === "employees") {
      const hasFullEmployeePerm =
        can(user, "employees.view") || can(user, "payroll.view");
      if (!hasFullEmployeePerm && !isLookup && !hasLookupNeed) {
        throw new HttpError(403, "ليس لديك صلاحية: شؤون الموظفين — عرض");
      }

      const rows = await prisma.register.findMany({
        where: { companyId: user.companyId, kind: "employees" },
        orderBy: { code: "asc" },
      });

      // If user only needs lookup and lacks full employees/payroll view:
      // Strip salary, allowances, and bank data!
      if (!hasFullEmployeePerm) {
        const strippedRows = rows.map((r) => ({
          id: r.id,
          companyId: r.companyId,
          kind: r.kind,
          code: r.code,
          name: r.name,
          isActive: r.isActive,
          version: r.version,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          data: {}, // Strip sensitive salary data
        }));
        return ok({ rows: strippedRows });
      }

      return ok({ rows });
    }

    if (kind === "parties") {
      // If a specific partyType is queried (CUSTOMER, SUPPLIER, PARTNER)
      if (partyType) {
        if (!hasViewPerm && !isLookup && !hasLookupNeed) {
          throw new HttpError(403, "ليس لديك صلاحية لعرض هذا الدليل");
        }
      } else {
        // General parties query: ensure user has at least one party view or lookup
        const canAnyParty =
          can(user, "customers.view") ||
          can(user, "suppliers.view") ||
          can(user, "partners.view");
        if (!canAnyParty && !isLookup && !hasLookupNeed) {
          throw new HttpError(403, "ليس لديك صلاحية لعرض سجلات الأطراف");
        }
      }

      const rawRows = await prisma.register.findMany({
        where: { companyId: user.companyId, kind: "parties" },
        orderBy: { code: "asc" },
      });

      // Filter rows strictly by what this user is allowed to see
      const filteredRows = rawRows.filter((r) => {
        if (user.role === "admin" || isLookup || hasLookupNeed) return true;
        const type = (r.data as Record<string, string>)?.type;
        if (type === "CUSTOMER") return can(user, "customers.view");
        if (type === "SUPPLIER") return can(user, "suppliers.view");
        if (type === "PARTNER") return can(user, "partners.view");
        return false;
      });

      return ok({ rows: filteredRows });
    }

    // Other registers (items, warehouses, cost-centers, cost-items, farms, banks, lookups)
    if (!hasViewPerm && !isLookup && !hasLookupNeed) {
      throw new HttpError(403, "ليس لديك صلاحية لعرض هذا الدليل");
    }

    const rows = await prisma.register.findMany({
      where: { companyId: user.companyId, kind },
      orderBy: { code: "asc" },
    });

    return ok({ rows });
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
    const kind = kindOf(resolved.kind);
    const input = registerBase.parse(await body(request));
    const data = registerSchemas[kind].parse(
      input.data,
    ) as Prisma.InputJsonObject;

    const partyType =
      kind === "parties" ? (data as Record<string, any>)?.type : undefined;
    const { manage: requiredManagePerm } = getRegisterPermissions(
      kind,
      partyType,
    );

    const user = await requirePermission(request, requiredManagePerm);

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
        throw new HttpError(409, "السجل تغير من مستخدم آخر. أعد تحميل الصفحة قبل التعديل");

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
          if (old[field] !== (data as Record<string, any>)[field])
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
          if (old[field] !== (data as Record<string, any>)[field])
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

      if (kind === "banks" && (data as Record<string, any>).accountCode)
        await tx.account.update({
          where: {
            companyId_code: {
              companyId: user.companyId,
              code: String((data as Record<string, any>).accountCode),
            },
          },
          data: {
            name: input.name,
            accountClass: "الأصول",
            statementType: "قائمة المركز المالي",
            nature: "مدين",
            cashFlow: "CASH",
          },
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
        name: input.name,
      });

      return saved;
    });

    return ok({ row });
  } catch (e) {
    return fail(e);
  }
}
