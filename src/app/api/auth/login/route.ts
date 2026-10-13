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
        identifier: z.string().min(1).max(200).optional(),
        email: z.string().min(1).max(200).optional(),
        password: z.string().min(1).max(256),
        rememberMe: z.boolean().optional(),
      })
      .refine((data) => Boolean(data.identifier || data.email), {
        message: "يرجى إدخال اسم المستخدم أو البريد الإلكتروني",
      })
      .parse(await body(request));

    const rawIdentifier = (input.identifier || input.email)!.trim().toLowerCase();

    // Look up user by email or username
    const user = (await (prisma.user as any).findFirst({
      where: (rawIdentifier.includes("@")
        ? { email: rawIdentifier }
        : {
            OR: [
              { username: rawIdentifier },
              { email: rawIdentifier },
            ],
          }) as any,
      include: { company: true },
    })) as any;

    // Rate limiting key: normalized to the user's permanent ID if account exists,
    // so attacker cannot bypass rate limit by toggling between username and email.
    const rateLimitTarget = user ? `user:${user.id}` : `ident:${rawIdentifier}`;
    const key = digest(rateLimitTarget + ":" + Math.floor(Date.now() / 900000));

    const attempt = await prisma.loginAttempt.upsert({
      where: { key },
      create: { key, expiresAt: new Date(Date.now() + 900000) },
      update: { count: { increment: 1 } },
    });

    if (attempt.count > 10)
      throw new HttpError(429, "محاولات كثيرة. حاول بعد 15 دقيقة");

    const valid = verifyPassword(
      input.password,
      user?.passwordHash ||
        "00000000000000000000000000000000:" + "00".repeat(64),
    );

    if (!user || !user.isActive || !valid)
      throw new HttpError(401, "اسم المستخدم أو البريد أو كلمة المرور غير صحيحة");

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
