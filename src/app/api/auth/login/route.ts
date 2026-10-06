import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  digest,
  publicUser,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/auth/server";
import { body, fail, HttpError, ok } from "@/lib/server/http";
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(process.env.APP_URL || request.url).origin)
      throw new HttpError(403, "مصدر الطلب غير مسموح");
    const input = z
      .object({
        email: z.string().email().max(200),
        password: z.string().min(1).max(256),
        rememberMe: z.boolean().optional(),
      })
      .parse(await body(request));
    const email = input.email.trim().toLowerCase();
    const key = digest(email + ":" + Math.floor(Date.now() / 900000));
    const attempt = await prisma.loginAttempt.upsert({
      where: { key },
      create: { key, expiresAt: new Date(Date.now() + 900000) },
      update: { count: { increment: 1 } },
    });
    if (attempt.count > 10)
      throw new HttpError(429, "محاولات كثيرة. حاول بعد 15 دقيقة");
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });
    const valid = verifyPassword(
      input.password,
      user?.passwordHash ||
        "00000000000000000000000000000000:" + "00".repeat(64),
    );
    if (!user || !user.isActive || !valid)
      throw new HttpError(401, "البريد أو كلمة المرور غير صحيحة");
    const token = randomBytes(32).toString("hex");
    const maxAge = input.rememberMe ? 30 * 86400 : 86400;
    await prisma.session.create({
      data: {
        tokenHash: digest(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + maxAge * 1000),
      },
    });
    const response = ok({ user: publicUser(user) });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });
    await prisma.loginAttempt.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return response;
  } catch (error) {
    return fail(error);
  }
}
