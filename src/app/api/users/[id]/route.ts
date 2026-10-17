import { NextRequest } from "next/server";
import { authorize } from "@/lib/auth/server";
import { body, fail, HttpError, ok } from "@/lib/server/http";
import { getUserById, updateUser, updateUserSchema } from "@/lib/auth/user-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await authorize();
    if (user.role !== "admin") {
      throw new HttpError(403, "إدارة المستخدمين مخصصة للمدير الكامل فقط");
    }
    const { id } = await params;
    const targetUser = await getUserById(user, id);
    return ok({ user: targetUser });
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await authorize(request, true, true);
    if (user.role !== "admin") {
      throw new HttpError(403, "إدارة المستخدمين مخصصة للمدير الكامل فقط");
    }
    const { id } = await params;
    const input = updateUserSchema.parse(await body(request));
    const updated = await updateUser(user, id, input);
    return ok({ user: updated, message: "تم تحديث بيانات وصلاحيات المستخدم بنجاح" });
  } catch (error) {
    return fail(error);
  }
}
