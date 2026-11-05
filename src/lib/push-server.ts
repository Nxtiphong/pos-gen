import webpush, { WebPushError, type PushSubscription } from "web-push";
import { adminDb } from "./firebase/admin";
import { SHOP_NAME } from "./shop";

let configured = false;

function configure(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", publicKey, privateKey);
  configured = true;
  return true;
}

export function parseSubscription(raw: unknown): PushSubscription | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { endpoint, keys } = raw as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) return null;
  if (typeof keys?.p256dh !== "string" || typeof keys?.auth !== "string") return null;
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } };
}

export type PushOutcome = "sent" | "no_subscription" | "expired" | "not_configured" | "failed";

export async function sendReadyPush(publicToken: string, orderNo: string): Promise<PushOutcome> {
  if (!configure()) return "not_configured";
  const ref = adminDb().doc(`pushSubscriptions/${publicToken}`);
  const snap = await ref.get();
  const subscription = parseSubscription(snap.get("subscription"));
  if (!subscription) return "no_subscription";

  const payload = JSON.stringify({
    title: `ของพร้อมแล้ว! · ${orderNo}`,
    body: `มารับที่หน้าร้าน ${SHOP_NAME} ได้เลย`,
    tag: `order-${orderNo}`,
    url: `/b/${publicToken}`,
  });
  try {
    await webpush.sendNotification(subscription, payload, { TTL: 60 * 30, urgency: "high" });
    return "sent";
  } catch (error) {
    // 404/410 mean the browser dropped the subscription; keeping it would fail on every notify.
    if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) {
      await ref.delete();
      return "expired";
    }
    return "failed";
  }
}
