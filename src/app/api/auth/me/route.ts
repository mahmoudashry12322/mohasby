import { authorize, publicUser } from "@/lib/auth/server";
import { fail, ok } from "@/lib/server/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return ok({ user: publicUser(await authorize()) });
  } catch (e) {
    return fail(e);
  }
}
