import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { sendReadyPush } from "@/lib/push-server";

export const runtime = "nodejs";

async function isStaff(request: Request): Promise<boolean> {
  const idToken = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!idToken) return false;
  const decoded = await adminAuth()
    .verifyIdToken(idToken)
    .catch(() => null);
  return decoded?.staff === true;
}

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  if (!(await isStaff(request))) return Response.json({ error: "forbidden" }, { status: 403 });

  const { orderId } = await params;
  const order = await adminDb().doc(`orders/${orderId}`).get();
  if (!order.exists) return Response.json({ error: "not_found" }, { status: 404 });
  if (order.get("status") !== "notified") return Response.json({ error: "not_notified" }, { status: 409 });

  const outcome = await sendReadyPush(order.get("publicToken"), order.get("orderNo"));
  return Response.json({ outcome });
}
