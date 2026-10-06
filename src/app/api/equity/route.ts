import { z } from "zod";
import { authorize } from "@/lib/auth/server";
import { audit, locked, dateOnly } from "@/lib/accounting/ledger";
import { reportFilter } from "@/lib/accounting/reports";
import { equityReport, partnerInput } from "@/lib/accounting/equity";
import { body, fail, HttpError, ok } from "@/lib/server/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const user = await authorize(),
      { from, to } = reportFilter(new URL(request.url).searchParams);
    return ok(
      await locked(user.companyId, (tx) =>
        equityReport(tx, user.companyId, from, to),
      ),
    );
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    const user = await authorize(request, true),
      input = z
        .object({
          from: dateOnly,
          to: dateOnly,
          inputs: z.record(partnerInput),
        })
        .parse(await body(request));
    if (input.from > input.to) throw new HttpError(400, "الفترة غير صالحة");
    await locked(user.companyId, async (tx) => {
      for (const code of Object.keys(input.inputs)) {
        const partner = await tx.register.findUnique({
          where: {
            companyId_kind_code: {
              companyId: user.companyId,
              kind: "parties",
              code,
            },
          },
        });
        if (
          !partner ||
          (partner.data as Record<string, string>).type !== "PARTNER"
        )
          throw new HttpError(400, "شريك غير موجود");
      }
      const code = input.from + ":" + input.to;
      const saved = await tx.register.upsert({
        where: {
          companyId_kind_code: {
            companyId: user.companyId,
            kind: "equity-inputs",
            code,
          },
        },
        create: {
          companyId: user.companyId,
          kind: "equity-inputs",
          code,
          name: "مدخلات تسوية الشركاء",
          data: input.inputs,
        },
        update: { data: input.inputs, version: { increment: 1 } },
      });
      await audit(tx, user, "EQUITY_INPUTS_SAVED", saved.id);
    });
    return ok({});
  } catch (e) {
    return fail(e);
  }
}
