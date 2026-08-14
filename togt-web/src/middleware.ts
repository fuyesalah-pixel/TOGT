import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - /api, /trpc, /_next, /_vercel
  // - files with a dot (e.g. favicon.ico)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
