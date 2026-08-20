import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const LOCALES = routing.locales as readonly string[];
const ROLE_SECTIONS = ["customer", "worker", "guide", "admin", "tech"] as const;

/** Decode (not verify) the JWT payload — routing decisions only; the API enforces real security. */
function decodeRole(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Split locale prefix: /en/dashboard/worker -> locale=en, rest=/dashboard/worker
  const segments = pathname.split("/").filter(Boolean);
  const locale = LOCALES.includes(segments[0]) ? segments[0] : routing.defaultLocale;
  const rest = "/" + segments.slice(LOCALES.includes(segments[0]) ? 1 : 0).join("/");

  if (rest.startsWith("/dashboard")) {
    const accessToken = req.cookies.get("togt_access")?.value;
    const refreshToken = req.cookies.get("togt_refresh")?.value;

    // No session at all -> login
    if (!accessToken && !refreshToken) {
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }

    // Role-section enforcement (access token present; otherwise the client guard handles it)
    const role = decodeRole(accessToken);
    const section = rest.split("/")[2];
    if (role && section && (ROLE_SECTIONS as readonly string[]).includes(section)) {
      const userSection = role.toLowerCase();
      if (section !== userSection) {
        return NextResponse.redirect(new URL(`/${locale}/dashboard/${userSection}`, req.url));
      }
    }
  }

  return intlMiddleware(req);
}

export const config = {
  // Match all pathnames except for:
  // - /api, /trpc, /_next, /_vercel
  // - files with a dot (e.g. favicon.ico)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
