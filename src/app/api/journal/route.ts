import { requirePermission } from "@/lib/auth/permissions.server";
import prisma from "@/lib/prisma";
import { body, fail, HttpError, ok } from "@/lib/server/http";
import { createEntry, dateOnly, entrySchema } from "@/lib/accounting/ledger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requirePermission(request, "journal.view");
    const p = new URL(request.url).searchParams;
    const page = Math.max(1, Math.min(100000, Number(p.get("page")) || 1));
    const where = {
      companyId: user.companyId,
      ...(p.get("kind") ? { kind: p.get("kind")! } : {}),
      ...(p.get("status") ? { status: p.get("status")! } : {}),
      date: {
        ...(p.get("from")
          ? { gte: new Date(dateOnly.parse(p.get("from"))) }
          : {}),
        ...(p.get("to") ? { lte: new Date(dateOnly.parse(p.get("to"))) } : {}),
      },
    };
    const [entries, total] = await prisma.$transaction([
      prisma.journalEntry.findMany({
        where,
        include: {
          lines: { include: { account: { select: { name: true } } } },
        },
        orderBy: { number: "desc" },
        skip: (page - 1) * 50,
        take: 50,
      }),
      prisma.journalEntry.count({ where }),
    ]);

    const entryIds = entries.map((e) => e.id);
    const reversals = entryIds.length
      ? await prisma.journalEntry.findMany({
          where: {
            companyId: user.companyId,
            reversalOf: { in: entryIds },
          },
          select: {
            id: true,
            number: true,
            reversalOf: true,
          },
        })
      : [];

    const reversalMap = new Map<string, { id: string; number: number }>();
    for (const r of reversals) {
      if (r.reversalOf) {
        reversalMap.set(r.reversalOf, { id: r.id, number: r.number });
      }
    }

    const originalIds = entries
      .map((e) => e.reversalOf)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    const originals = originalIds.length
      ? await prisma.journalEntry.findMany({
          where: {
            companyId: user.companyId,
            id: { in: originalIds },
          },
          select: {
            id: true,
            number: true,
          },
        })
      : [];

    const originalMap = new Map<string, { id: string; number: number }>();
    for (const o of originals) {
      originalMap.set(o.id, { id: o.id, number: o.number });
    }

    const enrichedEntries = entries.map((e) => ({
      ...e,
      reversedBy: reversalMap.get(e.id) || null,
      reversedEntry: e.reversalOf ? originalMap.get(e.reversalOf) || null : null,
    }));

    return ok({ entries: enrichedEntries, total, page });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requirePermission(request, "journal.create");
    const input = entrySchema.parse(await body(request));
    if (["PAYROLL", "PAYROLL_ADVANCE"].includes(input.document))
      throw new HttpError(400, "مستند المرتبات ينشأ من شاشة المرتبات فقط");
    return ok(
      {
        entry: await createEntry(actor, input),
      },
      201,
    );
  } catch (e) {
    return fail(e);
  }
}
