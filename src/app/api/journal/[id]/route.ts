import { z } from "zod";
import { requirePermission } from "@/lib/auth/permissions.server";
import { body, fail, HttpError, ok } from "@/lib/server/http";
import { entryAction } from "@/lib/accounting/ledger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolved = await params;
  try {
    const input = z
      .object({
        action: z.enum(["post", "void", "reverse"]),
        date: z.string().optional(),
      })
      .parse(await body(request));

    const permissionKey =
      input.action === "post"
        ? ("journal.post" as const)
        : input.action === "void"
          ? ("journal.void" as const)
          : ("journal.reverse" as const);

    const user = await requirePermission(request, permissionKey);

    const result = await entryAction(user, resolved.id, input.action, input.date);

    if (input.action === "reverse" && (result as any)?.alreadyReversed) {
      throw new HttpError(
        409,
        `هذا القيد تم عكسه مسبقًا بالقيد رقم ${(result as any).number}`,
      );
    }

    return ok({
      entry: result,
    });
  } catch (e) {
    return fail(e);
  }
}
