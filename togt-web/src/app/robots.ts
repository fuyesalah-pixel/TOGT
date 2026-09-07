import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/en/dashboard", "/ar/dashboard", "/am/dashboard", "/om/dashboard", "/en/login", "/ar/login", "/am/login", "/om/login", "/en/auth/", "/ar/auth/", "/am/auth/", "/om/auth/", "/en/payment/"] }], sitemap: absoluteUrl("/sitemap.xml") };
}
