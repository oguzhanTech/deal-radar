import { ImageResponse } from "@vercel/og";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dealId = searchParams.get("id");
  const mode = searchParams.get("mode");
  const count = searchParams.get("count");

  if (mode === "summary") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
            color: "white",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ fontSize: 72, marginBottom: 12, display: "flex" }}>🔥</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, display: "flex" }}>
            {count || "5"} fırsat kaydettim
          </div>
          <div style={{ fontSize: 20, opacity: 0.9, display: "flex" }}>bu hafta biten fırsatlar — Topla</div>
          <div
            style={{
              marginTop: 32,
              fontSize: 16,
              background: "rgba(255,255,255,0.2)",
              padding: "8px 20px",
              borderRadius: 999,
              display: "flex",
            }}
          >
            topla.app
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  if (!dealId) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            color: "white",
            fontSize: 48,
            fontWeight: 800,
            fontFamily: "sans-serif",
          }}
        >
          Topla
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const supabase = createAdminClient();
  const { data: deal } = await supabase.from("deals").select("*").eq("id", dealId).single();

  if (!deal) {
    return new Response("Fırsat bulunamadı", { status: 404 });
  }

  const timeLeft = new Date(deal.end_at).getTime() - Date.now();
  const daysLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor((timeLeft / (1000 * 60 * 60)) % 24));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #1e1b4b, #312e81)",
          color: "white",
          fontFamily: "sans-serif",
          padding: 48,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.15)",
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: 16,
                  fontWeight: 600,
                  display: "flex",
                }}
              >
                {deal.provider}
              </div>
              {deal.discount_percent && (
                <div
                  style={{
                    background: "#22c55e",
                    padding: "6px 14px",
                    borderRadius: 999,
                    fontSize: 16,
                    fontWeight: 700,
                    display: "flex",
                  }}
                >
                  -%{deal.discount_percent}
                </div>
              )}
            </div>

            <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.2, display: "flex", maxWidth: 700 }}>
              {deal.title}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 14, opacity: 0.7, display: "flex" }}>Kalan süre</div>
              <div style={{ fontSize: 32, fontWeight: 700, display: "flex" }}>
                {timeLeft > 0 ? `${daysLeft}g ${hoursLeft}s` : "Süre doldu"}
              </div>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                padding: "8px 20px",
                borderRadius: 999,
                fontSize: 18,
                fontWeight: 600,
                display: "flex",
              }}
            >
              Topla
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
