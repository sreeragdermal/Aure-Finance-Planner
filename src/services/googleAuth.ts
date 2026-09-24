import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import {
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
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Configure Google Provider with required Drive scopes
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

const provider = new GoogleAuthProvider();
provider.addScope(DRIVE_SCOPE);

// In-memory token cache (never stored in localStorage as per security guidelines)
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
    const platform = typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent)
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
 * Initialize Auth state listener
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // Record user presence in Firestore
      recordUserVisit(user);
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
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

    if (!credential?.accessToken) {
      throw new Error('Could not retrieve Google Drive access token from authentication.');
    }

    cachedAccessToken = credential.accessToken;
    // Record in Firestore
    await recordUserVisit(result.user);
    return { user: result.user, accessToken: cachedAccessToken };
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
 * Get current in-memory cached access token
 */
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Set cached access token manually
 */
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Logout and clear cached token
 */
export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
