import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

type RuntimeFirebaseConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
};

const runtimeConfig = (globalThis as any).__RELAY_FIREBASE_CONFIG__ as RuntimeFirebaseConfig | undefined;

function resolveConfigValue(envValue: string | undefined, runtimeValue: string | undefined): string | undefined {
  const cleanedEnv = envValue?.trim();
  if (cleanedEnv) return cleanedEnv;

  const cleanedRuntime = runtimeValue?.trim();
  if (!cleanedRuntime) return undefined;
  if (cleanedRuntime.startsWith('YOUR_') || cleanedRuntime.includes('missing-')) return undefined;
  return cleanedRuntime;
}

const firebaseConfig = {
  apiKey: resolveConfigValue(import.meta.env.VITE_FIREBASE_API_KEY, runtimeConfig?.apiKey),
  authDomain: resolveConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, runtimeConfig?.authDomain),
  projectId: resolveConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID, runtimeConfig?.projectId),
  storageBucket: resolveConfigValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, runtimeConfig?.storageBucket),
  messagingSenderId: resolveConfigValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, runtimeConfig?.messagingSenderId),
  appId: resolveConfigValue(import.meta.env.VITE_FIREBASE_APP_ID, runtimeConfig?.appId),
};

const missingFirebaseVars = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseConfigMissingVars = missingFirebaseVars;
export const isFirebaseConfigured = missingFirebaseVars.length === 0;
export let firebaseInitError: string | null = null;

if (!isFirebaseConfigured) {
  console.error(
    `Missing Firebase environment variables: ${missingFirebaseVars.join(', ')}. ` +
      'Set them in your .env.local and deployment environment variables.'
  );
}

// Use safe placeholders so app bootstrap doesn't hard-crash when env vars are missing.
// The app logic gates auth/data flows with `isFirebaseConfigured`.
const resolvedFirebaseConfig = {
  apiKey: firebaseConfig.apiKey || 'missing-api-key',
  authDomain: firebaseConfig.authDomain || 'localhost',
  projectId: firebaseConfig.projectId || 'missing-project-id',
  storageBucket: firebaseConfig.storageBucket || 'missing-storage-bucket',
  messagingSenderId: firebaseConfig.messagingSenderId || '0',
  appId: firebaseConfig.appId || 'missing-app-id',
};

let app: any = null;
let dbInstance: any = null;
let authInstance: any = null;
let googleProviderInstance: any = null;

try {
  app = initializeApp(resolvedFirebaseConfig);
  dbInstance = getFirestore(app);
  authInstance = getAuth(app);
  googleProviderInstance = new GoogleAuthProvider();
  googleProviderInstance.setCustomParameters({ prompt: 'select_account' });
} catch (error: any) {
  firebaseInitError = error?.message || 'Firebase initialization failed';
  console.error('Firebase initialization error:', error);
}

export const db = dbInstance;
export const auth = authInstance;
export const googleProvider = googleProviderInstance;
export const isFirebaseRuntimeReady = isFirebaseConfigured && !firebaseInitError;

export { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile };

// Error handler as requested in constraints
export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null): never {
  const info: FirestoreErrorInfo = {
    error: error.message || 'Unknown error',
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid || 'guest',
      email: auth.currentUser?.email || 'none',
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || true,
      providerInfo: auth.currentUser?.providerData.map(p => ({
        providerId: p.providerId,
        displayName: p.displayName || '',
        email: p.email || ''
      })) || []
    }
  };
  throw new Error(JSON.stringify(info));
}

// Connection test
async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error.message && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export const signIn = () => signInWithPopup(auth, googleProvider);
export const signOut = () => auth?.signOut?.();
