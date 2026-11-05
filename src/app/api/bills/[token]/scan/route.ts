import { FieldValue } from "firebase-admin/firestore";
import { isPublicToken } from "@/domain/order";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const notFound = () => Response.json({ error: "not_found" }, { status: 404 });

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isPublicToken(token)) return notFound();

  const db = adminDb();
  const outcome = await db.runTransaction(async (tx) => {
    const billRef = db.doc(`bills/${token}`);
    const bill = await tx.get(billRef);
    if (!bill.exists) return "missing" as const;
    const orderRef = db.doc(`orders/${bill.get("orderId")}`);
    const order = await tx.get(orderRef);

    let firstScan = false;
    if (bill.get("scannedAt") == null) {
      tx.update(billRef, { scannedAt: FieldValue.serverTimestamp() });
      firstScan = true;
    }
    if (order.exists && order.get("scannedAt") == null) {
      tx.update(orderRef, { scannedAt: FieldValue.serverTimestamp() });
      firstScan = true;
    }
    return firstScan ? ("scanned" as const) : ("already" as const);
  });

  if (outcome === "missing") return notFound();
  return Response.json({ firstScan: outcome === "scanned" });
}
