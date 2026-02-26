"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    .upload(path, bytes, { contentType: file.type || "image/jpeg" });

  if (error) {
    console.error("[action] uploadDealImage error:", error);
    return { error: error.message };
  }

  const { data: urlData } = supabase.storage.from("deal-images").getPublicUrl(path);
  return { url: urlData.publicUrl, path };
}

export async function createDeal(payload: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Oturum bulunamadı. Tekrar giriş yapın." };
  }

  const insertPayload = { ...payload, created_by: user.id };

  const { data, error } = await supabase
    .from("deals")
    .insert(insertPayload)
    .select("id")
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

  return { success: true };
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

export async function postComment(dealId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Oturum bulunamadı." };
  }

  const { data, error } = await supabase
    .from("deal_comments")
    .insert({ deal_id: dealId, user_id: user.id, content })
    .select("*, profile:profiles(display_name, trust_score)")
    .single();

  if (error) {
    console.error("[action] postComment error:", error);
    return { error: error.message };
  }

  return { data };
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
    await supabase.from("deal_saves").delete().eq("user_id", user.id).eq("deal_id", dealId);
    return { saved: false };
  } else {
    await supabase.from("deal_saves").insert({ user_id: user.id, deal_id: dealId });
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

export async function sendMagicLink(email: string, redirectOrigin: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${redirectOrigin}/auth/callback`,
    },
  });

  if (error) {
    console.error("[action] sendMagicLink error:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function signInWithGoogleAction(redirectOrigin: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${redirectOrigin}/auth/callback`,
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
    { title: "Netflix Premium %50 İndirim", provider: "Netflix", category: "Yayın", end_at: new Date(now.getTime() + 3*24*60*60*1000).toISOString(), original_price: 399.99, deal_price: 199.99, currency: "TRY", discount_percent: 50, image_url: "https://images.unsplash.com/photo-1574375927938-d5a98e8d7e28?w=600&h=340&fit=crop", external_url: "https://netflix.com", status: "approved", heat_score: 85, view_count: 340 },
    { title: "Steam Yaz İndirimleri — %80'e Varan", provider: "Steam", category: "Oyun", end_at: new Date(now.getTime() + 7*24*60*60*1000).toISOString(), currency: "TRY", discount_percent: 80, image_url: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&h=340&fit=crop", external_url: "https://store.steampowered.com", status: "approved", heat_score: 120, view_count: 580 },
    { title: "PS Plus Yıllık -%30", provider: "PlayStation", category: "Oyun", end_at: new Date(now.getTime() + 5*24*60*60*1000).toISOString(), original_price: 1799.0, deal_price: 1259.0, currency: "TRY", discount_percent: 30, image_url: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=340&fit=crop", external_url: "https://playstation.com", status: "approved", heat_score: 67, view_count: 215 },
    { title: "Amazon Prime -%40", provider: "Amazon", category: "Yayın", end_at: new Date(now.getTime() + 2*24*60*60*1000).toISOString(), original_price: 57.99, deal_price: 34.79, currency: "TRY", discount_percent: 40, image_url: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=600&h=340&fit=crop", external_url: "https://amazon.com.tr", status: "approved", heat_score: 45, view_count: 178 },
    { title: "NordVPN -%70 + 3 Ay Hediye", provider: "NordVPN", category: "Güvenlik", end_at: new Date(now.getTime() + 14*24*60*60*1000).toISOString(), original_price: 259.99, deal_price: 77.99, currency: "TRY", discount_percent: 70, image_url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=340&fit=crop", external_url: "https://nordvpn.com", status: "approved", heat_score: 95, view_count: 420 },
  ];

  const dealsToInsert = demoDeals.map(d => ({ ...d, created_by: firstUserId, start_at: now.toISOString() }));
  const { data, error } = await supabase.from("deals").insert(dealsToInsert).select("id, title");

  if (error) return { error: error.message };
  return { data, count: data?.length ?? 0 };
}
