import { authorize } from "@/lib/auth/server";
import { fail, HttpError, ok } from "@/lib/server/http";
import {
  cashFlow,
  financialStatements,
  indirectCashFlow,
  ledgerReport,
  partyBalances,
  reportFilter,
  trialBalance,
} from "@/lib/accounting/reports";
import { locked } from "@/lib/accounting/ledger";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ report: string }> },
) {
  const resolved = await params;
  try {
    const user = await authorize();
    const p = new URL(request.url).searchParams,
      { from, to } = reportFilter(p);
    return await locked(user.companyId, async (tx) => {
      switch (resolved.report) {
        case "trial-balance":
          return ok({ rows: await trialBalance(user.companyId, from, to, tx) });
        case "financial":
          return ok(await financialStatements(user.companyId, from, to, tx));
        case "cash-flow":
          return ok(await cashFlow(user.companyId, from, to, tx));
        case "cash-flow-indirect":
          return ok(await indirectCashFlow(user.companyId, from, to, tx));
        case "parties":
          return ok(await partyBalances(user.companyId, from, to, tx));
        case "ledger":
          return ok(await ledgerReport(user.companyId, p, tx));
        default:
          throw new HttpError(404, "التقرير غير موجود");
      }
    });
  } catch (e) {
    return fail(e);
  }
}
