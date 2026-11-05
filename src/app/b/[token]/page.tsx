import type { Metadata } from "next";
import { isPublicToken } from "@/domain/order";
import { SHOP_NAME } from "@/lib/shop";
import { BillMissing, CustomerBill } from "./customer-bill";

export const metadata: Metadata = {
  title: `บิลของคุณ · ${SHOP_NAME}`,
  robots: { index: false, follow: false },
};

export default async function BillPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return isPublicToken(token) ? <CustomerBill token={token} /> : <BillMissing />;
}
