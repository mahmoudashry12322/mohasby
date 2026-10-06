import { authorize } from "@/lib/auth/server";
import prisma from "@/lib/prisma";
import { fail, ok } from "@/lib/server/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const user = await authorize();
    const page = Math.max(
      1,
      Number(new URL(request.url).searchParams.get("page")) || 1,
    );
    return ok({
      rows: await prisma.auditLog.findMany({
        where: { companyId: user.companyId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 100,
        take: 100,
      }),
      total: await prisma.auditLog.count({
        where: { companyId: user.companyId },
      }),
    });
  } catch (e) {
    return fail(e);
  }
}
