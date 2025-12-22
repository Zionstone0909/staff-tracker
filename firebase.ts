// @ts-ignore
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// ------------------------------------------------------------------
// CONFIGURATION UPDATED: Jireh Fishes Project
// ------------------------------------------------------------------
export const firebaseConfig = {
  apiKey: "AIzaSyARIHULH12GXEEzJpqa65plfVOehP614lg",
  authDomain: "jireh-fishes.firebaseapp.com",
  projectId: "jireh-fishes",
  storageBucket: "jireh-fishes.firebasestorage.app",
  messagingSenderId: "86074523338",
  appId: "1:86074523338:web:5376bcd8ae7844105bfe33",
  measurementId: "G-Y83Y9KKN88"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Initialize Firestore with persistent local cache to support offline mode
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const analytics = getAnalytics(app);

export default app;