import webpush from "web-push";

export interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body?: string;
  url?: string;
}

let vapidSet = false;

function ensureVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set for push");
  }
  if (!vapidSet) {
    webpush.setVapidDetails("mailto:support@topla.online", publicKey, privateKey);
    vapidSet = true;
  }
}

/**
 * Send a Web Push notification to one subscription (free, no third-party).
 * Used by cron reminder job.
 */
export async function sendWebPush(
  subscription: PushSubscriptionRow,
  payload: PushPayload
): Promise<void> {
  ensureVapid();
  const payloadStr = JSON.stringify(payload);
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    payloadStr,
    {
      TTL: 60 * 60 * 24,
    }
  );
}
