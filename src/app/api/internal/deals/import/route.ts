import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  resolveActorUserId,
  verifyImportApiKey,
} from "@/lib/internal/topla-import";
import type { DealStatus } from "@/lib/types/database";
import { ensureUniqueDealSlug } from "@/lib/deal-slug";

export const runtime = "nodejs";

const RESERVED = new Set(["actorKey", "metadata", "deal"]);

function parseDefaultStatus(): DealStatus {
  const s = process.env.TOPLA_IMPORT_DEFAULT_STATUS?.trim().toLowerCase();
  if (s === "pending" || s === "approved" || s === "review_needed") {
    return s;
  }
  return "approved";
}

function normalizeDealPayload(
  body: Record<string, unknown>
): { deal: Record<string, unknown>; actorKey: string; metadata: unknown } | { error: string } {
  const actorKey =
    typeof body.actorKey === "string" ? body.actorKey : typeof body.actor_key === "string" ? body.actor_key : "";
  if (!actorKey.trim()) {
    return { error: "actorKey is required" };
  }

  let nested: Record<string, unknown> = {};
  if (body.deal && typeof body.deal === "object" && body.deal !== null && !Array.isArray(body.deal)) {
    nested = { ...(body.deal as Record<string, unknown>) };
  } else {
    for (const [k, v] of Object.entries(body)) {
      if (!RESERVED.has(k)) nested[k] = v;
    }
  }

  const title = typeof nested.title === "string" ? nested.title.trim() : "";
  if (!title) {
    return { error: "deal.title is required" };
  }

  const endAt =
    typeof nested.end_at === "string"
      ? nested.end_at
      : typeof nested.endAt === "string"
        ? nested.endAt
        : "";
  if (!endAt.trim()) {
    return { error: "deal.end_at is required (ISO 8601)" };
  }
  const endDate = new Date(endAt);
  if (Number.isNaN(endDate.getTime())) {
    return { error: "deal.end_at must be a valid date" };
  }

  const provider =
    typeof nested.provider === "string" && nested.provider.trim()
      ? nested.provider.trim()
      : "—";
  const currency =
    typeof nested.currency === "string" && nested.currency.trim()
      ? nested.currency.trim()
      : "TL";

  const description =
    typeof nested.description === "string" ? nested.description.trim() || null : null;
  const category =
    typeof nested.category === "string" ? nested.category.trim() || null : null;
  const country =
    typeof nested.country === "string" && nested.country.trim()
      ? nested.country.trim()
      : "GLOBAL";

  const metadata = body.metadata;

  let finalDescription = description;
  if (metadata !== undefined && metadata !== null) {
    try {
      const metaStr = JSON.stringify(metadata);
      const suffix = `\n\n[import]\n${metaStr}`;
      finalDescription = (finalDescription ?? "") + suffix;
    } catch {
      // ignore non-serializable metadata
    }
  }

  const row: Record<string, unknown> = {
    title,
    description: finalDescription,
    provider,
    category,
    country,
    start_at:
      typeof nested.start_at === "string" && nested.start_at.trim()
        ? nested.start_at
        : typeof nested.startAt === "string" && nested.startAt.trim()
          ? nested.startAt
          : new Date().toISOString(),
    end_at: endDate.toISOString(),
    original_price:
      typeof nested.original_price === "number"
        ? nested.original_price
        : typeof nested.originalPrice === "number"
          ? nested.originalPrice
          : null,
    deal_price:
      typeof nested.deal_price === "number"
        ? nested.deal_price
        : typeof nested.dealPrice === "number"
          ? nested.dealPrice
          : null,
    currency,
    discount_percent:
      typeof nested.discount_percent === "number"
        ? nested.discount_percent
        : typeof nested.discountPercent === "number"
          ? nested.discountPercent
          : null,
    image_url:
      typeof nested.image_url === "string"
        ? nested.image_url || null
        : typeof nested.imageUrl === "string"
          ? nested.imageUrl || null
          : null,
    storage_path:
      typeof nested.storage_path === "string"
        ? nested.storage_path || null
        : typeof nested.storagePath === "string"
          ? nested.storagePath || null
          : null,
    external_url:
      typeof nested.external_url === "string"
        ? nested.external_url || null
        : typeof nested.externalUrl === "string"
          ? nested.externalUrl || null
          : null,
    coupon_code:
      typeof nested.coupon_code === "string"
        ? nested.coupon_code || null
        : typeof nested.couponCode === "string"
          ? nested.couponCode || null
          : null,
    coupon_description:
      typeof nested.coupon_description === "string"
        ? nested.coupon_description || null
        : typeof nested.couponDescription === "string"
          ? nested.couponDescription || null
          : null,
    coupon_expiry:
      typeof nested.coupon_expiry === "string"
        ? nested.coupon_expiry || null
        : typeof nested.couponExpiry === "string"
          ? nested.couponExpiry || null
          : null,
    end_date_unknown: nested.end_date_unknown === true || nested.endDateUnknown === true,
    status: parseDefaultStatus(),
    heat_score: 0,
    view_count: 0,
  };

  const statusOverride = nested.status;
  if (
    statusOverride === "pending" ||
    statusOverride === "approved" ||
    statusOverride === "review_needed"
  ) {
    row.status = statusOverride;
  }

  return { deal: row, actorKey: actorKey.trim(), metadata };
}

export async function POST(request: Request) {
  if (!verifyImportApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = normalizeDealPayload(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { userId, error: actorErr } = resolveActorUserId(parsed.actorKey);
  if (actorErr === "missing_actor_map") {
    return NextResponse.json(
      {
        error: "Import actor mapping is not configured",
        hint: "Set TOPLA_IMPORT_ACTOR_MAP or TOPLA_IMPORT_DEFAULT_BOT_USER_ID + TOPLA_IMPORT_ALLOWED_ACTORS",
      },
      { status: 503 }
    );
  }
  if (actorErr === "invalid_actor_map_json") {
    return NextResponse.json(
      { error: "TOPLA_IMPORT_ACTOR_MAP is not valid JSON" },
      { status: 503 }
    );
  }
  if (!userId) {
    return NextResponse.json(
      { error: "actorKey is not allowed", actorKey: parsed.actorKey },
      { status: 403 }
    );
  }

  const supabase = createAdminClient();
  const slug = await ensureUniqueDealSlug(supabase, parsed.deal.title as string);
  const insertPayload = {
    ...parsed.deal,
    slug,
    created_by: userId,
  };
  const { data, error } = await supabase
    .from("deals")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    console.error("[internal/import] insert error:", error);
    return NextResponse.json(
      { error: "Failed to create deal", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: data?.id }, { status: 201 });
}
