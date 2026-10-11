import { z } from "zod";
import { authorize } from "@/lib/auth/server";
import { body, fail, HttpError, ok } from "@/lib/server/http";
import {
  audit,
  locked,
  openDate,
  createEntryTx,
  entrySchema,
  requestDigest,
  sameRequest,
} from "@/lib/accounting/ledger";
import {
  payrollMonth,
  payrollMovementSchema,
  payrollReport,
  monthRange,
} from "@/lib/accounting/payroll";
import { D } from "@/lib/accounting/calculations";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const actor = await authorize();
    const month = payrollMonth.parse(
      new URL(request.url).searchParams.get("month"),
    );
    return ok(
      await locked(actor.companyId, (tx) =>
        payrollReport(tx, actor.companyId, month),
      ),
    );
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    const actor = await authorize(request, true),
      raw = await body(request);
    const action = z
      .enum(["movement", "post", "void-movement"])
      .parse(raw.action);
    if (action === "void-movement") {
      const id = z.string().min(1).parse(raw.id);
      return ok(
        await locked(actor.companyId, async (tx) => {
          const record = await tx.register.findFirst({
            where: {
              id,
              companyId: actor.companyId,
              kind: "payroll-movements",
            },
          });
          if (!record) throw new HttpError(404, "الحركة غير موجودة");
          const data = record.data as Record<string, any>;
          if (data.void) return { void: true };
          const month = await tx.register.findUnique({
            where: {
              companyId_kind_code: {
                companyId: actor.companyId,
                kind: "payroll-month",
                code: data.date.slice(0, 7) + ":" + data.employee,
              },
            },
          });
          if ((month?.data as Record<string, unknown>)?.entryId)
            throw new HttpError(409, "راتب الشهر مرحل؛ لا يمكن إلغاء الحركة");
          await openDate(tx, actor.companyId, new Date(data.date));
          if (data.entryId) {
            const original = await tx.journalEntry.findFirst({
              where: { id: data.entryId, companyId: actor.companyId },
              include: { lines: true },
            });
            if (!original) throw new HttpError(409, "قيد السلفة غير موجود");
            const prior = await tx.journalEntry.findUnique({
              where: { reversalOf: original.id },
            });
            if (!prior) {
              const reversal = await createEntryTx(
                tx,
                actor,
                entrySchema.parse({
                  date: data.date,
                  description: "إلغاء حركة سلفة — " + record.name,
                  document: "PAYROLL_ADVANCE",
                  reference: data.employee,
                  requestKey: "payroll-void:" + record.id,
                  lines: original.lines.map((l) => ({
                    ...l,
                    debit: l.credit.toString(),
                    credit: l.debit.toString(),
                  })),
                }),
                true,
              );
              await tx.journalEntry.update({
                where: { id: reversal.id },
                data: { reversalOf: original.id },
              });
            }
          }
          await tx.register.update({
            where: { id: record.id },
            data: { data: { ...data, void: true }, version: { increment: 1 } },
          });
          await audit(tx, actor, "PAYROLL_MOVEMENT_VOIDED", record.id);
          return { void: true };
        }),
      );
    }
    const input =
      action === "movement"
        ? payrollMovementSchema.parse(raw)
        : z
            .object({ employee: z.string().min(1), month: payrollMonth })
            .parse(raw);
    const result = await locked(actor.companyId, async (tx) => {
      const employee = await tx.register.findFirst({
        where: {
          companyId: actor.companyId,
          kind: "employees",
          code: input.employee,
        },
      });
      if (!employee) throw new HttpError(404, "الموظف غير موجود");
      const emp = employee.data as Record<string, string>;
      const month = "date" in input ? input.date.slice(0, 7) : input.month;
      const key = {
        companyId: actor.companyId,
        kind: "payroll-month",
        code: month + ":" + employee.code,
      };
      const prior = await tx.register.findUnique({
        where: { companyId_kind_code: key },
      });
      const snapshot = (prior?.data || {}) as Record<string, any>;
      if (action === "movement" && "date" in input) {
        const movementKey = {
          companyId: actor.companyId,
          kind: "payroll-movements",
          code: input.requestKey,
        };
        const existing = await tx.register.findUnique({
          where: { companyId_kind_code: movementKey },
        });
        if (existing) {
          sameRequest(existing.data, "digest", input);
          return { movement: existing };
        }
        if (!employee.isActive) throw new HttpError(409, "الموظف موقوف");
        if (snapshot.entryId)
          throw new HttpError(
            409,
            "راتب هذا الشهر مرحل؛ لا يمكن إضافة حركة إليه",
          );
        if (emp.startDate && input.date < emp.startDate)
          throw new HttpError(400, "التاريخ قبل بداية العمل");
        await openDate(tx, actor.companyId, new Date(input.date));
        let entryId: string | null = null;
        if (D(input.advance).gt(0)) {
          if (
            !emp.advanceAccount ||
            !input.cashAccount ||
            emp.advanceAccount === input.cashAccount
          )
            throw new HttpError(400, "حدد حساب السلف وحساب الصرف المختلف عنه");
          const entry = await createEntryTx(
            tx,
            actor,
            entrySchema.parse({
              date: input.date,
              description: "سلفة موظف — " + employee.name,
              document: "PAYROLL_ADVANCE",
              reference: employee.code,
              requestKey: "advance:" + input.requestKey,
              lines: [
                {
                  accountCode: emp.advanceAccount,
                  debit: input.advance,
                  party: employee.code,
                },
                {
                  accountCode: input.cashAccount,
                  credit: input.advance,
                  party: employee.code,
                  cashFlow: "OPERATING",
                },
              ],
            }),
            true,
          );
          entryId = entry.id;
        }
        const movement = await tx.register.create({
          data: {
            ...movementKey,
            name: employee.name,
            data: { ...input, entryId, digest: requestDigest(input) },
          },
        });
        if (!prior)
          await tx.register.create({
            data: {
              ...key,
              name: employee.name,
              data: { basicSalary: emp.basicSalary },
            },
          });
        await audit(tx, actor, "PAYROLL_MOVEMENT_CREATED", movement.id, {
          month,
          employee: employee.code,
        });
        return { movement };
      }
      if (snapshot.entryId) return { entryId: snapshot.entryId };
      const { to } = monthRange(month);
      await openDate(tx, actor.companyId, to);
      const report = await payrollReport(tx, actor.companyId, month),
        row = report.rows.find((r) => r.code === employee.code);
      if (!row) throw new HttpError(400, "لا يوجد راتب مستحق للموظف في الفترة");
      if (D(row.net).lt(0) || D(row.expense).lte(0) || D(row.advances).lt(0))
        throw new HttpError(400, "راجع صافي المرتب والسلف قبل الترحيل");
      const lines = [
        {
          accountCode: emp.expenseAccount,
          debit: row.expense,
          party: employee.code,
        },
        {
          accountCode: emp.payableAccount,
          credit: row.net,
          party: employee.code,
        },
        {
          accountCode: emp.advanceAccount,
          credit: row.advances,
          party: employee.code,
        },
        {
          accountCode: emp.insuranceAccount,
          credit: row.insurance,
          party: employee.code,
        },
      ].filter((l) => D(l.debit || l.credit || 0).gt(0));
      if (lines.some((l) => !l.accountCode))
        throw new HttpError(400, "استكمل حسابات الموظف المطلوبة قبل الترحيل");
      if (new Set(lines.map((l) => l.accountCode)).size !== lines.length)
        throw new HttpError(
          400,
          "حسابات المصروف والاستحقاق والسلف والتأمينات يجب أن تكون مختلفة",
        );
      const entry = await createEntryTx(
        tx,
        actor,
        entrySchema.parse({
          date: to.toISOString().slice(0, 10),
          description: "استحقاق مرتب " + employee.name + " — " + month,
          document: "PAYROLL",
          reference: employee.code,
          requestKey: "payroll:" + employee.id + ":" + month,
          lines,
        }),
        true,
      );
      const amounts = Object.fromEntries(
        Object.entries(row)
          .filter(([k]) => !["movements", "advanceLines"].includes(k))
          .map(([k, v]) => [k, String(v ?? "")]),
      );
      const data = { basicSalary: row.basic, entryId: entry.id, amounts };
      await tx.register.upsert({
        where: { companyId_kind_code: key },
        create: { ...key, name: employee.name, data },
        update: { data, version: { increment: 1 } },
      });
      await audit(tx, actor, "PAYROLL_POSTED", entry.id, {
        month,
        employee: employee.code,
      });
      return { entryId: entry.id };
    });
    return ok(result);
  } catch (e) {
    return fail(e);
  }
}
