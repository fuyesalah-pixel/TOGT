import { NextRequest, NextResponse } from "next/server";

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
