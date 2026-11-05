import { connection } from "next/server";
import { formatThaiDate } from "@/lib/thai-date";
import { SellScreen } from "./sell-screen";

export default async function SellPage() {
  await connection();
  return <SellScreen today={formatThaiDate(new Date())} />;
}
