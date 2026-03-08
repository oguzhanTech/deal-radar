import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const REMINDER_WINDOWS = [
  { key: "3d", ms: 3 * 24 * 60 * 60 * 1000, label: "3 gün" },
  { key: "1d", ms: 1 * 24 * 60 * 60 * 1000, label: "1 gün" },
  { key: "6h", ms: 6 * 60 * 60 * 1000, label: "6 saat" },
  { key: "1h", ms: 1 * 60 * 60 * 1000, label: "1 saat" },
];

const BUFFER_MS = 16 * 60 * 1000;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = Date.now();
  let sent = 0;

  const { data: saves } = await supabase
    .from("deal_saves")
    .select(`
      user_id,
      deal_id,
      reminder_settings,
      sent_reminders,
      deal:deals(id, title, end_at, status)
    `)
    .not("deal.end_at", "is", null);

  if (!saves) return NextResponse.json({ sent: 0 });

  for (const save of saves) {
    const deal = save.deal as unknown as { id: string; title: string; end_at: string; status: string } | null;
    if (!deal || deal.status !== "approved") continue;

    const endTime = new Date(deal.end_at).getTime();
    if (endTime <= now) continue;

    const timeUntilEnd = endTime - now;
    const sentReminders = (save.sent_reminders as Record<string, boolean>) || {};

    for (const window of REMINDER_WINDOWS) {
      const isEnabled = (save.reminder_settings as Record<string, boolean>)?.[window.key];
      const alreadySent = sentReminders[window.key];

      if (isEnabled && !alreadySent && timeUntilEnd <= window.ms && timeUntilEnd > (window.ms - BUFFER_MS)) {
        const dealUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/deal/${deal.id}`;
        const title = `"${deal.title}" ${window.label} sonra bitiyor!`;
        const message = "Bu fırsatı kaçırma — süresi dolmadan yakala.";

        await supabase.from("notifications").insert({
          user_id: save.user_id,
          type: "reminder",
          title,
          message,
          payload: { deal_id: deal.id },
        });

        if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
          const { data: subscriptions } = await supabase
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth")
            .eq("user_id", save.user_id);

          if (subscriptions?.length) {
            const { sendWebPush } = await import("@/lib/push");
            for (const sub of subscriptions) {
              try {
                await sendWebPush(
                  { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
                  { title, body: message, url: dealUrl }
                );
              } catch {
                // Subscription may be invalid; skip
              }
            }
          }
        }

        await supabase
          .from("deal_saves")
          .update({
            sent_reminders: { ...sentReminders, [window.key]: true },
          })
          .eq("user_id", save.user_id)
          .eq("deal_id", save.deal_id);

        sent++;
      }
    }
  }

  return NextResponse.json({ sent, timestamp: new Date().toISOString() });
}
