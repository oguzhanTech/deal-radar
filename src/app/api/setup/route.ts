import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = createAdminClient();

  // Create tables via raw SQL
  const { error: schemaError } = await supabase.rpc("exec_sql", {
    sql: SCHEMA_SQL,
  });

  // If rpc doesn't exist, try direct table creation approach
  // Tables might already exist - that's fine, we'll just seed

  // Check if deals table exists by trying a query
  const { error: tableCheck } = await supabase.from("deals").select("id").limit(1);

  if (tableCheck) {
    // Tables don't exist - need to create via SQL Editor in Supabase Dashboard
    return NextResponse.json({
      error: "Tables not found. Please run the migration SQL in your Supabase SQL Editor first.",
      instructions: "Go to your Supabase Dashboard > SQL Editor > paste the contents of supabase/migrations/001_initial_schema.sql > Run",
    }, { status: 400 });
  }

  // Seed demo deals
  const now = new Date();
  const demoDeals = [
    {
      title: "Netflix Premium 50% Off",
      description: "Get Netflix Premium plan at half price! Stream in 4K HDR on up to 4 devices. Limited time offer.",
      provider: "Netflix",
      category: "Streaming",
      country: "GLOBAL",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: 22.99,
      deal_price: 11.49,
      currency: "USD",
      discount_percent: 50,
      image_url: "https://images.unsplash.com/photo-1574375927938-d5a98e8d7e28?w=600&h=340&fit=crop",
      external_url: "https://netflix.com",
      status: "approved",
      heat_score: 85,
      view_count: 340,
    },
    {
      title: "Steam Summer Sale — Up to 80% Off",
      description: "The legendary Steam Summer Sale is here! Thousands of games discounted up to 80%.",
      provider: "Steam",
      category: "Gaming",
      country: "GLOBAL",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: null,
      deal_price: null,
      currency: "USD",
      discount_percent: 80,
      image_url: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&h=340&fit=crop",
      external_url: "https://store.steampowered.com",
      status: "approved",
      heat_score: 120,
      view_count: 580,
    },
    {
      title: "PS Plus Annual -30%",
      description: "PlayStation Plus yearly subscription at 30% off. Access hundreds of PS4 and PS5 games.",
      provider: "PlayStation",
      category: "Gaming",
      country: "US",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: 79.99,
      deal_price: 55.99,
      currency: "USD",
      discount_percent: 30,
      image_url: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=340&fit=crop",
      external_url: "https://playstation.com",
      status: "approved",
      heat_score: 67,
      view_count: 215,
    },
    {
      title: "Amazon Prime -40% (Turkey)",
      description: "Amazon Prime subscription at 40% discount for Turkey. Free shipping, Prime Video, and more.",
      provider: "Amazon",
      category: "Streaming",
      country: "TR",
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
      title: "X Premium -50%",
      description: "X (formerly Twitter) Premium at half price! Get verified badge, edit posts, and ad-free timeline.",
      provider: "X (Twitter)",
      category: "Social",
      country: "GLOBAL",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: 8.0,
      deal_price: 4.0,
      currency: "USD",
      discount_percent: 50,
      image_url: "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=600&h=340&fit=crop",
      external_url: "https://x.com",
      status: "approved",
      heat_score: 38,
      view_count: 145,
    },
    {
      title: "Spotify Family -25% (Germany)",
      description: "Spotify Family plan for up to 6 accounts at 25% off. Premium features for everyone.",
      provider: "Spotify",
      category: "Music",
      country: "DE",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: 16.99,
      deal_price: 12.74,
      currency: "EUR",
      discount_percent: 25,
      image_url: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=600&h=340&fit=crop",
      external_url: "https://spotify.com",
      status: "approved",
      heat_score: 55,
      view_count: 230,
    },
    {
      title: "Adobe Creative Cloud -40%",
      description: "Full Adobe Creative Cloud suite at 40% off. Photoshop, Illustrator, Premiere Pro and more.",
      provider: "Adobe",
      category: "Software",
      country: "US",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: 59.99,
      deal_price: 35.99,
      currency: "USD",
      discount_percent: 40,
      image_url: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=600&h=340&fit=crop",
      external_url: "https://adobe.com",
      status: "approved",
      heat_score: 72,
      view_count: 310,
    },
    {
      title: "NordVPN -70% + 3 Months Free",
      description: "NordVPN 2-year plan at 70% off plus 3 extra months free. Military-grade encryption.",
      provider: "NordVPN",
      category: "Security",
      country: "GLOBAL",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: 11.99,
      deal_price: 3.59,
      currency: "USD",
      discount_percent: 70,
      image_url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=340&fit=crop",
      external_url: "https://nordvpn.com",
      status: "approved",
      heat_score: 95,
      view_count: 420,
    },
    {
      title: "Microsoft 365 Family -35%",
      description: "Microsoft 365 Family for up to 6 people. Word, Excel, PowerPoint, OneDrive 1TB per person.",
      provider: "Microsoft",
      category: "Software",
      country: "GLOBAL",
      start_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      end_at: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: 99.99,
      deal_price: 64.99,
      currency: "USD",
      discount_percent: 35,
      image_url: "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=600&h=340&fit=crop",
      external_url: "https://microsoft.com",
      status: "approved",
      heat_score: 110,
      view_count: 490,
    },
    {
      title: "Apple Music Student -50%",
      description: "Apple Music student plan at 50% off. Over 100 million songs, spatial audio, lossless quality.",
      provider: "Apple",
      category: "Music",
      country: "GLOBAL",
      start_at: now.toISOString(),
      end_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      original_price: 10.99,
      deal_price: 5.49,
      currency: "USD",
      discount_percent: 50,
      image_url: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&h=340&fit=crop",
      external_url: "https://apple.com/music",
      status: "approved",
      heat_score: 30,
      view_count: 95,
    },
  ];

  // Get an admin user to use as created_by, or create deals without it
  // First, check if there's any user
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const firstUserId = authUsers?.users?.[0]?.id;

  // Delete existing demo deals (to allow re-seeding)
  await supabase.from("deals").delete().in("title", demoDeals.map(d => d.title));

  // Insert deals
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
      error: "Failed to seed deals",
      details: insertError.message,
      hint: insertError.hint || "Make sure you ran the migration SQL first",
    }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Seeded ${inserted?.length ?? 0} demo deals`,
    deals: inserted,
  });
}

const SCHEMA_SQL = "SELECT 1"; // Placeholder - actual schema is in migration file
