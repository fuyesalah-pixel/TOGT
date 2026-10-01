import { NextRequest, NextResponse } from "next/server";

/**
 * Same-origin image proxy used by the ID-card exports (html2canvas).
 *
 * R2/Cloudflare CDN responses carry no CORS headers, which taints the canvas
 * and silently drops the customer photo from printed/exported cards. This
 * route fetches the image server-side and re-serves it with permissive CORS
 * headers. It lives OUTSIDE /api/* because Traefik routes /api to the NestJS
 * backend.
 */
export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) return new NextResponse("Missing image URL", { status: 400 });

  let target: URL;
  try { target = new URL(rawUrl); } catch { return new NextResponse("Invalid image URL", { status: 400 }); }
  if (target.protocol !== "https:" && target.protocol !== "http:") return new NextResponse("Unsupported image URL", { status: 400 });

  try {
    const response = await fetch(target, { cache: "no-store" });
    if (!response.ok) return new NextResponse("Image unavailable", { status: response.status });
    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return new NextResponse("Not an image", { status: 415 });
    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Could not fetch image", { status: 502 });
  }
}
