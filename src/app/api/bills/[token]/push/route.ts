import { FieldValue } from "firebase-admin/firestore";
import { isPublicToken } from "@/domain/order";
import { adminDb } from "@/lib/firebase/admin";
import { parseSubscription } from "@/lib/push-server";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isPublicToken(token)) return Response.json({ error: "not_found" }, { status: 404 });

  const subscription = parseSubscription(await request.json().catch(() => null));
  if (!subscription) return Response.json({ error: "bad_subscription" }, { status: 400 });

  const db = adminDb();
  const bill = await db.doc(`bills/${token}`).get();
  if (!bill.exists) return Response.json({ error: "not_found" }, { status: 404 });

  await db.doc(`pushSubscriptions/${token}`).set({ subscription, updatedAt: FieldValue.serverTimestamp() });
  return Response.json({ ok: true });
}
