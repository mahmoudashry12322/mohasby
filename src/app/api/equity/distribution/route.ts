import { z } from "zod";
import { authorize } from "@/lib/auth/server";
import { body, fail, HttpError, ok } from "@/lib/server/http";
import { audit, dateOnly, locked } from "@/lib/accounting/ledger";
import { reportFilter } from "@/lib/accounting/reports";
import { scheduleValues } from "@/lib/accounting/schedule-engine";
import template from "@/data/distribution-template.json";
const signed = z.string().regex(/^-?\d{1,15}(\.\d{1,6})?$/);
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const actor = await authorize(),
      { from, to } = reportFilter(new URL(request.url).searchParams),
      code =
        from.toISOString().slice(0, 10) + ":" + to.toISOString().slice(0, 10);
    return ok(
      await locked(actor.companyId, async (tx) => {
        const saved = await tx.register.findUnique({
          where: {
            companyId_kind_code: {
              companyId: actor.companyId,
              kind: "distribution-final",
              code,
            },
          },
        });
        const data = (saved?.data || { inputs: {}, first: "", second: "" }) as {
          inputs: Record<string, string>;
          first: string;
          second: string;
        };
        const partners = (
          await tx.register.findMany({
            where: {
              companyId: actor.companyId,
              kind: "parties",
              isActive: true,
            },
          })
        ).filter((p) => (p.data as Record<string, string>).type === "PARTNER");
        const context = {
          first:
            partners.find((p) => p.code === data.first)?.name || "الشريك الأول",
          second:
            partners.find((p) => p.code === data.second)?.name ||
            "الشريك الثاني",
        };
        return {
          ...data,
          context,
          partners: partners.map((p) => ({ code: p.code, name: p.name })),
          version: saved?.version || 0,
          ...scheduleValues(template, data.inputs, context, {}),
        };
      }),
    );
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    const actor = await authorize(request, true),
      input = z
        .object({
          from: dateOnly,
          to: dateOnly,
          first: z.string().min(1),
          second: z.string().min(1),
          version: z.number().int().min(0),
          inputs: z.record(signed),
        })
        .parse(await body(request));
    if (input.from > input.to || input.first === input.second)
      throw new HttpError(400, "حدد فترة صحيحة وشريكين مختلفين");
    for (const k of Object.keys(input.inputs))
      if (!Object.hasOwn(template.inputs, k))
        throw new HttpError(400, "مدخل غير موجود");
    await locked(actor.companyId, async (tx) => {
      const partners = await tx.register.findMany({
        where: {
          companyId: actor.companyId,
          kind: "parties",
          isActive: true,
          code: { in: [input.first, input.second] },
        },
      });
      if (
        partners.length !== 2 ||
        partners.some(
          (p) => (p.data as Record<string, string>).type !== "PARTNER",
        )
      )
        throw new HttpError(400, "اختر شريكين من دليل الشركة");
      const key = {
        companyId: actor.companyId,
        kind: "distribution-final",
        code: input.from + ":" + input.to,
      };
      const prior = await tx.register.findUnique({
        where: { companyId_kind_code: key },
      });
      if ((prior?.version || 0) !== input.version)
        throw new HttpError(409, "البيانات تغيرت؛ أعد تحميل الصفحة");
      const data = {
        first: input.first,
        second: input.second,
        inputs: input.inputs,
      };
      const saved = await tx.register.upsert({
        where: { companyId_kind_code: key },
        create: { ...key, name: template.title, data },
        update: { data, version: { increment: 1 } },
      });
      await audit(tx, actor, "DISTRIBUTION_SAVED", saved.id);
    });
    return ok({});
  } catch (e) {
    return fail(e);
  }
}
