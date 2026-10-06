import { authorize } from "@/lib/auth/server";
import prisma from "@/lib/prisma";
import { body, fail, ok } from "@/lib/server/http";
import {
  moveStock,
  stockBalances,
  stockSchema,
} from "@/lib/accounting/periodic-stock";
import { D, money } from "@/lib/accounting/calculations";
import { reportFilter } from "@/lib/accounting/reports";
import { locked } from "@/lib/accounting/ledger";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const user = await authorize(),
      p = new URL(request.url).searchParams,
      { from, to } = reportFilter(p);
    return await locked(user.companyId, async (tx) => {
      const scope = {
        companyId: user.companyId,
        ...(p.get("itemId") ? { itemId: p.get("itemId")! } : {}),
        ...(p.get("warehouse") ? { warehouse: p.get("warehouse")! } : {}),
      };
      const history = await tx.stockMovement.findMany({
        where: { ...scope, date: { lte: to } },
        include: { item: true },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      });
      const balances = (await stockBalances(user.companyId, to, tx)).filter(
        (b) =>
          (!p.get("itemId") || b.itemId === p.get("itemId")) &&
          (!p.get("warehouse") || b.warehouse === p.get("warehouse")),
      );
      const running = new Map<string, ReturnType<typeof D>>();
      const rows = history
        .map((m) => {
          const key = m.itemId + ":" + m.warehouse,
            q = (running.get(key) || D(0)).add(m.quantity.mul(m.direction));
          running.set(key, q);
          return {
            ...m,
            runningQuantity: q.toFixed(3),
            unitCost: m.value.gt(0) ? m.unitCost.toString() : "—",
            value: m.value.gt(0) ? m.value.toString() : "—",
          };
        })
        .filter((m) => m.date >= from);
      const summary = balances.map((b) => {
        const h = history.filter(
          (m) => m.itemId === b.itemId && m.warehouse === b.warehouse,
        );
        const received = h
            .filter((m) => m.direction === 1)
            .reduce((a, m) => a.add(m.quantity), D(0)),
          issued = h
            .filter((m) => m.direction === -1)
            .reduce((a, m) => a.add(m.quantity), D(0));
        return {
          ...b,
          received: received.toFixed(3),
          issued: issued.toFixed(3),
          remainingPercent: received.gt(0)
            ? D(b.quantity).div(received).mul(100).toFixed(2) + "%"
            : "—",
        };
      });
      return ok({ rows, balances: summary });
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    const user = await authorize(request, true);
    return ok(
      {
        movement: await moveStock(user, stockSchema.parse(await body(request))),
      },
      201,
    );
  } catch (e) {
    return fail(e);
  }
}
