import { notFound } from "next/navigation";
import { ReadyPreview } from "./ready-preview";

export default function ReadyPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ReadyPreview />;
}
