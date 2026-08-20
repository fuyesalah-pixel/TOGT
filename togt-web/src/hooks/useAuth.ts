"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { getMe, logout as apiLogout } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

export function useAuth() {
  const queryClient = useQueryClient();
  const locale = useLocale();

  const { data, isLoading } = useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        return await getMe();
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
    isAuthenticated: !!data,
    logout,
  };
}
