import { HttpError } from "@/lib/server/http";
import { authorize } from "./server";
import {
  can,
  isValidPermissionKey,
  PERMISSION_DEFINITIONS,
  type PermissionKey,
  type PermissionPrincipal,
} from "./permissions";

export { can, isValidPermissionKey, PERMISSION_DEFINITIONS, type PermissionKey, type PermissionPrincipal };
export type AuthenticatedUser = Awaited<ReturnType<typeof authorize>>;

/**
 * Enforces permission check on server API routes or Server Actions.
 * Throws 401 if unauthenticated, 403 if forbidden.
 */
export async function requirePermission(
  request: Request | undefined,
  permission: PermissionKey,
): Promise<AuthenticatedUser> {
  const user = await authorize(request);
  if (!isValidPermissionKey(permission)) {
    throw new HttpError(403, "صلاحية غير معروفة");
  }
  const u = user as any;
  const principal: PermissionPrincipal = {
    id: user.id,
    companyId: user.companyId,
    role: user.role,
    isActive: user.isActive,
    permissions: Array.isArray(u.permissions)
      ? (u.permissions as string[])
      : [],
    name: user.name,
    username: u.username || null,
    email: user.email,
  };
  if (!can(principal, permission)) {
    const def = PERMISSION_DEFINITIONS.find((d) => d.key === permission);
    throw new HttpError(
      403,
      `ليس لديك صلاحية: ${def?.label || permission}`,
    );
  }
  return user;
}
