import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReminderEmail } from "@/lib/email";

const REMINDER_WINDOWS = [
  { key: "3d", ms: 3 * 24 * 60 * 60 * 1000, label: "3 days" },
  { key: "1d", ms: 1 * 24 * 60 * 60 * 1000, label: "1 day" },
  { key: "6h", ms: 6 * 60 * 60 * 1000, label: "6 hours" },
  { key: "1h", ms: 1 * 60 * 60 * 1000, label: "1 hour" },
];

// 15-minute buffer for cron interval
const BUFFER_MS = 16 * 60 * 1000;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = Date.now();
  let sent = 0;

  // Get all active saves with their deals and user emails
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
    if (endTime <= now) continue; // already expired

    const timeUntilEnd = endTime - now;
    const sentReminders = (save.sent_reminders as Record<string, boolean>) || {};

    for (const window of REMINDER_WINDOWS) {
      const isEnabled = (save.reminder_settings as Record<string, boolean>)?.[window.key];
      const alreadySent = sentReminders[window.key];

      // Send if enabled, not yet sent, and we're within the window
      if (isEnabled && !alreadySent && timeUntilEnd <= window.ms && timeUntilEnd > (window.ms - BUFFER_MS)) {
        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(save.user_id);
        const email = userData?.user?.email;

        if (email) {
          const dealUrl = `${process.env.NEXT_PUBLIC_APP_URL}/deal/${deal.id}`;

          // Send email
          await sendReminderEmail({
            to: email,
            dealTitle: deal.title,
            dealId: deal.id,
            timeLeft: window.label,
            dealUrl,
          });

          // Create in-app notification
          await supabase.from("notifications").insert({
            user_id: save.user_id,
            type: "reminder",
            title: `"${deal.title}" ends in ${window.label}!`,
            message: "Don't miss this deal — act now before it expires.",
            payload: { deal_id: deal.id },
          });

          // Mark as sent
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
  }

  return NextResponse.json({ sent, timestamp: new Date().toISOString() });
}
