import { z } from "zod";
import { authorize } from "@/lib/auth/server";
import { body, fail, ok } from "@/lib/server/http";
import { entryAction } from "@/lib/accounting/ledger";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolved = await params;
  try {
    const user = await authorize(request, true);
    const input = z
      .object({
        action: z.enum(["post", "void", "reverse"]),
        date: z.string().optional(),
      })
      .parse(await body(request));
    return ok({
      entry: await entryAction(user, resolved.id, input.action, input.date),
    });
  } catch (e) {
    return fail(e);
  }
}
