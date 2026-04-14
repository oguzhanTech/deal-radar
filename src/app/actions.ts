"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureUniqueDealSlug } from "@/lib/deal-slug";
import { revalidateDealDetail } from "@/lib/deal-revalidate";
import { dealPath } from "@/lib/deal-url";

export async function uploadDealImage(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const file = formData.get("file") as File | null;
  if (!file?.size) return { error: "Görsel seçilmedi." };

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const { error } = await supabase.storage
    .from("deal-images")
    .upload(path, bytes, {
      contentType: file.type || "image/jpeg",
      cacheControl: "31536000",
    });

  if (error) {
    console.error("[action] uploadDealImage error:", error);
    return { error: error.message };
  }

  const { data: urlData } = supabase.storage.from("deal-images").getPublicUrl(path);
  return { url: urlData.publicUrl, path };
}

export async function updateProfileAvatar(profileImageUrl: string | null, profileImagePath: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const { data: existing } = await supabase
    .from("profiles")
    .select("profile_image_path")
    .eq("user_id", user.id)
    .maybeSingle();

  const oldPath = existing?.profile_image_path ?? null;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      profile_image_url: profileImageUrl,
      profile_image_path: profileImagePath,
    })
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  // Remove old object after update (best-effort)
  if (oldPath && oldPath !== profileImagePath) {
    try {
      await supabase.storage.from("profile-images").remove([oldPath]);
    } catch {
      // ignore remove errors
    }
  }

  return { success: true, url: profileImageUrl, path: profileImagePath };
}

export async function uploadProfileImage(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const file = formData.get("file") as File | null;
  if (!file?.size) return { error: "Görsel seçilmedi." };

  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE_BYTES) return { error: "Dosya çok büyük. Max 5MB." };

  const allowed = ["image/jpeg", "image/png"];
  if (!allowed.includes(file.type)) return { error: "Sadece JPG veya PNG desteklenir." };

  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("profile-images")
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
    });

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(path);
  return await updateProfileAvatar(urlData.publicUrl, path);
}

export async function createDeal(payload: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Oturum bulunamadı. Tekrar giriş yapın." };
  }

  const { slug: _clientSlug, ...rest } = payload;
  const title = typeof rest.title === "string" ? rest.title.trim() : "";
  if (!title) {
    return { error: "Başlık gerekli." };
  }
  const slug = await ensureUniqueDealSlug(supabase, title);
  const insertPayload = { ...rest, slug, created_by: user.id };

  const { data, error } = await supabase
    .from("deals")
    .insert(insertPayload)
    .select("id, slug")
    .single();

  if (error) {
    console.error("[action] createDeal error:", error);
    return { error: error.message };
  }

  return { data };
}

export async function updateProfile(displayName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Oturum bulunamadı." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("user_id", user.id);

  if (error) {
    console.error("[action] updateProfile error:", error);
    return { error: error.message };
  }

  return { success: true, display_name: displayName };
}

export async function signOutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[action] signOut error:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function voteDeal(dealId: string, vote: 1 | -1, currentVote: 1 | -1 | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Oturum bulunamadı." };
  }

  if (currentVote === vote) {
    const { error } = await supabase
      .from("deal_votes")
      .delete()
      .eq("user_id", user.id)
      .eq("deal_id", dealId);
    if (error) return { error: error.message };
    return { newVote: null, delta: -vote };
  } else {
    const { error } = await supabase
      .from("deal_votes")
      .upsert({ user_id: user.id, deal_id: dealId, vote });
    if (error) return { error: error.message };
    return { newVote: vote, delta: vote - (currentVote ?? 0) };
  }
}

export async function postComment(dealId: string, content: string, parentCommentId?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Oturum bulunamadı." };
  }

  const { data: comment, error } = await supabase
    .from("deal_comments")
    .insert({ deal_id: dealId, user_id: user.id, content, parent_comment_id: parentCommentId ?? null })
    .select("*")
    .single();

  if (error) {
    console.error("[action] postComment error:", error);
    return { error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, trust_score, level, profile_image_url")
    .eq("user_id", user.id)
    .single();

  if (parentCommentId) {
    // Reply notification/push is best-effort and should not block comment response.
    void (async () => {
      try {
        const admin = createAdminClient();
        const { data: parentComment } = await admin
          .from("deal_comments")
          .select("id, user_id, deal_id")
          .eq("id", parentCommentId)
          .maybeSingle();

        if (!parentComment || parentComment.user_id === user.id || parentComment.deal_id !== dealId) return;

        const { data: dealForUrl } = await admin.from("deals").select("slug").eq("id", dealId).maybeSingle();
        const basePath = dealForUrl?.slug ? dealPath(dealForUrl) : `/deal/${dealId}`;
        const url = `${basePath}?tab=comments&comment=${comment.id}`;
        const title = "Yorumuna yanıt geldi";
        const message = `${profile?.display_name ?? "Bir kullanıcı"} yorumuna yanıt verdi.`;

        const insertNotification = admin.from("notifications").insert({
          user_id: parentComment.user_id,
          type: "comment_reply",
          title,
          message,
          payload: {
            deal_id: dealId,
            comment_id: comment.id,
            parent_comment_id: parentCommentId,
            url,
          },
        });

        const pushTask = (async () => {
          if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
          const { data: subscriptions } = await admin
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth")
            .eq("user_id", parentComment.user_id);
          if (!subscriptions?.length) return;

          const { sendWebPush } = await import("@/lib/push");
          await Promise.allSettled(
            subscriptions.map((sub) =>
              sendWebPush(
                { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
                { title, body: message, url }
              )
            )
          );
        })();

        await Promise.allSettled([insertNotification, pushTask]);
      } catch (replyNotificationError) {
        console.error("[action] postComment reply notification error:", replyNotificationError);
      }
    })();
  }

  void revalidateDealDetail(supabase, dealId);

  return {
    data: {
      ...comment,
      profile: profile ?? { display_name: null, trust_score: 0, level: 1, profile_image_url: null },
    },
  };
}

export async function getSaveStatus(dealId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { saved: false };

  const { data } = await supabase
    .from("deal_saves")
    .select("deal_id")
    .eq("user_id", user.id)
    .eq("deal_id", dealId)
    .maybeSingle();

  return { saved: !!data };
}

export async function toggleSaveDeal(dealId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Oturum bulunamadı." };
  }

  const { data: existing } = await supabase
    .from("deal_saves")
    .select("deal_id")
    .eq("user_id", user.id)
    .eq("deal_id", dealId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("deal_saves").delete().eq("user_id", user.id).eq("deal_id", dealId);
    if (error) return { error: error.message };
    return { saved: false };
  } else {
    const { error } = await supabase.from("deal_saves").insert({ user_id: user.id, deal_id: dealId });
    if (error) return { error: error.message };
    return { saved: true };
  }
}

export async function removeSavedDeal(dealId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Oturum bulunamadı." };
  }

  const { error } = await supabase
    .from("deal_saves")
    .delete()
    .eq("user_id", user.id)
    .eq("deal_id", dealId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function reportDeal(dealId: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Oturum bulunamadı." };

  const { error } = await supabase
    .from("deal_reports")
    .insert({ deal_id: dealId, user_id: user.id, reason });

  if (error) return { error: error.message };
  return { success: true };
}

export async function getUserVote(dealId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { vote: null };

  const { data } = await supabase
    .from("deal_votes")
    .select("vote")
    .eq("user_id", user.id)
    .eq("deal_id", dealId)
    .maybeSingle();

  return { vote: data?.vote as 1 | -1 | null ?? null };
}

const DISPLAY_NAME_MAX = 40;
const PASSWORD_MIN = 8;
const SIGNUP_EMAIL_COOLDOWN_MS = 90_000;

const signUpCooldowns = new Map<string, number>();

/**
 * E-posta doğrulama ve OAuth için redirect tabanı.
 * Production'da `window.location.origin` ile `NEXT_PUBLIC_APP_URL` (www / apex) uyuşmazsa
 * Supabase linkleri veya gönderim tarafı sorun çıkarabilir; env önceliklidir (bkz. docs/DEPLOYMENT.md).
 */
function resolvePublicSiteUrl(requestOrigin: string): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
    return fromEnv;
  }
  const fromRequest = (requestOrigin || "").trim().replace(/\/$/, "");
  if (fromRequest && /^https?:\/\//i.test(fromRequest)) {
    return fromRequest;
  }
  return null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validatePassword(password: string, requireDigit: boolean) {
  if (password.length < PASSWORD_MIN) {
    return { error: `Şifre en az ${PASSWORD_MIN} karakter olmalı.` };
  }
  if (requireDigit && !/\d/.test(password)) {
    return { error: "Şifre en az bir rakam içermeli." };
  }
  return { ok: true as const };
}

function mapSignInErrorMessage(rawMessage: string) {
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return t("auth.invalidCredentials");
  }

  if (normalized.includes("email not confirmed")) {
    return t("auth.emailNotConfirmed");
  }

  if (
    normalized.includes("network request failed") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("fetch failed")
  ) {
    return t("auth.connectionError");
  }

  return rawMessage;
}

function validateAuthInputs(
  email: string,
  password: string,
  displayName?: string,
  requireDigit = false
): { ok: true } | { error: string } {
  const e = normalizeEmail(email);
  if (!e || !e.includes("@")) return { error: "Geçerli bir e-posta girin." };
  const passwordValidation = validatePassword(password, requireDigit);
  if ("error" in passwordValidation) return passwordValidation;
  if (displayName !== undefined) {
    const name = displayName.trim();
    if (!name) return { error: "Görünen ad boş olamaz." };
    if (name.length > DISPLAY_NAME_MAX) {
      return { error: `Görünen ad en fazla ${DISPLAY_NAME_MAX} karakter olabilir.` };
    }
  }
  return { ok: true };
}

export async function signUpWithPassword(
  email: string,
  password: string,
  displayName: string,
  redirectOrigin: string
) {
  const emailNormalized = normalizeEmail(email);
  const cooldownUntil = signUpCooldowns.get(emailNormalized);
  const now = Date.now();

  if (cooldownUntil && cooldownUntil > now) {
    const waitSeconds = Math.ceil((cooldownUntil - now) / 1000);
    return { error: `Bu e-posta ile az önce kayıt denendi. ${waitSeconds} saniye sonra tekrar deneyin.` };
  }

  const v = validateAuthInputs(emailNormalized, password, displayName, true);
  if ("error" in v) return { error: v.error };

  const siteUrl = resolvePublicSiteUrl(redirectOrigin);
  if (!siteUrl) {
    console.error("[action] signUpWithPassword: could not resolve site URL", {
      redirectOrigin,
      hasAppUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    });
    return {
      error:
        "Uygulama adresi çözülemedi. Ortamda NEXT_PUBLIC_APP_URL (ör. https://www.topla.online) tanımlı olduğundan emin olun.",
    };
  }
  const emailRedirectTo = `${siteUrl}/auth/confirm`;

  const supabase = await createClient();
  const trimmedName = displayName.trim();

  const { data, error } = await supabase.auth.signUp({
    email: emailNormalized,
    password,
    options: {
      data: { full_name: trimmedName },
      emailRedirectTo,
    },
  });

  if (error) {
    console.error("[action] signUpWithPassword error:", error);
    const em = error.message.toLowerCase();
    if (
      em.includes("already registered") ||
      em.includes("user already registered") ||
      em.includes("already been registered")
    ) {
      return { error: t("auth.emailAlreadyRegistered") };
    }
    return { error: error.message };
  }

  const user = data.user;
  if (!user) return { error: "Kayıt tamamlanamadı." };

  const identities = user.identities ?? [];
  if (!data.session && identities.length === 0) {
    return { error: t("auth.emailAlreadyRegistered") };
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[action] signUpWithPassword", {
      emailRedirectTo,
      hasSession: Boolean(data.session),
      emailConfirmedAt: user.email_confirmed_at,
      identities: identities.map((i) => i.provider),
    });
  }

  signUpCooldowns.set(emailNormalized, now + SIGNUP_EMAIL_COOLDOWN_MS);

  if (data.session) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!existing) {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ user_id: user.id, display_name: trimmedName });
      if (insertError) {
        console.error("[action] signUpWithPassword profile insert:", insertError);
      }
    }
    revalidatePath("/", "layout");
    return { success: true as const };
  }

  return { success: true as const, needsEmailConfirmation: true as const };
}

export async function signInWithPassword(email: string, password: string) {
  const v = validateAuthInputs(email, password);
  if ("error" in v) return { error: v.error };

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });

  if (error) {
    console.error("[action] signInWithPassword error:", error);
    return { error: mapSignInErrorMessage(error.message) };
  }

  revalidatePath("/", "layout");
  return { success: true as const };
}

export async function requestPasswordReset(email: string, redirectOrigin: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { error: "Geçerli bir e-posta girin." };
  }

  const siteUrl = resolvePublicSiteUrl(redirectOrigin);
  if (!siteUrl) {
    return {
      error:
        "Uygulama adresi çözülemedi. Ortamda NEXT_PUBLIC_APP_URL (ör. https://www.topla.online) tanımlı olduğundan emin olun.",
    };
  }

  const supabase = await createClient();
  const redirectTo = `${siteUrl}/auth/confirm?next=/auth/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });

  if (error) {
    // Enumeration riskini artırmamak için kullanıcıya genel yanıt döndür.
    console.error("[action] requestPasswordReset error:", error);
  }

  return { success: true as const };
}

export async function updatePassword(newPassword: string) {
  const validation = validatePassword(newPassword, true);
  if ("error" in validation) return { error: validation.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: t("auth.resetSessionExpired") };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    console.error("[action] updatePassword error:", error);
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true as const };
}

export async function signInWithGoogleAction(redirectOrigin: string) {
  const siteUrl = resolvePublicSiteUrl(redirectOrigin);
  if (!siteUrl) {
    console.error("[action] signInWithGoogle: could not resolve site URL", { redirectOrigin });
    return {
      error:
        "Uygulama adresi çözülemedi. NEXT_PUBLIC_APP_URL tanımlı mı kontrol edin.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    console.error("[action] signInWithGoogle error:", error);
    return { error: error.message };
  }

  return { url: data.url };
}

export async function seedDemoDeals() {
  const supabase = createAdminClient();

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const firstUserId = authUsers?.users?.[0]?.id;
  if (!firstUserId) return { error: "Kullanıcı bulunamadı" };

  const now = new Date();
  const demoDeals = [
    { title: "Netflix Premium %50 İndirim", provider: "Netflix", category: "Yayın", end_at: new Date(now.getTime() + 3*24*60*60*1000).toISOString(), original_price: 399.99, deal_price: 199.99, currency: "TL", discount_percent: 50, image_url: "https://images.unsplash.com/photo-1574375927938-d5a98e8d7e28?w=600&h=340&fit=crop", external_url: "https://netflix.com", status: "approved", heat_score: 85, view_count: 340 },
    { title: "Steam Yaz İndirimleri — %80'e Varan", provider: "Steam", category: "Oyun", end_at: new Date(now.getTime() + 7*24*60*60*1000).toISOString(), currency: "TL", discount_percent: 80, image_url: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&h=340&fit=crop", external_url: "https://store.steampowered.com", status: "approved", heat_score: 120, view_count: 580 },
    { title: "PS Plus Yıllık -%30", provider: "PlayStation", category: "Oyun", end_at: new Date(now.getTime() + 5*24*60*60*1000).toISOString(), original_price: 1799.0, deal_price: 1259.0, currency: "TL", discount_percent: 30, image_url: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=340&fit=crop", external_url: "https://playstation.com", status: "approved", heat_score: 67, view_count: 215 },
    { title: "Amazon Prime -%40", provider: "Amazon", category: "Yayın", end_at: new Date(now.getTime() + 2*24*60*60*1000).toISOString(), original_price: 57.99, deal_price: 34.79, currency: "TL", discount_percent: 40, image_url: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=600&h=340&fit=crop", external_url: "https://amazon.com.tr", status: "approved", heat_score: 45, view_count: 178 },
    { title: "NordVPN -%70 + 3 Ay Hediye", provider: "NordVPN", category: "Güvenlik", end_at: new Date(now.getTime() + 14*24*60*60*1000).toISOString(), original_price: 259.99, deal_price: 77.99, currency: "TL", discount_percent: 70, image_url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=340&fit=crop", external_url: "https://nordvpn.com", status: "approved", heat_score: 95, view_count: 420 },
  ];

  const dealsToInsert = await Promise.all(
    demoDeals.map(async (d) => ({
      ...d,
      slug: await ensureUniqueDealSlug(supabase, d.title),
      created_by: firstUserId,
      start_at: now.toISOString(),
    }))
  );
  const { data, error } = await supabase.from("deals").insert(dealsToInsert).select("id, title");

  if (error) return { error: error.message };
  return { data, count: data?.length ?? 0 };
}

async function ensureAdmin(): Promise<{ error: string } | { supabase: Awaited<ReturnType<typeof createClient>> }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
  if (profile?.role !== "admin") return { error: "Yetkisiz." };
  return { supabase };
}

export async function adminUpdateDealStatus(dealId: string, status: "approved" | "rejected") {
  const result = await ensureAdmin();
  if ("error" in result) return { error: result.error };
  const { data: existingDeal, error: existingDealError } = await result.supabase
    .from("deals")
    .select("id, title, slug, status, created_by")
    .eq("id", dealId)
    .maybeSingle();
  if (existingDealError) return { error: existingDealError.message };
  if (!existingDeal) return { error: "Fırsat bulunamadı." };

  const wasApproved = existingDeal.status === "approved";
  const { error } = await result.supabase.from("deals").update({ status }).eq("id", dealId);
  if (error) return { error: error.message };

  let notificationErrorMessage: string | null = null;
  if (status === "approved" && !wasApproved && existingDeal.created_by) {
    const notificationTitle = "Fırsatın onaylandı";
    const notificationMessage = `"${existingDeal.title}" artık yayında.`;
    const notificationUrl = dealPath({ slug: existingDeal.slug });
    const admin = createAdminClient();

    const { error: notificationError } = await admin.from("notifications").insert({
      user_id: existingDeal.created_by,
      type: "deal_approved",
      title: notificationTitle,
      message: notificationMessage,
      payload: {
        deal_id: existingDeal.id,
        slug: existingDeal.slug,
        url: notificationUrl,
      },
    });

    if (notificationError) {
      // Bildirim hatası, status güncellemesini geri almamalı.
      console.error("[action] adminUpdateDealStatus notification error:", notificationError);
      notificationErrorMessage = notificationError.message;
    }
  }

  return { success: true, notificationError: notificationErrorMessage };
}

export async function adminDeleteDeal(dealId: string) {
  const result = await ensureAdmin();
  if ("error" in result) return { error: result.error };
  // Service role: onaylı dahil tüm durumlarda silme RLS’e takılmasın
  const admin = createAdminClient();
  const { error } = await admin.from("deals").delete().eq("id", dealId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function adminUpdateDeal(dealId: string, payload: { title?: string; end_at?: string; original_price?: number | null; deal_price?: number | null; discount_percent?: number | null; end_date_unknown?: boolean }) {
  const result = await ensureAdmin();
  if ("error" in result) return { error: result.error };
  const clean: Record<string, unknown> = {};
  if (payload.title !== undefined) clean.title = payload.title;
  if (payload.end_at !== undefined) clean.end_at = payload.end_at;
  if (payload.original_price !== undefined) clean.original_price = payload.original_price;
  if (payload.deal_price !== undefined) clean.deal_price = payload.deal_price;
  if (payload.discount_percent !== undefined) clean.discount_percent = payload.discount_percent;
  if (payload.end_date_unknown !== undefined) clean.end_date_unknown = payload.end_date_unknown;
  const { error } = await result.supabase.from("deals").update(clean).eq("id", dealId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function setEditorPick(dealId: string | null, quote?: string | null) {
  const result = await ensureAdmin();
  if ("error" in result) return { error: result.error };
  const supabase = result.supabase;
  const { data: { user } } = await supabase.auth.getUser();
  const { error: clearError } = await supabase
      .from("deals")
      .update({ is_editor_pick: false, editor_pick_quote: null, editor_pick_set_by: null })
      .eq("is_editor_pick", true);
  if (clearError) return { error: clearError.message };
  if (dealId) {
    const { data: deal } = await supabase.from("deals").select("id, status").eq("id", dealId).single();
    if (!deal || deal.status !== "approved") return { error: "Sadece onaylı fırsat editör seçimi yapılabilir." };
    const { error: setError } = await supabase
      .from("deals")
      .update({
        is_editor_pick: true,
        editor_pick_quote: quote ?? null,
        editor_pick_set_by: user?.id ?? null,
      })
      .eq("id", dealId);
    if (setError) return { error: setError.message };
  }
  return { success: true };
}

export async function updateEditorPickQuote(dealId: string, quote: string | null) {
  const result = await ensureAdmin();
  if ("error" in result) return { error: result.error };
  const { data: deal } = await result.supabase.from("deals").select("id, is_editor_pick").eq("id", dealId).single();
  if (!deal || !deal.is_editor_pick) return { error: "Sadece mevcut editör seçiminin yorumu güncellenebilir." };
  const { error } = await result.supabase.from("deals").update({ editor_pick_quote: quote }).eq("id", dealId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function adminUpsertHeroAnnouncement(payload: {
  id?: string;
  title: string;
  body?: string | null;
  image_url: string;
  image_storage_path?: string | null;
  link_url?: string | null;
  is_active: boolean;
  sort_order: number;
}) {
  const result = await ensureAdmin();
  if ("error" in result) return { error: result.error };
  const supabase = result.supabase;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const link = payload.link_url?.trim() || null;

  if (payload.id) {
    const { data: prev } = await supabase
      .from("hero_announcements")
      .select("image_storage_path")
      .eq("id", payload.id)
      .maybeSingle();

    const { error } = await supabase
      .from("hero_announcements")
      .update({
        title: payload.title.trim(),
        body: payload.body?.trim() || null,
        image_url: payload.image_url,
        image_storage_path: payload.image_storage_path ?? null,
        link_url: link,
        is_active: payload.is_active,
        sort_order: payload.sort_order,
      })
      .eq("id", payload.id);
    if (error) return { error: error.message };

    if (prev?.image_storage_path && prev.image_storage_path !== payload.image_storage_path) {
      try {
        await supabase.storage.from("deal-images").remove([prev.image_storage_path]);
      } catch {
        // ignore
      }
    }
  } else {
    const { error } = await supabase.from("hero_announcements").insert({
      title: payload.title.trim(),
      body: payload.body?.trim() || null,
      image_url: payload.image_url,
      image_storage_path: payload.image_storage_path ?? null,
      link_url: link,
      is_active: payload.is_active,
      sort_order: payload.sort_order,
      created_by: user.id,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/hero");
  return { success: true };
}

export async function adminDeleteHeroAnnouncement(id: string) {
  const result = await ensureAdmin();
  if ("error" in result) return { error: result.error };
  const supabase = result.supabase;
  const { data: row } = await supabase.from("hero_announcements").select("image_storage_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("hero_announcements").delete().eq("id", id);
  if (error) return { error: error.message };
  if (row?.image_storage_path) {
    try {
      await supabase.storage.from("deal-images").remove([row.image_storage_path]);
    } catch {
      // ignore
    }
  }
  revalidatePath("/");
  revalidatePath("/admin/hero");
  return { success: true };
}
