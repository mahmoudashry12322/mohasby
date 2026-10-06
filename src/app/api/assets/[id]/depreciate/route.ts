import { z } from "zod";
import { authorize } from "@/lib/auth/server";
import { body, fail, HttpError, ok } from "@/lib/server/http";
import {
  audit,
  createEntryTx,
  dateOnly,
  entrySchema,
  locked,
} from "@/lib/accounting/ledger";
import { D, depreciation, sum } from "@/lib/accounting/calculations";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolved = await params;
  try {
    const actor = await authorize(request, true),
      input = z.object({ date: dateOnly }).parse(await body(request));
    const entry = await locked(actor.companyId, async (tx) => {
      const asset = await tx.register.findFirst({
        where: {
          id: resolved.id,
          companyId: actor.companyId,
          kind: "assets",
          isActive: true,
        },
      });
      if (!asset) throw new HttpError(404, "الأصل غير موجود");
      const data = asset.data as Record<string, string>;
      const date = new Date(input.date),
        acquired = new Date(data.acquired);
      if (date < acquired) throw new HttpError(400, "التاريخ قبل شراء الأصل");
      if (
        new Date(
          Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
        ).getUTCDate() !== date.getUTCDate()
      )
        throw new HttpError(400, "اختر آخر يوم في الشهر للإهلاك");
      const key = "depreciation:" + asset.id + ":" + input.date;
      const existing = await tx.journalEntry.findUnique({
        where: {
          companyId_requestKey: { companyId: actor.companyId, requestKey: key },
        },
      });
      if (existing) return existing;
      const previous = await tx.journalEntry.findMany({
        where: {
          companyId: actor.companyId,
          document: "DEPRECIATION",
          reference: asset.id,
          status: "POSTED",
        },
        include: { lines: true },
        orderBy: { date: "desc" },
      });
      if (previous[0] && previous[0].date >= date)
        throw new HttpError(409, "يوجد إهلاك في تاريخ أحدث");
      const last = previous[0]?.date;
      const months = last
        ? (date.getUTCFullYear() - last.getUTCFullYear()) * 12 +
          date.getUTCMonth() -
          last.getUTCMonth()
        : (date.getUTCFullYear() - acquired.getUTCFullYear()) * 12 +
          date.getUTCMonth() -
          acquired.getUTCMonth() +
          1;
      if (months > 12)
        throw new HttpError(400, "رحّل الإهلاك سنة بسنة؛ أقصى مدة 12 شهراً");
      const posted = sum(
        previous.flatMap((p) =>
          p.lines
            .filter((l) => l.accountCode === data.expenseAccount)
            .map((l) => l.debit.sub(l.credit)),
        ),
      );
      let amount;
      try {
        amount = depreciation(
          data.cost,
          data.additions,
          D(data.priorDepreciation).add(posted).toString(),
          data.rate,
          months,
          data.residual,
        ).expense;
      } catch (e) {
        throw new HttpError(400, (e as Error).message);
      }
      if (amount.lte(0)) throw new HttpError(409, "لا يوجد إهلاك مستحق");
      if (
        !data.expenseAccount ||
        !data.accumulatedAccount ||
        data.expenseAccount === data.accumulatedAccount
      )
        throw new HttpError(400, "حدد حسابي الإهلاك المختلفين");
      const result = await createEntryTx(
        tx,
        actor,
        entrySchema.parse({
          date: input.date,
          kind: "DEPRECIATION",
          document: "DEPRECIATION",
          reference: asset.id,
          description: `إهلاك ${asset.name} — ${months} شهر`,
          requestKey: key,
          lines: [
            { accountCode: data.expenseAccount, debit: amount.toString() },
            { accountCode: data.accumulatedAccount, credit: amount.toString() },
          ],
        }),
        true,
      );
      await audit(tx, actor, "ASSET_DEPRECIATED", asset.id, {
        entryId: result.id,
        months,
      });
      return result;
    });
    return ok({ entry });
  } catch (e) {
    return fail(e);
  }
}
