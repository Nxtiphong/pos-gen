import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const present = (name: string) => Boolean(process.env[name]);

export async function GET() {
  const env = {
    FIREBASE_PROJECT_ID: present("FIREBASE_PROJECT_ID"),
    FIREBASE_CLIENT_EMAIL: present("FIREBASE_CLIENT_EMAIL"),
    FIREBASE_PRIVATE_KEY: present("FIREBASE_PRIVATE_KEY"),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: present("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
    VAPID_PRIVATE_KEY: present("VAPID_PRIVATE_KEY"),
  };
  let firestore: string;
  try {
    await adminDb().doc("health/probe").get();
    firestore = "ok";
  } catch (error) {
    firestore = error instanceof Error ? error.message.split("\n")[0].slice(0, 120) : "error";
  }
  return Response.json({ env, firestore }, { status: firestore === "ok" ? 200 : 500 });
}
