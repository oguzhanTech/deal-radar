import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const redirectUrl = `${origin}${next}`;

  if (code) {
    const cookieStore = await cookies();
    const response = NextResponse.redirect(redirectUrl);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            const isProd = origin.startsWith("https://");
            cookiesToSet.forEach(({ name, value, options }) => {
              const opts = (options ?? {}) as { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "strict" | "none" };
              response.cookies.set(name, value, {
                path: "/",
                ...opts,
                secure: opts.secure ?? isProd,
                sameSite: opts.sameSite ?? "lax",
              });
            });
          },
        },
      }
    );
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && user) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!existing) {
        const displayName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "User";
        await supabase
          .from("profiles")
          .insert({ user_id: user.id, display_name: displayName });
      }
    }
    return response;
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
