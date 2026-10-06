import { authorize } from "@/lib/auth/server";
import prisma from "@/lib/prisma";
import { body, fail, ok } from "@/lib/server/http";
import { createEntry, dateOnly, entrySchema } from "@/lib/accounting/ledger";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const user = await authorize();
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
    return ok({ entries, total, page });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    const actor = await authorize(request, true);
    return ok(
      {
        entry: await createEntry(actor, entrySchema.parse(await body(request))),
      },
      201,
    );
  } catch (e) {
    return fail(e);
  }
}
