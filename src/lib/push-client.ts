export type PushState =
  | "checking"
  | "on"
  | "off"
  | "denied"
  | "ios"
  | "unsupported"
  | "failed";

const isIos = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function supported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function vapidKey(): Uint8Array<ArrayBuffer> {
  const base64 = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function currentPushState(): Promise<PushState> {
  if (!supported()) return isIos() ? "ios" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission !== "granted") return "off";
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  return subscription ? "on" : "off";
}

async function subscribe(billToken: string): Promise<PushState> {
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey() }));
  const response = await fetch(`/api/bills/${billToken}/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  return response.ok ? "on" : "failed";
}

// Call straight from a tap handler: Safari only shows the permission prompt inside a user gesture.
export function enablePush(billToken: string): Promise<PushState> {
  if (!supported()) return Promise.resolve(isIos() ? "ios" : "unsupported");
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return Promise.resolve("unsupported");
  return Notification.requestPermission()
    .then((permission) => (permission === "granted" ? subscribe(billToken) : permission === "denied" ? "denied" : "off"))
    .catch(() => "failed" as const);
}

// A bill reopened after permission was granted must re-send its subscription, since each bill has its own token.
export async function resubscribeIfGranted(billToken: string): Promise<PushState> {
  if (!supported() || Notification.permission !== "granted" || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return currentPushState();
  return subscribe(billToken).catch(() => "failed" as const);
}
