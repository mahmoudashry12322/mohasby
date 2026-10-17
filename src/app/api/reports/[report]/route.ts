import { authorize } from "@/lib/auth/server";
import { can, requirePermission } from "@/lib/auth/permissions.server";
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
    const user = (await authorize(request)) as any;
    const p = new URL(request.url).searchParams,
      { from, to } = reportFilter(p);
    return await locked(user.companyId, async (tx) => {
      const companyName =
        user.company?.name ||
        (
          await tx.company.findUnique({
            where: { id: user.companyId },
            select: { name: true },
          })
        )?.name ||
        "";
      const meta = {
        companyName,
        fromDate: p.get("from") || "",
        toDate: p.get("to") || "",
      };

      switch (resolved.report) {
        case "trial-balance": {
          if (!can(user, "reports.trial_balance")) {
            throw new HttpError(403, "ليس لديك صلاحية لعرض ميزان المراجعة");
          }
          return ok({
            rows: await trialBalance(user.companyId, from, to, tx),
            ...meta,
          });
        }
        case "financial": {
          const hasBalanceSheet = can(user, "reports.balance_sheet");
          const hasIncome = can(user, "reports.income_statement");
          const hasEquity = can(user, "equity.view");

          if (!hasBalanceSheet && !hasIncome && !hasEquity) {
            throw new HttpError(403, "ليس لديك صلاحية لعرض القوائم المالية");
          }

          const statements = await financialStatements(
            user.companyId,
            from,
            to,
            tx,
          );

          // If user has balance sheet permission (or is admin), return full statements
          if (hasBalanceSheet) {
            return ok({ ...statements, ...meta });
          }

          // If user only has income statement permission, strip balance sheet & equity totals
          if (hasIncome && !hasEquity) {
            return ok({
              incomeRows: statements.incomeRows,
              incomeSummary: statements.incomeSummary,
              profit: statements.profit,
              rows: statements.incomeRows,
              ...meta,
            });
          }

          // If user only has equity permission, strip income details and assets/liabilities
          if (hasEquity && !hasIncome) {
            return ok({
              equityRows: statements.equityRows,
              equity: statements.equity,
              unclosedProfit: statements.unclosedProfit,
              totalEquity: statements.totalEquity,
              profit: statements.profit,
              rows: statements.equityRows,
              ...meta,
            });
          }

          // Both income and equity without balance sheet
          return ok({
            incomeRows: statements.incomeRows,
            incomeSummary: statements.incomeSummary,
            profit: statements.profit,
            equityRows: statements.equityRows,
            equity: statements.equity,
            unclosedProfit: statements.unclosedProfit,
            totalEquity: statements.totalEquity,
            rows: [...statements.incomeRows, ...statements.equityRows],
            ...meta,
          });
        }
        case "cash-flow":
        case "cash-flow-indirect": {
          if (!can(user, "reports.cash_flow")) {
            throw new HttpError(403, "ليس لديك صلاحية لعرض قائمة التدفقات النقدية");
          }
          if (resolved.report === "cash-flow") {
            return ok({
              ...(await cashFlow(user.companyId, from, to, tx)),
              ...meta,
            });
          }
          return ok({
            ...(await indirectCashFlow(user.companyId, from, to, tx)),
            ...meta,
          });
        }
        case "parties": {
          if (!can(user, "reports.outstanding_balances")) {
            throw new HttpError(403, "ليس لديك صلاحية لعرض تقرير أرصدة الأطراف");
          }
          return ok({
            ...(await partyBalances(user.companyId, from, to, tx)),
            ...meta,
          });
        }
        case "ledger": {
          const allowedLedgerPermissions = [
            "reports.general_ledger",
            "reports.subsidiary_ledger",
            "reports.account_statement",
            "reports.daily",
            "reports.sales_purchases",
            "reports.cost_centers",
            "reports.bank_treasury",
          ] as const;

          const hasLedgerPerm = allowedLedgerPermissions.some((perm) =>
            can(user, perm),
          );
          if (!hasLedgerPerm) {
            throw new HttpError(403, "ليس لديك صلاحية لعرض تقارير الأستاذ");
          }
          return ok({
            ...(await ledgerReport(user.companyId, p, tx)),
            ...meta,
          });
        }
        default:
          throw new HttpError(404, "التقرير غير موجود");
      }
    });
  } catch (e) {
    return fail(e);
  }
}
