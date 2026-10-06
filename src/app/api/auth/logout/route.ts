import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { authorize, digest, SESSION_COOKIE } from "@/lib/auth/server";
import { fail, ok } from "@/lib/server/http";
export async function POST(request: Request) {
  try {
    await authorize(request);
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token)
      await prisma.session.deleteMany({ where: { tokenHash: digest(token) } });
    const response = ok({});
    response.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
    return response;
  } catch (error) {
    return fail(error);
  }
}
