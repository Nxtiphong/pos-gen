import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

function adminApp(): App {
  if (getApps().length > 0) return getApp();
  const projectId = requireEnv("FIREBASE_PROJECT_ID");
  if (process.env.FIRESTORE_EMULATOR_HOST) return initializeApp({ projectId });
  return initializeApp({
    projectId,
    credential: cert({
      projectId,
      clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
      // Vercel and .env files store the PEM on one line with literal \n sequences.
      privateKey: requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  });
}

export function adminDb(): Firestore {
  return getFirestore(adminApp());
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}
