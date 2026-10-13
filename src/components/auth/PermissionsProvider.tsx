"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { PermissionKey, can as canCheck, PermissionPrincipal } from "@/lib/auth/permissions";
import { canAccessPage } from "@/lib/auth/permission-map";

interface UserContextValue {
  user: PermissionPrincipal | null;
  permissions: string[];
  isAdmin: boolean;
  can: (permission: PermissionKey) => boolean;
  canPage: (pageSlug: string) => boolean;
  reloadUser: () => Promise<void>;
  isLoading: boolean;
}

const PermissionsContext = createContext<UserContextValue>({
  user: null,
  permissions: [],
  isAdmin: false,
  can: () => false,
  canPage: () => false,
  reloadUser: async () => {},
  isLoading: true,
});

interface PermissionsProviderProps {
  children: React.ReactNode;
  initialUser?: PermissionPrincipal | null;
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({
  children,
  initialUser = null,
}) => {
  const [user, setUser] = useState<PermissionPrincipal | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const u = data.user;
          setUser({
            id: u.id,
            companyId: u.companyId,
            role: u.role,
            isActive: u.isActive !== undefined ? u.isActive : true,
            permissions: Array.isArray(u.permissions) ? u.permissions : [],
            name: u.name,
            username: u.username,
            email: u.email,
            company: { name: u.companyName },
          });
        } else {
          setUser(null);
        }
      }
    } catch {
      // ignore network errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialUser) {
      void fetchUser();
    }
  }, [fetchUser, initialUser]);

  const isAdmin = user?.role === "admin";
  const permissions = Array.isArray(user?.permissions) ? (user.permissions as string[]) : [];

  const can = useCallback(
    (permission: PermissionKey) => {
      return canCheck(user, permission);
    },
    [user],
  );

  const canPage = useCallback(
    (pageSlug: string) => {
      return canAccessPage(user, pageSlug);
    },
    [user],
  );

  return (
    <PermissionsContext.Provider
      value={{
        user,
        permissions,
        isAdmin,
        can,
        canPage,
        reloadUser: fetchUser,
        isLoading,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);
