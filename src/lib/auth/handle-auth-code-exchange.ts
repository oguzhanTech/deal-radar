import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * PKCE `code` ile oturum açar, profil yoksa oluşturur; ana uygulamaya yönlendirir.
 * OAuth ve e-posta doğrulama tamamlama için ortak.
 */
function isEmailOtpType(value: string | null): value is EmailOtpType {
  if (!value) return false;
  return ["signup", "recovery", "invite", "magiclink", "email", "email_change"].includes(value);
}

export async function handleAuthCodeExchange(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpType = url.searchParams.get("type");
  const nextRaw = url.searchParams.get("next") ?? "/";
  const next = nextRaw.startsWith("/") ? nextRaw : `/${nextRaw}`;
  const origin = url.origin;
  const redirectUrl = `${origin}${next}`;
  const hasOtpLink = Boolean(tokenHash && isEmailOtpType(otpType));

  if (!code && !hasOtpLink) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

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
            const opts = (options ?? {}) as {
              path?: string;
              maxAge?: number;
              httpOnly?: boolean;
              secure?: boolean;
              sameSite?: "lax" | "strict" | "none";
            };
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

  let user = null;
  let error: { message?: string } | null = null;

  if (code) {
    const {
      data: { user: codeUser },
      error: codeError,
    } = await supabase.auth.exchangeCodeForSession(code);
    user = codeUser;
    error = codeError;
  } else if (tokenHash && isEmailOtpType(otpType)) {
    const {
      data: { user: otpUser },
      error: otpError,
    } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    user = otpUser;
    error = otpError;
  }

  if (error) {
    console.error("[auth] handleAuthCodeExchange error:", error);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

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
      await supabase.from("profiles").insert({ user_id: user.id, display_name: displayName });
    }
  }

  return response;
}
