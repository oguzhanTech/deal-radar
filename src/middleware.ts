import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const CANONICAL_HOST = "topla.online";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const url = request.nextUrl;

  // www'yi canonical (www'siz) adrese yönlendir — tek canonical host için
  if (host === "www.topla.online" || host === "www.topla.online:443") {
    const canonicalUrl = new URL(url.pathname + url.search, `https://${CANONICAL_HOST}`);
    return NextResponse.redirect(canonicalUrl, 301);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
