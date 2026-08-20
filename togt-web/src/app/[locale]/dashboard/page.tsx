"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/dashboard/shared/loading-spinner";

export default function DashboardIndexPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(`/${locale}/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, isLoading, locale, router]);

  return <LoadingSpinner label="Redirecting..." />;
}
