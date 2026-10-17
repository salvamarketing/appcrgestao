import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

function getEnvVar(key: string, defaultValue: string): string {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key] as string;
    }
  } catch {
    // ignore
  }
  return defaultValue;
}

const firebaseConfig = {
  apiKey: getEnvVar("VITE_FIREBASE_API_KEY", "AIzaSyAXSRxYbcnWVEThj5goEel7CQXG8q8NyaQ"),
  authDomain: getEnvVar("VITE_FIREBASE_AUTH_DOMAIN", "cr-ge-8758f.firebaseapp.com"),
  projectId: getEnvVar("VITE_FIREBASE_PROJECT_ID", "cr-ge-8758f"),
  storageBucket: getEnvVar("VITE_FIREBASE_STORAGE_BUCKET", "cr-ge-8758f.firebasestorage.app"),
  messagingSenderId: getEnvVar("VITE_FIREBASE_MESSAGING_SENDER_ID", "134887580437"),
  appId: getEnvVar("VITE_FIREBASE_APP_ID", "1:134887580437:web:b6ff6f7d6c7cabe294bf1c"),
  measurementId: getEnvVar("VITE_FIREBASE_MEASUREMENT_ID", "G-2FRRVN3CJ2")
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
