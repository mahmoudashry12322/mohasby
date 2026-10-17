import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions.server";
import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Only users with audit.view permission (or full admin) can access audit logs
    const user = await requirePermission(request, "audit.view");

    const p = request.nextUrl
      ? request.nextUrl.searchParams
      : new URL(request.url).searchParams;
    const page = Math.max(1, Number(p.get("page")) || 1);
    const limit = Math.min(100, Math.max(10, Number(p.get("limit")) || 50));
    const action = p.get("action")?.trim();
    const userId = p.get("userId")?.trim();
    const search = p.get("search")?.trim();
    const from = p.get("from")?.trim();
    const to = p.get("to")?.trim();

    const where: Record<string, any> = {
      companyId: user.companyId,
    };

    if (action) {
      where.action = action;
    }
    if (userId) {
      where.userId = userId;
    }
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from + "T00:00:00Z");
      if (to) where.createdAt.lte = new Date(to + "T23:59:59.999Z");
    }
    if (search) {
      const orClauses: Array<Record<string, any>> = [
        { action: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
      ];

      const searchNum = parseInt(search, 10);
      const entryConditions: Array<Record<string, any>> = [];
      if (!isNaN(searchNum) && String(searchNum) === search) {
        entryConditions.push({ number: searchNum });
      }
      entryConditions.push({ description: { contains: search, mode: "insensitive" } });

      const [matchingEntries, matchingMovements] = await Promise.all([
        prisma.journalEntry.findMany({
          where: {
            companyId: user.companyId,
            OR: entryConditions,
          },
          select: { id: true },
          take: 50,
        }),
        prisma.stockMovement.findMany({
          where: {
            companyId: user.companyId,
            OR: [
              { reference: { contains: search, mode: "insensitive" } },
              { warehouse: { contains: search, mode: "insensitive" } },
              {
                item: {
                  OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { code: { contains: search, mode: "insensitive" } },
                  ],
                },
              },
            ],
          },
          select: { id: true },
          take: 50,
        }),
      ]);

      if (matchingEntries.length > 0) {
        orClauses.push({
          entityId: { in: matchingEntries.map((e) => e.id) },
        });
      }

      if (matchingMovements.length > 0) {
        orClauses.push({
          entityId: { in: matchingMovements.map((m) => m.id) },
        });
      }

      where.OR = orClauses;
    }

    const [logs, total, users] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
      (prisma.user as any).findMany({
        where: { companyId: user.companyId },
        select: { id: true, name: true, username: true },
      }),
    ]);

    const userMap = new Map<string, { name: string; username: string | null }>();
    users.forEach((u: any) => userMap.set(u.id, { name: u.name, username: u.username }));

    const possibleEntryIds = new Set<string>();
    const stockMovementIds = new Set<string>();

    for (const log of logs) {
      if (log.action === "STOCK_POSTED" || log.action === "STOCK_MOVED") {
        if (log.entityId) stockMovementIds.add(log.entityId);
      } else {
        if (log.entityId) possibleEntryIds.add(log.entityId);
      }
      const d = log.detail as any;
      if (d?.entryId) possibleEntryIds.add(String(d.entryId));
      if (d?.reversalId) possibleEntryIds.add(String(d.reversalId));
      if (d?.movementId) stockMovementIds.add(String(d.movementId));
    }

    const [stockMovements, initialEntries] = await Promise.all([
      stockMovementIds.size > 0
        ? prisma.stockMovement.findMany({
            where: {
              companyId: user.companyId,
              id: { in: Array.from(stockMovementIds) },
            },
            include: {
              item: {
                select: { id: true, code: true, name: true, data: true },
              },
            },
          })
        : [],
      possibleEntryIds.size > 0
        ? prisma.journalEntry.findMany({
            where: {
              companyId: user.companyId,
              id: { in: Array.from(possibleEntryIds) },
            },
            select: { id: true, number: true, description: true },
          })
        : [],
    ]);

    const stockMovementMap = new Map(stockMovements.map((sm) => [sm.id, sm]));

    // Check if any movements have entryIds that weren't in possibleEntryIds yet
    const extraEntryIds = new Set<string>();
    for (const sm of stockMovements) {
      if (sm.entryId && !possibleEntryIds.has(sm.entryId)) {
        extraEntryIds.add(sm.entryId);
      }
    }

    let extraEntries: Array<{ id: string; number: number; description: string }> = [];
    if (extraEntryIds.size > 0) {
      extraEntries = await prisma.journalEntry.findMany({
        where: {
          companyId: user.companyId,
          id: { in: Array.from(extraEntryIds) },
        },
        select: { id: true, number: true, description: true },
      });
    }

    const allEntries = [...initialEntries, ...extraEntries];
    const entryMap = new Map(allEntries.map((e) => [e.id, e]));

    // Collect warehouse codes for names
    const warehouseCodes = new Set<string>();
    for (const sm of stockMovements) {
      if (sm.warehouse) warehouseCodes.add(sm.warehouse);
    }
    for (const log of logs) {
      const d = log.detail as any;
      if (d?.warehouse) warehouseCodes.add(String(d.warehouse));
    }

    const warehouses =
      warehouseCodes.size > 0
        ? await prisma.register.findMany({
            where: {
              companyId: user.companyId,
              kind: "warehouses",
              code: { in: Array.from(warehouseCodes) },
            },
            select: { code: true, name: true },
          })
        : [];
    const warehouseMap = new Map(warehouses.map((w) => [w.code, w.name]));

    const formattedRows = logs.map((log) => {
      const detail = (log.detail as Record<string, any>) || {};
      const fallbackUser = userMap.get(log.userId);
      const actorName =
        detail.actorName || fallbackUser?.name || "مستخدم #" + log.userId.slice(-6);
      const actorUsername =
        detail.actorUsername || fallbackUser?.username || "";

      let stockDetails: any = null;
      if (log.action === "STOCK_POSTED" || log.action === "STOCK_MOVED") {
        const smId = detail.movementId || log.entityId;
        const sm = stockMovementMap.get(smId);
        const hasExecutionSnapshot = Boolean(
          detail.itemName && detail.quantity && detail.warehouse
        );

        if (hasExecutionSnapshot) {
          stockDetails = {
            isHistoricalEnriched: false,
            isDataUnavailable: false,
            kind: detail.kind,
            reference: detail.reference,
            date: detail.date,
            itemId: detail.itemId,
            itemCode: detail.itemCode,
            itemName: detail.itemName,
            warehouse: detail.warehouse,
            warehouseName:
              detail.warehouseName ||
              warehouseMap.get(detail.warehouse) ||
              detail.warehouse,
            quantity: detail.quantity,
            unit: detail.unit,
            movementId: detail.movementId || log.entityId,
            entryId: detail.entryId || null,
            method: detail.method || "PERIODIC_WEIGHTED_AVERAGE",
            valuationMethod: detail.valuationMethod || "متوسط تكلفة الفترة",
            hasImmediateEntry: Boolean(detail.hasImmediateEntry ?? detail.entryId),
          };
        } else if (sm) {
          const itemConfig = (sm.item?.data as Record<string, string>) || {};
          stockDetails = {
            isHistoricalEnriched: true,
            isDataUnavailable: false,
            kind: sm.kind,
            reference: sm.reference,
            date: sm.date.toISOString().slice(0, 10),
            itemId: sm.itemId,
            itemCode: sm.item?.code || "",
            itemName: sm.item?.name || "",
            warehouse: sm.warehouse,
            warehouseName: warehouseMap.get(sm.warehouse) || sm.warehouse,
            quantity: sm.quantity.toString(),
            unit: itemConfig.unit || "",
            movementId: sm.id,
            entryId: sm.entryId || null,
            method: detail.method || "PERIODIC_WEIGHTED_AVERAGE",
            valuationMethod: "متوسط تكلفة الفترة",
            hasImmediateEntry: Boolean(sm.entryId),
          };
        } else {
          stockDetails = {
            isHistoricalEnriched: true,
            isDataUnavailable: true,
            method: detail.method || "PERIODIC_WEIGHTED_AVERAGE",
            valuationMethod: "متوسط تكلفة الفترة",
            movementId: smId,
            entryId: detail.entryId || null,
          };
        }
      }

      const associatedEntryId =
        detail.entryId ||
        stockDetails?.entryId ||
        (log.action.startsWith("ENTRY_") ? log.entityId : undefined);

      const matchedEntry = associatedEntryId
        ? entryMap.get(String(associatedEntryId))
        : entryMap.get(log.entityId);

      const entryNumber =
        matchedEntry?.number ??
        (typeof detail.entryNumber === "number"
          ? detail.entryNumber
          : typeof detail.number === "number"
          ? detail.number
          : null);

      const entryDescription =
        matchedEntry?.description ??
        (detail.entryDescription || detail.description || null);

      return {
        id: log.id,
        createdAt: log.createdAt,
        userId: log.userId,
        actorName,
        actorUsername,
        action: log.action,
        entityId: log.entityId,
        entryNumber,
        entryDescription,
        stockDetails,
        detail,
      };
    });

    return ok({
      rows: formattedRows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      users: users.map((u: any) => ({
        id: u.id,
        name: u.name,
        username: u.username,
      })),
    });
  } catch (error) {
    return fail(error);
  }
}
