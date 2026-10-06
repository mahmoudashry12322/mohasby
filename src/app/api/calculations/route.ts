import { z } from "zod";
import { authorize } from "@/lib/auth/server";
import { body, fail, HttpError, ok } from "@/lib/server/http";
import {
  depreciation,
  importCost,
  weighTicket,
} from "@/lib/accounting/calculations";
import { decimal } from "@/lib/accounting/ledger";
export async function POST(request: Request) {
  try {
    await authorize();
    const input = await body(request);
    try {
      if (input.type === "weigh")
        return ok({
          result: weighTicket(
            z
              .object({
                weight: decimal,
                tare: decimal,
                bags: decimal,
                bagDeduction: decimal,
                discountRate: decimal,
                inspectionRate: decimal,
                pricePerTonne: decimal,
              })
              .parse(input),
          ),
        });
      if (input.type === "import")
        return ok({
          result: importCost(
            z
              .object({
                goods: decimal,
                freight: decimal,
                insuranceRate: decimal,
                customsRate: decimal,
                fees: decimal,
                quantity: decimal,
                exchangeRate: decimal,
              })
              .parse(input),
          ),
        });
      if (input.type === "depreciation") {
        const v = z
          .object({
            cost: decimal,
            additions: decimal,
            prior: decimal,
            rate: decimal,
            months: z.coerce.number().int(),
            residual: decimal,
          })
          .parse(input);
        return ok({
          result: depreciation(
            v.cost,
            v.additions,
            v.prior,
            v.rate,
            v.months,
            v.residual,
          ),
        });
      }
      throw new HttpError(400, "حساب غير معروف");
    } catch (e) {
      if (e instanceof z.ZodError || e instanceof HttpError) throw e;
      throw new HttpError(400, (e as Error).message);
    }
  } catch (e) {
    return fail(e);
  }
}
