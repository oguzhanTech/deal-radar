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
  const demoDeals = [
    {
      title: "Netflix Premium %50 İndirim",
      description: "Netflix Premium planı yarı fiyatına! 4K HDR kalitesinde 4 cihazda izle.",
      provider: "Netflix",
      category: "Yayın",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: 399.99,
      deal_price: 199.99,
      currency: "TRY",
      discount_percent: 50,
      image_url: "https://images.unsplash.com/photo-1574375927938-d5a98e8d7e28?w=600&h=340&fit=crop",
      external_url: "https://netflix.com",
      status: "approved",
      heat_score: 85,
      view_count: 340,
    },
    {
      title: "Steam Yaz İndirimleri — %80'e Varan İndirim",
      description: "Efsane Steam Yaz İndirimleri başladı! Binlerce oyunda %80'e varan indirim.",
      provider: "Steam",
      category: "Oyun",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: null,
      deal_price: null,
      currency: "TRY",
      discount_percent: 80,
      image_url: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&h=340&fit=crop",
      external_url: "https://store.steampowered.com",
      status: "approved",
      heat_score: 120,
      view_count: 580,
    },
    {
      title: "PS Plus Yıllık -%30",
      description: "PlayStation Plus yıllık abonelik %30 indirimli. Yüzlerce PS4 ve PS5 oyununa eriş.",
      provider: "PlayStation",
      category: "Oyun",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: 1799.0,
      deal_price: 1259.0,
      currency: "TRY",
      discount_percent: 30,
      image_url: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=340&fit=crop",
      external_url: "https://playstation.com",
      status: "approved",
      heat_score: 67,
      view_count: 215,
    },
    {
      title: "Amazon Prime -%40",
      description: "Amazon Prime aboneliğinde %40 indirim. Ücretsiz kargo, Prime Video dahil.",
      provider: "Amazon",
      category: "Yayın",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: 57.99,
      deal_price: 34.79,
      currency: "TRY",
      discount_percent: 40,
      image_url: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=600&h=340&fit=crop",
      external_url: "https://amazon.com.tr",
      status: "approved",
      heat_score: 45,
      view_count: 178,
    },
    {
      title: "NordVPN -%70 + 3 Ay Hediye",
      description: "NordVPN 2 yıllık plan %70 indirimli + 3 ay hediye.",
      provider: "NordVPN",
      category: "Güvenlik",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: 259.99,
      deal_price: 77.99,
      currency: "TRY",
      discount_percent: 70,
      image_url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=340&fit=crop",
      external_url: "https://nordvpn.com",
      status: "approved",
      heat_score: 95,
      view_count: 420,
    },
  ];

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const firstUserId = authUsers?.users?.[0]?.id;

  await supabase.from("deals").delete().in("title", demoDeals.map(d => d.title));

  const dealsToInsert = demoDeals.map(d => ({
    ...d,
    created_by: firstUserId || "00000000-0000-0000-0000-000000000000",
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
