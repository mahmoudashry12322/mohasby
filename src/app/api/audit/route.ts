import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions.server";
import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Only users with audit.view permission (or full admin) can access audit logs
    const user = await requirePermission(request, "audit.view");

    const p = request.nextUrl.searchParams;
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
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
      ];
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

    const formattedRows = logs.map((log) => {
      const detail = (log.detail as Record<string, any>) || {};
      const fallbackUser = userMap.get(log.userId);
      const actorName =
        detail.actorName || fallbackUser?.name || "مستخدم #" + log.userId.slice(-6);
      const actorUsername =
        detail.actorUsername || fallbackUser?.username || "";

      return {
        id: log.id,
        createdAt: log.createdAt,
        userId: log.userId,
        actorName,
        actorUsername,
        action: log.action,
        entityId: log.entityId,
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
