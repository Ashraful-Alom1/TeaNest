import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export function getDefaultFirebaseConfig(): FirebaseConfig {
  // Use Vite client environment variables if available
  const meta = import.meta as any;
  const env = typeof meta !== 'undefined' && meta.env ? meta.env : ({} as Record<string, string>);

  return {
    apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyCqeoaM2D4YKg2gFr-5V91fPaMpCeW7y4c',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'tea-nest.firebaseapp.com',
    projectId: env.VITE_FIREBASE_PROJECT_ID || 'tea-nest',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'tea-nest.firebasestorage.app',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '38350226211',
    appId: env.VITE_FIREBASE_APP_ID || '1:38350226211:web:5d21b282b14cac92c18296',
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-SVLBRJVH71',
  };
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function initFirebase(customConfig?: Partial<FirebaseConfig>): {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
} {
  if (!appInstance) {
    const config = { ...getDefaultFirebaseConfig(), ...customConfig };
    appInstance = getApps().length === 0 ? initializeApp(config) : getApp();
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);

    const meta = import.meta as any;
    const env = typeof meta !== 'undefined' && meta.env ? meta.env : ({} as Record<string, string>);
    if (env.VITE_USE_FIREBASE_EMULATOR === 'true') {
      try {
        connectAuthEmulator(authInstance, 'http://localhost:9099', { disableWarnings: true });
        connectFirestoreEmulator(dbInstance, 'localhost', 8080);
      } catch {
        // Emulator already connected
      }
    }
  }

  return {
    app: appInstance,
    auth: authInstance!,
    db: dbInstance!,
  };
}

/**
 * Authenticate Administrator with Firebase Auth
 */
export async function authenticateAdminWithFirebase(
  email: string,
  passcode: string
): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
  try {
    const { auth } = initFirebase();
    const userCredential = await signInWithEmailAndPassword(auth, email, passcode);
    return { success: true, user: userCredential.user };
  } catch (err: any) {
    // If Firebase Auth returns auth errors (e.g. user-not-found, wrong-password, etc.)
    return { 
      success: false, 
      error: err?.message || 'Firebase Authentication failed' 
    };
  }
}

/**
 * Sign out Administrator from Firebase
 */
export async function logoutAdminFromFirebase(): Promise<void> {
  try {
    const { auth } = initFirebase();
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase logout notice:', err);
  }
}

/**
 * Listen to Firebase Auth state changes
 */
export function subscribeToAdminAuthState(callback: (user: FirebaseUser | null) => void): () => void {
  const { auth } = initFirebase();
  return onAuthStateChanged(auth, callback);
}


