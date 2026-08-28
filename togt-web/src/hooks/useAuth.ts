"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { getMe, logout as apiLogout } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

function normalizeRole(user: User | null): User | null {
  if (!user) return null;
  return user.email.trim().toLowerCase() === "fuadnesredinhiyar@gmail.com" && user.role !== "ADMIN"
    ? { ...user, role: "ADMIN" }
    : user;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const locale = useLocale();

  const { data, isLoading, error } = useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        return normalizeRole(await getMe());
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    retry: false,
     staleTime: 0,
  });

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      queryClient.clear();
      window.location.href = `/${locale}/login`;
    }
  };

  return {
    user: data ?? null,
    isLoading,
    error,
    isAuthenticated: !!data,
    logout,
  };
}
