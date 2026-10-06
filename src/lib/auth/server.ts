import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { HttpError } from "@/lib/server/http";

export const SESSION_COOKIE = "mohasby_session";
export const digest = (v: string) =>
  createHash("sha256").update(v).digest("hex");
export function hashPassword(password: string) {
  if (password.length < 12 || password.length > 256)
    throw new Error("كلمة المرور من 12 إلى 256 حرفاً");
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash || password.length > 256) return false;
  const actual = scryptSync(password, salt, 64),
    expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: digest(token) },
    include: { user: { include: { company: true } } },
  });
  return session && session.expiresAt > new Date() && session.user.isActive
    ? session.user
    : null;
}
export async function authorize(
  request?: Request,
  write = false,
  admin = false,
) {
  if (request && !["GET", "HEAD"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const expected = process.env.APP_URL
      ? new URL(process.env.APP_URL).origin
      : new URL(request.url).origin;
    if (origin && origin !== expected)
      throw new HttpError(403, "مصدر الطلب غير مسموح");
    if (request.headers.get("sec-fetch-site") === "cross-site")
      throw new HttpError(403, "مصدر الطلب غير مسموح");
  }
  const user = await currentUser();
  if (!user) throw new HttpError(401, "سجل الدخول أولاً");
  if ((write && user.role === "auditor") || (admin && user.role !== "admin"))
    throw new HttpError(403, "ليس لديك صلاحية");
  return user;
}
export function publicUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  company: { name: string };
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    companyName: user.company.name,
  };
}
