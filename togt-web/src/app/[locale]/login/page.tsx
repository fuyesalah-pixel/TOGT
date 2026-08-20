"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Plane } from "lucide-react";
import { API_URL } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const authError = searchParams.get("error");

  useEffect(() => {
    if (user) {
      router.replace(`/${locale}/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, locale, router]);

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-togt-navy via-togt-navy to-togt-blue p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-togt-orange">
            <Plane className="h-6 w-6 text-white" />
          </span>
          <div>
            <p className="font-extrabold leading-tight">TOGT Tour &amp; Travel</p>
            <p className="text-xs text-white/60">IATA-accredited · Addis Ababa</p>
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">
            Your journey,
            <br />
            <span className="text-togt-orange">managed beautifully.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/70">
            Track service requests, chat with our team, manage packages and groups —
            all from your TOGT dashboard.
          </p>
        </div>
        <p className="text-xs text-white/40">© {new Date().getFullYear()} TOGT Tour &amp; Travel</p>
      </div>

      {/* Sign-in panel */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-togt-orange">
              <Plane className="h-5 w-5 text-white" />
            </span>
            <p className="font-extrabold text-togt-navy">TOGT Tour &amp; Travel</p>
          </div>

          <h2 className="text-xl font-extrabold text-togt-navy">Sign in to your dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">Access is via Google account only.</p>

          {authError && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              Sign-in failed. Please try again.
            </p>
          )}

          <a
            href={`${API_URL}/api/auth/google`}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-togt-navy shadow-sm transition-all hover:border-togt-blue/40 hover:shadow"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </a>

          {isLoading && <p className="mt-4 text-center text-xs text-gray-400">Checking session...</p>}

          <p className="mt-6 text-center text-xs text-gray-400">
            By signing in you agree to TOGT&apos;s terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
