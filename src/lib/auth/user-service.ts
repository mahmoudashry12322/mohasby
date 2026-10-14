import { z } from "zod";
import prisma from "@/lib/prisma";
import { HttpError } from "@/lib/server/http";
import { hashPassword } from "./server";
import { audit, locked, Actor } from "@/lib/accounting/ledger";
import { isValidPermissionKey, PermissionKey } from "./permissions";
import { Prisma } from "@prisma/client";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "اسم الدخول يجب ألا يقل عن 3 أحرف")
  .max(50, "اسم الدخول يجب ألا يتجاوز 50 حرفاً")
  .regex(
    /^[a-zA-Z0-9_.-]+$/,
    "اسم الدخول يجب أن يحتوي فقط على أحرف إنجليزية وأرقام ونقاط أو شرطات وبدون علامة @",
  )
  .transform((v) => v.toLowerCase());

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب").max(200),
  username: usernameSchema,
  password: z
    .string()
    .min(1, "كلمة المرور مطلوبة")
    .max(256),
  email: z
    .string()
    .trim()
    .email("صيغة البريد الإلكتروني غير صحيحة")
    .transform((v) => v.toLowerCase())
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  role: z.enum(["admin", "accountant", "auditor"]).default("accountant"),
  isActive: z.boolean().default(true),
  permissions: z.array(z.string()).default([]),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب").max(200).optional(),
  username: usernameSchema.optional(),
  email: z
    .string()
    .trim()
    .email("صيغة البريد الإلكتروني غير صحيحة")
    .transform((v) => v.toLowerCase())
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  role: z.enum(["admin", "accountant", "auditor"]).optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
  password: z
    .string()
    .min(1, "كلمة المرور مطلوبة")
    .max(256)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export async function listUsers(actor: Actor) {
  return (prisma.user as any).findMany({
    where: { companyId: actor.companyId },
    select: {
      id: true,
      companyId: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      permissions: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getUserById(actor: Actor, targetId: string) {
  const user = await (prisma.user as any).findFirst({
    where: { id: targetId, companyId: actor.companyId },
    select: {
      id: true,
      companyId: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      permissions: true,
      createdAt: true,
    },
  });
  if (!user) throw new HttpError(404, "المستخدم غير موجود");
  return user;
}

export async function createUser(
  actor: Actor,
  inputRaw: z.input<typeof createUserSchema>,
) {
  const input = createUserSchema.parse(inputRaw);

  // Validate permissions list
  const validPermissions = input.permissions.filter(isValidPermissionKey);

  return locked(actor.companyId, async (tx) => {
    // Check username uniqueness
    const existingUsername = await (tx.user as any).findFirst({
      where: { username: input.username } as any,
    });
    if (existingUsername) {
      throw new HttpError(409, "اسم الدخول مستخدم بالفعل؛ يرجى اختيار اسم آخر");
    }

    // Check email uniqueness if email provided
    if (input.email) {
      const existingEmail = await tx.user.findFirst({
        where: { email: input.email },
      });
      if (existingEmail) {
        throw new HttpError(
          409,
          "البريد الإلكتروني مستخدم بالفعل؛ يرجى اختيار بريد آخر",
        );
      }
    }

    const passwordHash = hashPassword(input.password);

    try {
      const created = await (tx.user as any).create({
        data: {
          companyId: actor.companyId,
          name: input.name,
          username: input.username,
          email: input.email,
          passwordHash,
          role: input.role,
          isActive: input.isActive,
          permissions: validPermissions,
        },
        select: {
          id: true,
          companyId: true,
          name: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          permissions: true,
          createdAt: true,
        },
      });

      await audit(tx, actor, "USER_CREATED", created.id, {
        createdName: created.name,
        createdUsername: created.username,
        role: created.role,
        permissionsCount: validPermissions.length,
      });

      return created;
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new HttpError(
          409,
          "اسم الدخول أو البريد الإلكتروني مسجل بالفعل لمستخدم آخر",
        );
      }
      throw err;
    }
  });
}

export async function updateUser(
  actor: Actor,
  targetId: string,
  inputRaw: z.input<typeof updateUserSchema>,
) {
  const input = updateUserSchema.parse(inputRaw);

  return locked(actor.companyId, async (tx) => {
    const targetUser = await (tx.user as any).findFirst({
      where: { id: targetId, companyId: actor.companyId },
    });
    if (!targetUser) throw new HttpError(404, "المستخدم غير موجود");

    // Guard against demoting or deactivating the last active manager in the company
    const activeAdminsCount = await tx.user.count({
      where: { companyId: actor.companyId, role: "admin", isActive: true },
    });

    const isCurrentlyActiveAdmin =
      targetUser.role === "admin" && targetUser.isActive;
    const willRemainActiveAdmin =
      (input.role !== undefined ? input.role === "admin" : targetUser.role === "admin") &&
      (input.isActive !== undefined ? input.isActive === true : targetUser.isActive === true);

    if (isCurrentlyActiveAdmin && !willRemainActiveAdmin && activeAdminsCount <= 1) {
      throw new HttpError(
        400,
        "لا يمكن تعطيل أو إزالة صلاحيات المدير الأخير الفعّال في الشركة",
      );
    }

    // Check username uniqueness if changed
    if (input.username && input.username !== targetUser.username) {
      const existingUsername = await (tx.user as any).findFirst({
        where: { username: input.username, id: { not: targetId } } as any,
      });
      if (existingUsername) {
        throw new HttpError(
          409,
          "اسم الدخول مستخدم بالفعل؛ يرجى اختيار اسم آخر",
        );
      }
    }

    // Check email uniqueness if changed
    if (input.email && input.email !== targetUser.email) {
      const existingEmail = await tx.user.findFirst({
        where: { email: input.email, id: { not: targetId } },
      });
      if (existingEmail) {
        throw new HttpError(
          409,
          "البريد الإلكتروني مستخدم بالفعل؛ يرجى اختيار بريد آخر",
        );
      }
    }

    const dataToUpdate: Record<string, any> = {};
    if (input.name !== undefined) dataToUpdate.name = input.name;
    if (input.username !== undefined) dataToUpdate.username = input.username;
    if (input.email !== undefined) dataToUpdate.email = input.email;
    if (input.role !== undefined) dataToUpdate.role = input.role;
    if (input.isActive !== undefined) dataToUpdate.isActive = input.isActive;
    if (input.permissions !== undefined) {
      dataToUpdate.permissions = input.permissions.filter(isValidPermissionKey);
    }

    let passwordChanged = false;
    if (input.password) {
      dataToUpdate.passwordHash = hashPassword(input.password);
      passwordChanged = true;
    }

    const updated = await (tx.user as any).update({
      where: { id: targetId },
      data: dataToUpdate,
      select: {
        id: true,
        companyId: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        permissions: true,
        createdAt: true,
      },
    });

    // Invalidate existing sessions if deactivated or password was changed
    if (passwordChanged || input.isActive === false) {
      await tx.session.deleteMany({ where: { userId: targetId } });
    }

    await audit(tx, actor, "USER_UPDATED", targetId, {
      targetName: updated.name,
      targetUsername: updated.username,
      passwordReset: passwordChanged,
      isActive: updated.isActive,
      role: updated.role,
      permissionsCount: Array.isArray(updated.permissions)
        ? updated.permissions.length
        : 0,
    });

    return updated;
  });
}
