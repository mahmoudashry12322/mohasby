import { z } from "zod";
import { authorize } from "@/lib/auth/server";
import { body, fail, HttpError, ok } from "@/lib/server/http";
import { costSchedule, costTemplate } from "@/lib/accounting/costs";
import { reportFilter } from "@/lib/accounting/reports";
import { audit, decimal, locked, dateOnly } from "@/lib/accounting/ledger";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const resolved = await params;
  try {
    const user = await authorize(),
      p = new URL(request.url).searchParams,
      { from, to } = reportFilter(p);
    return ok(
      await locked(user.companyId, (tx) =>
        costSchedule(
          user.companyId,
          resolved.type,
          p.get("center") || "",
          from,
          to,
          tx,
        ),
      ),
    );
  } catch (e) {
    return fail(e);
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const resolved = await params;
  try {
    const actor = await authorize(request, true),
      template = costTemplate(resolved.type),
      input = z
        .object({
          center: z.string().min(1),
          from: dateOnly,
          to: dateOnly,
          inputs: z.record(decimal),
        })
        .parse(await body(request));
    if (input.from > input.to) throw new HttpError(400, "الفترة غير صالحة");
    for (const key of Object.keys(input.inputs))
      if (!Object.hasOwn(template.inputs, key))
        throw new HttpError(400, "مدخل غير موجود في التقرير");
    await locked(actor.companyId, async (tx) => {
      const center = await tx.register.findFirst({
        where: {
          companyId: actor.companyId,
          kind: "cost-centers",
          code: input.center,
        },
      });
      if (
        !center ||
        (center.data as Record<string, string>).type !== resolved.type
      )
        throw new HttpError(400, "المركز غير صالح");
      const code =
        resolved.type + ":" + input.center + ":" + input.from + ":" + input.to;
      const row = await tx.register.upsert({
        where: {
          companyId_kind_code: {
            companyId: actor.companyId,
            kind: "cost-inputs",
            code,
          },
        },
        create: {
          companyId: actor.companyId,
          kind: "cost-inputs",
          code,
          name: template.title,
          data: input.inputs,
        },
        update: { data: input.inputs, version: { increment: 1 } },
      });
      await audit(tx, actor, "COST_INPUTS_SAVED", row.id);
    });
    return ok({});
  } catch (e) {
    return fail(e);
  }
}
