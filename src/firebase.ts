import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

// Your web app's Firebase configuration
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyC9OxDlPH9kz05bobAAk1RJM1cuOau-GSo",
  authDomain: "retail-store-sql-agent.firebaseapp.com",
  projectId: "retail-store-sql-agent",
  storageBucket: "retail-store-sql-agent.firebasestorage.app",
  messagingSenderId: "226451810068",
  appId: "1:226451810068:web:c7a15385d4761278384401",
  measurementId: "G-02RWMMJX77"
};

// Helper to get environment or localStorage config, with default fallback
export function getFirebaseConfig() {
  const stored = localStorage.getItem('sql_agent_firebase_config');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.apiKey) return parsed;
    } catch {
      // fallback
    }
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId
  };
}

let app: any = null;
let authInstance: any = null;

export function initFirebase(customConfig?: any) {
  const config = customConfig || getFirebaseConfig();
  if (!config.apiKey || !config.projectId) {
    return { app: null, auth: null };
  }

  try {
    app = getApps().length > 0 ? getApp() : initializeApp(config);
    authInstance = getAuth(app);
    return { app, auth: authInstance };
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
    return { app: null, auth: null };
  }
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { authInstance as auth, signInWithPopup, signOut, onAuthStateChanged };
export type { User };
