import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAXSRxYbcnWVEThj5goEel7CQXG8q8NyaQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cr-ge-8758f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cr-ge-8758f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cr-ge-8758f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "134887580437",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:134887580437:web:b6ff6f7d6c7cabe294bf1c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-2FRRVN3CJ2"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
