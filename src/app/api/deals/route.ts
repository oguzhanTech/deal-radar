import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/server";

type SortOption = "trending" | "popular" | "new" | "discount";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids"); // comma-separated UUIDs for Radarım
    const sort = (searchParams.get("sort") as SortOption) || "new";
    const q = searchParams.get("q")?.trim() ?? "";
    const category = searchParams.get("category");

    const supabase = await createAnonClient();
    let query = supabase
      .from("deals")
      .select("*")
      .eq("status", "approved");

    if (idsParam) {
      const ids = idsParam.split(",").filter(Boolean);
      if (ids.length) query = query.in("id", ids);
    }
    if (q) {
      query = query.or(`title.ilike.%${q}%,provider.ilike.%${q}%,category.ilike.%${q}%`);
    }
    if (category) {
      query = query.eq("category", category);
    }

    if (!idsParam) {
      if (sort === "trending") {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", sevenDaysAgo).order("heat_score", { ascending: false });
      } else if (sort === "popular") {
        query = query.order("heat_score", { ascending: false });
      } else if (sort === "discount") {
        query = query.gt("end_at", new Date().toISOString()).order("discount_percent", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }
      query = query.limit(50);
    }

    const { data } = await query;
    let deals = (data ?? []) as { created_by: string; discount_percent?: number | null }[];
    if (!idsParam && sort === "discount") {
      deals = [...deals].sort((a, b) => (b.discount_percent ?? -1) - (a.discount_percent ?? -1)).slice(0, 50);
    }

    if (!deals.length) {
      return NextResponse.json([]);
    }

    // Attach creator display_name for compact/home/search widgets
    const userIds = Array.from(new Set(deals.map((d) => d.created_by)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    const nameMap =
      profiles?.reduce<Record<string, string | null>>((acc, p) => {
        acc[p.user_id] = p.display_name ?? null;
        return acc;
      }, {}) ?? {};

    const withCreators = deals.map((d) => ({
      ...d,
      profile: { display_name: nameMap[d.created_by] ?? null },
    }));

    return NextResponse.json(withCreators);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
