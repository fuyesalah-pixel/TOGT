"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LoadingSpinner } from "@/components/dashboard/shared/loading-spinner";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/${locale}/login`);
    }
  }, [user, isLoading, locale, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner label="Loading your dashboard..." />
      </div>
    );
  }

  if (!user) return null;

  return <DashboardShell>{children}</DashboardShell>;
}
