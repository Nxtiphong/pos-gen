import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import firebaseJson from "../../../firebase.json";

export const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === "1";
export const emulatorHost = process.env.NEXT_PUBLIC_EMULATOR_HOST || "127.0.0.1";
const firestoreEmulator = firebaseJson.emulators.firestore;

export function firebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  return initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}

let db: Firestore | undefined;

export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(firebaseApp());
    if (useEmulators) connectFirestoreEmulator(db, emulatorHost, firestoreEmulator.port);
  }
  return db;
}
