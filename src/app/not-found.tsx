import type { Metadata } from "next";
import { NotFoundScreen } from "./not-found-screen";

export const metadata: Metadata = {
  title: "อย่าซน · 404",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundScreen />;
}
