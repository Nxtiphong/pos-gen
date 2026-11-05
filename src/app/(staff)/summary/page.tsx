import { connection } from "next/server";
import { businessDate } from "@/domain/business-date";
import { SummaryScreen } from "./summary-screen";

export default async function SummaryPage() {
  await connection();
  return <SummaryScreen today={businessDate(new Date())} />;
}
