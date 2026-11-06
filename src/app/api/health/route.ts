export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const present = (name: string) => Boolean(process.env[name]);

const firstLine = (error: unknown) => (error instanceof Error ? error.message.split("\n")[0].slice(0, 200) : String(error));

export async function GET() {
  const env = {
    FIREBASE_PROJECT_ID: present("FIREBASE_PROJECT_ID"),
    FIREBASE_CLIENT_EMAIL: present("FIREBASE_CLIENT_EMAIL"),
    FIREBASE_PRIVATE_KEY: present("FIREBASE_PRIVATE_KEY"),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: present("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
    VAPID_PRIVATE_KEY: present("VAPID_PRIVATE_KEY"),
  };
  // Imported lazily so a module that fails to load is reported here instead of crashing the route.
  let firestore: string;
  try {
    const { adminDb } = await import("@/lib/firebase/admin");
    await adminDb().doc("health/probe").get();
    firestore = "ok";
  } catch (error) {
    firestore = firstLine(error);
  }
  return Response.json({ env, node: process.version, firestore }, { status: firestore === "ok" ? 200 : 500 });
}
