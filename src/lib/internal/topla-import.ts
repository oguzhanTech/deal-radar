/**
 * Internal deal import: Bearer key + actorKey → bot user resolution.
 * See docs/INTERNAL_IMPORT.md
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

export function verifyImportApiKey(request: Request): boolean {
  const secret = process.env.TOPLA_IMPORT_API_KEY;
  if (!secret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export type ResolveActorError =
  | "missing_actor_map"
  | "actor_not_allowed"
  | "invalid_actor_map_json";

/**
 * Resolves `actorKey` to `auth.users` UUID for `created_by`.
 *
 * Option A — per-actor mapping (recommended for multiple bots):
 *   `TOPLA_IMPORT_ACTOR_MAP={"topla_trendyol_bot":"<uuid>",...}`
 *
 * Option B — single bot user + allowlist:
 *   `TOPLA_IMPORT_DEFAULT_BOT_USER_ID=<uuid>`
 *   `TOPLA_IMPORT_ALLOWED_ACTORS=topla_trendyol_bot,other_actor`
 */
export function resolveActorUserId(actorKey: string): {
  userId: string | null;
  error: ResolveActorError | null;
} {
  const key = actorKey.trim();
  if (!key) {
    return { userId: null, error: "actor_not_allowed" };
  }

  const mapJson = process.env.TOPLA_IMPORT_ACTOR_MAP?.trim();
  if (mapJson) {
    try {
      const parsed = JSON.parse(mapJson) as unknown;
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return { userId: null, error: "invalid_actor_map_json" };
      }
      const raw = (parsed as Record<string, unknown>)[key];
      const uid = typeof raw === "string" ? raw : null;
      if (uid && isUuid(uid)) {
        return { userId: uid, error: null };
      }
      return { userId: null, error: "actor_not_allowed" };
    } catch {
      return { userId: null, error: "invalid_actor_map_json" };
    }
  }

  const defaultUid = process.env.TOPLA_IMPORT_DEFAULT_BOT_USER_ID?.trim();
  const allowedRaw = process.env.TOPLA_IMPORT_ALLOWED_ACTORS?.trim();
  if (!defaultUid || !allowedRaw) {
    return { userId: null, error: "missing_actor_map" };
  }
  if (!isUuid(defaultUid)) {
    return { userId: null, error: "missing_actor_map" };
  }

  const allowed = new Set(
    allowedRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  if (!allowed.has(key)) {
    return { userId: null, error: "actor_not_allowed" };
  }
  return { userId: defaultUid, error: null };
}
