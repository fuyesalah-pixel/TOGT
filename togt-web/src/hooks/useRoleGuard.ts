"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { Role } from "@/lib/api/types";
import { useAuth } from "./useAuth";

/**
 * Ensures the current user may view a role dashboard.
 * Each role is routed to its canonical dashboard. Admins manage the other
 * roles from the admin dashboard rather than rendering another role shell.
 */
export function useRoleGuard(role: Role) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role !== role) {
      router.replace(`/${locale}/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, isLoading, role, locale, router]);

  return { user, isLoading, allowed: !!user && user.role === role };
}
