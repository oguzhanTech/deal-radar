import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/server";

type SortOption = "trending" | "popular" | "new";

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
      } else {
        query = query.order("created_at", { ascending: false });
      }
      query = query.limit(50);
    }

    const { data } = await query;
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
