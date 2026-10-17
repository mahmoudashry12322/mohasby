import { authorize } from "@/lib/auth/server";
import { can, PermissionPrincipal } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/permissions.server";
import prisma from "@/lib/prisma";
import { body, fail, ok, HttpError } from "@/lib/server/http";
import {
  moveStock,
  stockBalances,
  stockSchema,
} from "@/lib/accounting/periodic-stock";
import { D, money } from "@/lib/accounting/calculations";
import { reportFilter } from "@/lib/accounting/reports";
import { locked, dateOnly } from "@/lib/accounting/ledger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await authorize(request);
    const principal: PermissionPrincipal = {
      id: user.id,
      companyId: user.companyId,
      role: user.role,
      isActive: user.isActive,
      permissions: Array.isArray((user as any).permissions)
        ? ((user as any).permissions as string[])
        : [],
    };
    if (
      !can(principal, "stock.view") &&
      !can(principal, "stock.movement") &&
      user.role !== "admin"
    ) {
      throw new HttpError(403, "ليس لديك صلاحية عرض أو حركة المخزون");
    }

    const hasCostAccess = user.role === "admin" || can(principal, "costs.view");
    const p = new URL(request.url).searchParams;

    // Fast, lightweight lookup for warehouse balances and cost preview
    if (p.get("preview") === "true") {
      const itemId = p.get("itemId");
      if (!itemId) throw new HttpError(400, "يجب تحديد الصنف للمعاينة");
      const targetDate =
        p.get("to") || p.get("date") || new Date().toISOString().slice(0, 10);
      const to = new Date(dateOnly.parse(targetDate));

      return await locked(user.companyId, async (tx) => {
        const item = await tx.register.findFirst({
          where: {
            id: itemId,
            companyId: user.companyId,
            kind: "items",
            isActive: true,
          },
        });
        if (!item) throw new HttpError(404, "الصنف غير موجود أو غير نشط");

        const coldCodes =
          p.get("warehouseType") === "COLD_STORAGE"
            ? (
                await tx.register.findMany({
                  where: {
                    companyId: user.companyId,
                    kind: "warehouses",
                    isActive: true,
                  },
                })
              )
                .filter(
                  (w) =>
                    (w.data as Record<string, string>).type === "COLD_STORAGE",
                )
                .map((w) => w.code)
            : null;

        const allActiveWarehouses = await tx.register.findMany({
          where: {
            companyId: user.companyId,
            kind: "warehouses",
            isActive: true,
            ...(coldCodes ? { code: { in: coldCodes } } : {}),
          },
          select: { code: true, name: true, data: true },
          orderBy: { name: "asc" },
        });

        const balances = (await stockBalances(user.companyId, to, tx)).filter(
          (b) =>
            b.itemId === item.id &&
            (!coldCodes || coldCodes.includes(b.warehouse)),
        );

        const balanceMap = new Map(balances.map((b) => [b.warehouse, b]));

        // Calculate item-level cost basis from stockBalances
        const sampleBalance = balances[0];
        let averageCost: string | null = null;
        let hasCostBasis = false;
        let costBasisReason = "لا توجد حركات وارد سابقة بقيمة لتحديد متوسط التكلفة";

        if (sampleBalance && D(sampleBalance.averageCost).gt(0)) {
          hasCostBasis = true;
          costBasisReason = "";
          if (hasCostAccess) {
            averageCost = sampleBalance.averageCost;
          }
        }

        const warehouses = allActiveWarehouses.map((wh) => {
          const bal = balanceMap.get(wh.code);
          const qty = bal ? bal.quantity : "0.000";
          return {
            warehouse: wh.code,
            name: wh.name,
            quantity: qty,
            hasPositiveBalance: D(qty).gt(0),
          };
        });

        const itemConfig = item.data as Record<string, string>;

        return ok({
          item: {
            id: item.id,
            code: item.code,
            name: item.name,
            unit: itemConfig.unit || "",
          },
          warehouses,
          cost: {
            hasCostAccess,
            hasCostBasis,
            costBasisReason: hasCostBasis ? undefined : costBasisReason,
            averageCost,
          },
        });
      });
    }

    const { from, to } = reportFilter(p);

    return await locked(user.companyId, async (tx) => {
      const coldCodes =
        p.get("warehouseType") === "COLD_STORAGE"
          ? (
              await tx.register.findMany({
                where: { companyId: user.companyId, kind: "warehouses" },
              })
            )
              .filter(
                (w) =>
                  (w.data as Record<string, string>).type === "COLD_STORAGE",
              )
              .map((w) => w.code)
          : null;
      const scope = {
        companyId: user.companyId,
        ...(p.get("itemId") ? { itemId: p.get("itemId")! } : {}),
        ...(p.get("warehouse")
          ? { warehouse: p.get("warehouse")! }
          : coldCodes
            ? { warehouse: { in: coldCodes } }
            : {}),
      };
      const history = (
        await tx.stockMovement.findMany({
          where: { ...scope, date: { lte: to } },
          include: { item: true },
          orderBy: [{ date: "asc" }, { createdAt: "asc" }],
        })
      ).filter((m) => !coldCodes || coldCodes.includes(m.warehouse));
      const balances = (await stockBalances(user.companyId, to, tx)).filter(
        (b) =>
          (!p.get("itemId") || b.itemId === p.get("itemId")) &&
          (!coldCodes || coldCodes.includes(b.warehouse)) &&
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
            unitCost:
              hasCostAccess && m.value.gt(0) ? m.unitCost.toString() : "—",
            value: hasCostAccess && m.value.gt(0) ? m.value.toString() : "—",
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
          averageCost: hasCostAccess ? b.averageCost : null,
          value: hasCostAccess ? b.value : "—",
          remainingPercent: received.gt(0)
            ? D(b.quantity).div(received).mul(100).toFixed(2) + "%"
            : "—",
        };
      });
      return ok({ rows, balances: summary, hasCostAccess });
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission(request, "stock.movement");
    const rawBody = await body(request);
    const parsed = stockSchema.parse(rawBody);

    // Client is never allowed to force unitCost on ISSUE
    if (parsed.kind === "ISSUE") {
      parsed.unitCost = "0";
      parsed.counterpart = "";
    }

    return ok(
      {
        movement: await moveStock(user, parsed),
      },
      201,
    );
  } catch (e) {
    return fail(e);
  }
}
