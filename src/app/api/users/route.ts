import { NextRequest } from "next/server";
import { authorize } from "@/lib/auth/server";
import { body, fail, HttpError, ok } from "@/lib/server/http";
import { listUsers, createUser, createUserSchema } from "@/lib/auth/user-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await authorize();
    if (user.role !== "admin") {
      throw new HttpError(403, "إدارة المستخدمين مخصصة للمدير الكامل فقط");
    }
    const users = await listUsers(user);
    return ok({ users });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authorize(request, true, true);
    if (user.role !== "admin") {
      throw new HttpError(403, "إدارة المستخدمين مخصصة للمدير الكامل فقط");
    }
    const input = createUserSchema.parse(await body(request));
    const created = await createUser(user, input);
    return ok({ user: created, message: "تم إنشاء المستخدم بنجاح" }, 201);
  } catch (error) {
    return fail(error);
  }
}
