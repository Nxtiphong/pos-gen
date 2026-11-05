import { connection } from "next/server";
import { bangkokDate } from "@/domain/business-date";
import { SummaryScreen } from "./summary-screen";

export default async function SummaryPage() {
  await connection();
  return <SummaryScreen today={bangkokDate(new Date())} />;
}
