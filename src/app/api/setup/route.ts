import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = createAdminClient();

  const { error: schemaError } = await supabase.rpc("exec_sql", {
    sql: SCHEMA_SQL,
  });

  const { error: tableCheck } = await supabase.from("deals").select("id").limit(1);

  if (tableCheck) {
    return NextResponse.json({
      error: "Tablolar bulunamadı. Supabase SQL Editor'da migration SQL'ini çalıştır.",
      instructions: "Supabase Dashboard > SQL Editor > supabase/migrations/001_initial_schema.sql dosyasını yapıştır > Çalıştır",
    }, { status: 400 });
  }

  const now = new Date();

  // Replace: eskileri de temizleyelim ki ekranda sadece app store seti görünsün.
  const oldDemoTitles = [
    "Netflix Premium %50 İndirim",
    "Steam Yaz İndirimleri — %80'e Varan İndirim",
    "PS Plus Yıllık -%30",
    "Amazon Prime -%40",
    "NordVPN -%70 + 3 Ay Hediye",
  ];

  const demoDeals = [
    {
      title: "[APPSTORE] Spotify Premium %25 Kuponla",
      description:
        "Kuponla Spotify Premium daha uygun! 3 ay süper fiyat. (Kupon süresi dolmamış olanlar görünecek.)",
      provider: "Spotify",
      category: "Dijital Üyelikler",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: 199.99,
      deal_price: 149.99,
      currency: "TL",
      discount_percent: 25,
      image_url: "https://source.unsplash.com/bE3_aFt85Y8/600x340",
      external_url: "https://www.spotify.com/tr/premium/",
      coupon_code: "SPOT25",
      coupon_description: "SPOT25 kuponu ile %25 indirim",
      coupon_expiry: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "approved",
      heat_score: 110,
      view_count: 520,
    },
    {
      title: "[APPSTORE] Steam Yaz İndirimleri — %80'e Varan",
      description: "Steam Yaz İndirimleri başladı! En popüler oyunlarda efsane indirimler.",
      provider: "Steam",
      category: "Oyun",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: null,
      deal_price: null,
      currency: "TL",
      discount_percent: 80,
      image_url: "https://source.unsplash.com/KhwnoIJbdEA/600x340",
      external_url: "https://store.steampowered.com",
      coupon_code: null,
      coupon_description: null,
      coupon_expiry: null,
      status: "approved",
      heat_score: 140,
      view_count: 820,
    },
    {
      title: "[APPSTORE] Market Fırsatı — Sepette %15'e Varan",
      description: "Sezonun en iyi market fırsatları! Sepette indirim fırsatı.",
      provider: "Market",
      category: "Market",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: 120.0,
      deal_price: 102.0,
      currency: "TL",
      discount_percent: 15,
      image_url: "https://source.unsplash.com/xo7YE7Mlycg/600x340",
      external_url: "https://www.google.com/search?q=market+kampanya",
      coupon_code: null,
      coupon_description: null,
      coupon_expiry: null,
      status: "approved",
      heat_score: 72,
      view_count: 310,
    },
    {
      title: "[APPSTORE] Yurtiçi Seyahat — %30 İndirimli",
      description: "Bilet fırsatları! Erken rezervasyonla %30'a varan indirim.",
      provider: "Seyahat",
      category: "Seyahat",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: 999.0,
      deal_price: 699.0,
      currency: "TL",
      discount_percent: 30,
      image_url: "https://source.unsplash.com/PRUoak89kCQ/600x340",
      external_url: "https://www.google.com/search?q=seyahat+indirim",
      coupon_code: null,
      coupon_description: null,
      coupon_expiry: null,
      status: "approved",
      heat_score: 60,
      view_count: 205,
    },
    {
      title: "[APPSTORE] Teknoloji Günleri — %35 İndirim",
      description: "Laptop/aksesuar fırsatları! Teknoloji günlerinde %35'e varan indirim.",
      provider: "Teknoloji",
      category: "Teknoloji",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: 29999.0,
      deal_price: 19499.0,
      currency: "TL",
      discount_percent: 35,
      image_url: "https://source.unsplash.com/X9qKtLqucCo/600x340",
      external_url: "https://www.google.com/search?q=teknoloji+indirim",
      coupon_code: null,
      coupon_description: null,
      coupon_expiry: null,
      status: "approved",
      heat_score: 95,
      view_count: 440,
    },
  ];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id")
    .limit(200);

  const profileUserIds = (profiles ?? []).map((p) => p.user_id).filter(Boolean);

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const firstUserId = authUsers?.users?.[0]?.id;

  const allTitlesToReplace = [...oldDemoTitles, ...demoDeals.map((d) => d.title)];
  await supabase.from("deals").delete().in("title", allTitlesToReplace);

  const pickRandomUserId = () => {
    if (profileUserIds.length) {
      return profileUserIds[Math.floor(Math.random() * profileUserIds.length)]!;
    }
    return firstUserId || "00000000-0000-0000-0000-000000000000";
  };

  const dealsToInsert = demoDeals.map((d) => ({
    ...d,
    created_by: pickRandomUserId(),
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("deals")
    .insert(dealsToInsert)
    .select("id, title");

  if (insertError) {
    return NextResponse.json({
      error: "Fırsatlar yüklenemedi",
      details: insertError.message,
      hint: insertError.hint || "Migration SQL'ini çalıştırdığından emin ol",
    }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `${inserted?.length ?? 0} demo fırsat yüklendi`,
    deals: inserted,
  });
}

const SCHEMA_SQL = "SELECT 1";
