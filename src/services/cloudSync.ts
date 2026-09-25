import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './googleAuth';
import { Expense, Income, BudgetConfig } from '../types/expense';

export interface CloudLedgerPayload {
  expenses: Expense[];
  incomes: Income[];
  budget: BudgetConfig;
  updatedAt: string;
  lastDevice?: string;
  accountEmail?: string;
}

/**
 * Returns current device type
 */
export const getDevicePlatform = (): 'Mobile' | 'Web' => {
  if (typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    return 'Mobile';
  }
  return 'Web';
};

/**
 * Normalizes an email address to serve as a consistent 1-Account ID across all devices
 * Format: clean lowercase string
 */
export const normalizeEmailAccountKey = (rawEmail: string): string => {
  if (!rawEmail) return '';
  return rawEmail
    .trim()
    .toLowerCase()
    .replace(/[\/\s]/g, '_');
};

/**
 * Merges local and incoming cloud expenses safely, avoiding duplicate entries by unique id
 */
export const mergeExpenses = (local: Expense[], incoming: Expense[]): Expense[] => {
  const map = new Map<string, Expense>();
  // Cloud records take baseline precedence
  incoming.forEach((item) => {
    if (item && item.id) {
      map.set(item.id, item);
    }
  });
  // Add local items if they don't exist yet
  local.forEach((item) => {
    if (item && item.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  });
  // Sort descending by date, then createdAt
  return Array.from(map.values()).sort((a, b) => {
    const dateComp = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateComp !== 0) return dateComp;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
};

/**
 * Merges local and incoming cloud incomes safely
 */
export const mergeIncomes = (local: Income[], incoming: Income[]): Income[] => {
  const map = new Map<string, Income>();
  incoming.forEach((item) => {
    if (item && item.id) {
      map.set(item.id, item);
    }
  });
  local.forEach((item) => {
    if (item && item.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values()).sort((a, b) => {
    const dateComp = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateComp !== 0) return dateComp;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
};

/**
 * UNIFIED 1-EMAIL = 1-ACCOUNT STORE:
 * Subscribes to the single central ledger for a given email address.
 * Automatically receives instantaneous updates when entries are added or modified
 * on Computer Web, Mobile Web, or any device accessing via this email.
 */
export const subscribeToAccountLedger = (
  accountEmail: string,
  onUpdate: (data: CloudLedgerPayload) => void,
  onError?: (error: any) => void
): Unsubscribe => {
  const accountKey = normalizeEmailAccountKey(accountEmail);
  const path = `accounts/${accountKey}/ledger/current`;
  const ledgerDocRef = doc(db, 'accounts', accountKey, 'ledger', 'current');

  return onSnapshot(
    ledgerDocRef,
    { includeMetadataChanges: true },
    (snapshot) => {
      // Ignore local uncommitted writes to prevent feedback echo loops
      if (snapshot.metadata.hasPendingWrites) {
        return;
      }
      if (snapshot.exists()) {
        const data = snapshot.data();
        const payload: CloudLedgerPayload = {
          expenses: Array.isArray(data.expenses) ? data.expenses : [],
          incomes: Array.isArray(data.incomes) ? data.incomes : [],
          budget: data.budget || {
            daily: 500,
            weekly: 3500,
            monthly: 15000,
            monthlySavingsTarget: 10000,
            currency: '₹',
          },
          updatedAt: data.updatedAt || new Date().toISOString(),
          lastDevice: data.lastDevice || 'Unknown',
          accountEmail: data.accountEmail || accountEmail,
        };
        onUpdate(payload);
      }
    },
    (error) => {
      console.warn('Real-time account ledger subscription warning:', error);
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch {}
    }
  );
};

/**
 * UNIFIED 1-EMAIL = 1-ACCOUNT STORE:
 * Saves the user's financial ledger directly to the central Firestore account store
 * so all computers and mobile devices accessing this email receive real-time sync.
 */
export const saveAccountLedgerToCloud = async (
  accountEmail: string,
  data: {
    expenses: Expense[];
    incomes: Income[];
    budget: BudgetConfig;
  }
): Promise<boolean> => {
  if (!accountEmail) return false;
  const accountKey = normalizeEmailAccountKey(accountEmail);
  const path = `accounts/${accountKey}/ledger/current`;

  try {
    const ledgerDocRef = doc(db, 'accounts', accountKey, 'ledger', 'current');
    const nowStr = new Date().toISOString();
    const platform = getDevicePlatform();

    await setDoc(
      ledgerDocRef,
      {
        accountEmail: accountEmail.trim().toLowerCase(),
        expenses: data.expenses,
        incomes: data.incomes,
        budget: data.budget,
        updatedAt: nowStr,
        lastDevice: platform,
        serverTime: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err: any) {
    console.warn('Could not save ledger to central email account store:', err?.message || err);
    try {
      handleFirestoreError(err, OperationType.WRITE, path);
    } catch {}
    return false;
  }
};

/**
 * Fetches the unified account ledger from Firestore once
 */
export const fetchAccountLedgerOnce = async (
  accountEmail: string
): Promise<CloudLedgerPayload | null> => {
  if (!accountEmail) return null;
  const accountKey = normalizeEmailAccountKey(accountEmail);
  const path = `accounts/${accountKey}/ledger/current`;

  try {
    const ledgerDocRef = doc(db, 'accounts', accountKey, 'ledger', 'current');
    const snap = await getDoc(ledgerDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        expenses: Array.isArray(data.expenses) ? data.expenses : [],
        incomes: Array.isArray(data.incomes) ? data.incomes : [],
        budget: data.budget,
        updatedAt: data.updatedAt || new Date().toISOString(),
        lastDevice: data.lastDevice,
        accountEmail: data.accountEmail || accountEmail,
      };
    }
    return null;
  } catch (err: any) {
    console.warn('Failed to fetch account ledger once:', err?.message || err);
    try {
      handleFirestoreError(err, OperationType.GET, path);
    } catch {}
    return null;
  }
};

/**
 * Subscribes to user UID ledger (backwards-compatibility)
 */
export const subscribeToUserLedger = (
  userId: string,
  onUpdate: (data: CloudLedgerPayload) => void,
  onError?: (error: any) => void
): Unsubscribe => {
  const path = `users/${userId}/ledger/current`;
  const ledgerDocRef = doc(db, 'users', userId, 'ledger', 'current');

  return onSnapshot(
    ledgerDocRef,
    { includeMetadataChanges: true },
    (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) {
        return;
      }
      if (snapshot.exists()) {
        const data = snapshot.data();
        const payload: CloudLedgerPayload = {
          expenses: Array.isArray(data.expenses) ? data.expenses : [],
          incomes: Array.isArray(data.incomes) ? data.incomes : [],
          budget: data.budget || {
            daily: 500,
            weekly: 3500,
            monthly: 15000,
            monthlySavingsTarget: 10000,
            currency: '₹',
          },
          updatedAt: data.updatedAt || new Date().toISOString(),
          lastDevice: data.lastDevice || 'Unknown',
        };
        onUpdate(payload);
      }
    },
    (error) => {
      console.warn('Real-time ledger subscription warning:', error);
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch {}
    }
  );
};

/**
 * Saves user UID ledger (backwards-compatibility)
 */
export const saveUserLedgerToCloud = async (
  userId: string,
  data: {
    expenses: Expense[];
    incomes: Income[];
    budget: BudgetConfig;
  }
): Promise<boolean> => {
  if (!userId) return false;
  const path = `users/${userId}/ledger/current`;

  try {
    const ledgerDocRef = doc(db, 'users', userId, 'ledger', 'current');
    const nowStr = new Date().toISOString();
    const platform = getDevicePlatform();

    await setDoc(
      ledgerDocRef,
      {
        expenses: data.expenses,
        incomes: data.incomes,
        budget: data.budget,
        updatedAt: nowStr,
        lastDevice: platform,
        serverTime: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err: any) {
    console.warn('Could not save ledger to Firestore cloud:', err?.message || err);
    try {
      handleFirestoreError(err, OperationType.WRITE, path);
    } catch {}
    return false;
  }
};

/**
 * Fetches user UID ledger once (backwards-compatibility)
 */
export const fetchUserLedgerOnce = async (
  userId: string
): Promise<CloudLedgerPayload | null> => {
  if (!userId) return null;
  try {
    const ledgerDocRef = doc(db, 'users', userId, 'ledger', 'current');
    const snap = await getDoc(ledgerDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        expenses: Array.isArray(data.expenses) ? data.expenses : [],
        incomes: Array.isArray(data.incomes) ? data.incomes : [],
        budget: data.budget,
        updatedAt: data.updatedAt || new Date().toISOString(),
        lastDevice: data.lastDevice,
      };
    }
    return null;
  } catch (err: any) {
    console.warn('Failed to fetch cloud ledger once:', err?.message || err);
    return null;
  }
};
