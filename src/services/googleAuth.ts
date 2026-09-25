import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Guarantee persistent login across app visits and browser restarts
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Auth persistence notice:', err);
  });
}

// Initialize Firestore with auto-detect long polling enabled to handle proxy, sandbox and iframe networks
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);

// Connection test helper that gracefully handles offline mode without throwing unavailable errors
export async function testConnection() {
  try {
    await getDoc(doc(db, 'test', 'connection'));
  } catch (error) {
    // Expected in offline/disconnected mode - Firestore will queue operations until online
    console.debug('Firestore connection check (client in offline/queued state):', error);
  }
}

// Skill-standard error handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Configure Google Provider with required Drive scopes
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

const provider = new GoogleAuthProvider();
provider.addScope(DRIVE_SCOPE);

// Persistent token cache keys
const STORAGE_KEY_TOKEN = 'aura_gdrive_access_token_v2';
const STORAGE_KEY_TOKEN_EXPIRY = 'aura_gdrive_token_expiry_v2';
const STORAGE_KEY_TOKEN_UID = 'aura_gdrive_token_uid_v2';
const TOKEN_MAX_AGE_MS = 55 * 60 * 1000; // 55 minutes

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface AppUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  firstSeenAt: string;
  lastActiveAt: string;
  devicePlatform: string;
}

/**
 * Records user activity into Firestore so admin can know how many people are using the app
 */
export const recordUserVisit = async (user: User) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    const now = new Date().toISOString();
    const platform =
      typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent)
        ? 'Mobile'
        : 'Desktop';

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || '',
        firstSeenAt: now,
        lastActiveAt: now,
        devicePlatform: platform,
      });
    } else {
      await setDoc(
        userRef,
        {
          lastActiveAt: now,
          displayName: user.displayName || snap.data()?.displayName || 'User',
          photoURL: user.photoURL || snap.data()?.photoURL || '',
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Could not record user activity in Firestore:', err);
  }
};

/**
 * Fetch total users and recent activity for Admin (Sreerag Dermal)
 */
export const fetchAppUsersMetrics = async (): Promise<{
  totalCount: number;
  users: AppUserProfile[];
}> => {
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    const users: AppUserProfile[] = [];
    snapshot.forEach((docSnap) => {
      users.push(docSnap.data() as AppUserProfile);
    });
    return {
      totalCount: snapshot.size,
      users: users.sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()),
    };
  } catch (err: any) {
    console.warn('Could not fetch user metrics:', err?.message || err);
    return { totalCount: 0, users: [] };
  }
};

/**
 * Get access token from memory or valid localStorage cache
 */
export const getAccessToken = (currentUserUid?: string): string | null => {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  if (typeof window !== 'undefined') {
    try {
      const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      const storedExpiry = localStorage.getItem(STORAGE_KEY_TOKEN_EXPIRY);
      const storedUid = localStorage.getItem(STORAGE_KEY_TOKEN_UID);

      if (storedToken && storedExpiry) {
        const expiry = Number(storedExpiry);
        const isUidMatch = !currentUserUid || !storedUid || storedUid === currentUserUid;
        if (Date.now() < expiry && isUidMatch) {
          cachedAccessToken = storedToken;
          return storedToken;
        } else {
          // Immediately purge expired/mismatched token
          cachedAccessToken = null;
          localStorage.removeItem(STORAGE_KEY_TOKEN);
          localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
          localStorage.removeItem(STORAGE_KEY_TOKEN_UID);
        }
      }
    } catch (err) {
      console.warn('Could not read stored access token:', err);
    }
  }
  return null;
};

/**
 * Set cached access token in memory and localStorage
 */
export const setCachedAccessToken = (token: string | null, uid?: string) => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEY_TOKEN, token);
        localStorage.setItem(STORAGE_KEY_TOKEN_EXPIRY, String(Date.now() + TOKEN_MAX_AGE_MS));
        if (uid) localStorage.setItem(STORAGE_KEY_TOKEN_UID, uid);
      } else {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
        localStorage.removeItem(STORAGE_KEY_TOKEN_UID);
      }
    } catch (err) {
      console.warn('Could not update stored access token:', err);
    }
  }
};

/**
 * Initialize Auth state listener - restores session seamlessly on refresh
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // Record user presence in Firestore
      recordUserVisit(user);
      const token = getAccessToken(user.uid);
      if (onAuthSuccess) onAuthSuccess(user, token);
    } else {
      setCachedAccessToken(null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger popup sign-in with Google to obtain access token with Drive scope
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;

    setCachedAccessToken(accessToken, result.user.uid);
    // Record in Firestore
    await recordUserVisit(result.user);
    return { user: result.user, accessToken: accessToken || '' };
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('Google sign-in popup closed by user.');
      return null;
    }
    if (error.code === 'auth/cancelled-popup-request') {
      console.log('Sign-in popup request superseded.');
      return null;
    }
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Logout and clear cached token
 */
export const logoutGoogle = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out error:', err);
  }
  setCachedAccessToken(null);
};
