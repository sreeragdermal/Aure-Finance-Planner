import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './googleAuth';
import {
  Expense,
  Income,
  BudgetConfig,
  CategoryInfo,
  TransactionDoc,
  TransactionType,
} from '../types/expense';

export interface CloudLedgerPayload {
  expenses: Expense[];
  incomes: Income[];
  budget: BudgetConfig;
  updatedAt: string;
  lastDevice?: string;
  accountEmail?: string;
}

/**
 * Returns current device type for analytics/diagnostics
 */
export const getDevicePlatform = (): 'Mobile' | 'Desktop' | 'Tablet' => {
  if (typeof navigator === 'undefined') return 'Desktop';
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'Tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'Mobile';
  return 'Desktop';
};

/**
 * Converts an Expense into a canonical TransactionDoc
 */
export const expenseToTransactionDoc = (
  userId: string,
  exp: Expense,
  syncStatus: 'synced' | 'pending_sync' = 'synced'
): TransactionDoc => ({
  id: exp.id,
  userId,
  type: 'expense',
  amount: Number(exp.amount),
  title: exp.title || 'Untitled Expense',
  category: exp.category || 'other',
  date: exp.date,
  time: exp.time,
  paymentMethod: exp.paymentMethod,
  notes: exp.notes,
  createdAt: exp.createdAt || Date.now(),
  updatedAt: exp.updatedAt || Date.now(),
  syncStatus,
});

/**
 * Converts an Income into a canonical TransactionDoc
 */
export const incomeToTransactionDoc = (
  userId: string,
  inc: Income,
  syncStatus: 'synced' | 'pending_sync' = 'synced'
): TransactionDoc => ({
  id: inc.id,
  userId,
  type: 'income',
  amount: Number(inc.amount),
  title: inc.title || 'Untitled Income',
  category: inc.category || 'other_income',
  date: inc.date,
  time: inc.time,
  paymentMethod: inc.paymentMethod,
  notes: inc.notes,
  createdAt: inc.createdAt || Date.now(),
  updatedAt: inc.updatedAt || Date.now(),
  syncStatus,
});

/**
 * Converts a TransactionDoc back into an Expense
 */
export const transactionDocToExpense = (docData: TransactionDoc): Expense => ({
  id: docData.id,
  title: docData.title,
  amount: Number(docData.amount),
  category: docData.category as any,
  date: docData.date,
  time: docData.time,
  paymentMethod: docData.paymentMethod,
  notes: docData.notes,
  createdAt: docData.createdAt,
  updatedAt: docData.updatedAt,
  syncStatus: docData.syncStatus,
});

/**
 * Converts a TransactionDoc back into an Income
 */
export const transactionDocToIncome = (docData: TransactionDoc): Income => ({
  id: docData.id,
  title: docData.title,
  amount: Number(docData.amount),
  category: docData.category as any,
  date: docData.date,
  time: docData.time,
  paymentMethod: docData.paymentMethod,
  notes: docData.notes,
  createdAt: docData.createdAt,
  updatedAt: docData.updatedAt,
  syncStatus: docData.syncStatus,
});

/**
 * CANONICAL REAL-TIME SUBSCRIBER:
 * Subscribes to the authenticated user's individual transactions subcollection:
 * users/{userId}/transactions
 * Provides real-time synchronization between Mobile, Tablet, and Desktop.
 */
export const subscribeToUserTransactions = (
  userId: string,
  onUpdate: (expenses: Expense[], incomes: Income[]) => void,
  onError?: (error: any) => void
): Unsubscribe => {
  const collectionPath = `users/${userId}/transactions`;
  const txCollectionRef = collection(db, 'users', userId, 'transactions');

  return onSnapshot(
    txCollectionRef,
    { includeMetadataChanges: true },
    (snapshot) => {
      // Collect transactions from snapshot
      const expList: Expense[] = [];
      const incList: Income[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as TransactionDoc;
        if (!data || !data.id || !data.type) return;

        const syncStatus = snapshot.metadata.hasPendingWrites ? 'pending_sync' : 'synced';

        if (data.type === 'expense') {
          expList.push({
            ...transactionDocToExpense(data),
            syncStatus,
          });
        } else if (data.type === 'income') {
          incList.push({
            ...transactionDocToIncome(data),
            syncStatus,
          });
        }
      });

      // Sort descending by date, then createdAt
      const sortFn = (a: { date: string; createdAt: number }, b: { date: string; createdAt: number }) => {
        const dateComp = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateComp !== 0) return dateComp;
        return (b.createdAt || 0) - (a.createdAt || 0);
      };

      expList.sort(sortFn);
      incList.sort(sortFn);

      onUpdate(expList, incList);
    },
    (error) => {
      console.warn('Real-time user transactions subscription error:', error);
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch {}
    }
  );
};

/**
 * CANONICAL REAL-TIME SETTINGS SUBSCRIBER:
 * Subscribes to users/{userId}/settings/budget and users/{userId}/settings/categories
 */
export const subscribeToUserSettings = (
  userId: string,
  onBudgetUpdate: (budget: BudgetConfig) => void,
  onCategoriesUpdate: (categories: Record<string, CategoryInfo>) => void,
  onError?: (error: any) => void
): (() => void) => {
  const budgetRef = doc(db, 'users', userId, 'settings', 'budget');
  const catRef = doc(db, 'users', userId, 'settings', 'categories');

  const unsubBudget = onSnapshot(
    budgetRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onBudgetUpdate({
          daily: data.daily ?? 500,
          weekly: data.weekly ?? 3500,
          monthly: data.monthly ?? 15000,
          monthlySavingsTarget: data.monthlySavingsTarget ?? 10000,
          currency: data.currency || '₹',
          dateFormat: data.dateFormat || 'DD/MM/YYYY',
          weekStartsOn: data.weekStartsOn || 'Monday',
        });
      }
    },
    (err) => {
      if (onError) onError(err);
    }
  );

  const unsubCat = onSnapshot(
    catRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.custom && typeof data.custom === 'object') {
          onCategoriesUpdate(data.custom);
        }
      }
    },
    (err) => {
      if (onError) onError(err);
    }
  );

  return () => {
    unsubBudget();
    unsubCat();
  };
};

/**
 * IDEMPOTENT TRANSACTION SAVE:
 * Saves an individual transaction directly to users/{userId}/transactions/{transactionId}
 */
export const saveTransactionToCloud = async (
  userId: string,
  tx: TransactionDoc
): Promise<boolean> => {
  if (!userId || !tx || !tx.id) return false;
  const path = `users/${userId}/transactions/${tx.id}`;

  try {
    const docRef = doc(db, 'users', userId, 'transactions', tx.id);
    await setDoc(
      docRef,
      {
        ...tx,
        userId,
        updatedAt: Date.now(),
        syncStatus: 'synced',
      },
      { merge: true }
    );
    return true;
  } catch (err: any) {
    console.warn(`Failed to save transaction ${tx.id} to cloud:`, err?.message || err);
    try {
      handleFirestoreError(err, OperationType.WRITE, path);
    } catch {}
    return false;
  }
};

/**
 * DELETES A TRANSACTION FROM CLOUD:
 * Removes document from users/{userId}/transactions/{transactionId}
 */
export const deleteTransactionFromCloud = async (
  userId: string,
  transactionId: string
): Promise<boolean> => {
  if (!userId || !transactionId) return false;
  const path = `users/${userId}/transactions/${transactionId}`;

  try {
    const docRef = doc(db, 'users', userId, 'transactions', transactionId);
    await deleteDoc(docRef);
    return true;
  } catch (err: any) {
    console.warn(`Failed to delete transaction ${transactionId} from cloud:`, err?.message || err);
    try {
      handleFirestoreError(err, OperationType.DELETE, path);
    } catch {}
    return false;
  }
};

/**
 * BATCH SAVE TRANSACTIONS:
 * Safely batches multiple transactions to users/{userId}/transactions in chunks of 400
 */
export const batchSaveTransactionsToCloud = async (
  userId: string,
  transactions: TransactionDoc[]
): Promise<boolean> => {
  if (!userId || !transactions.length) return false;

  const CHUNK_SIZE = 400;
  try {
    for (let i = 0; i < transactions.length; i += CHUNK_SIZE) {
      const chunk = transactions.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      chunk.forEach((tx) => {
        const docRef = doc(db, 'users', userId, 'transactions', tx.id);
        batch.set(
          docRef,
          {
            ...tx,
            userId,
            updatedAt: Date.now(),
            syncStatus: 'synced',
          },
          { merge: true }
        );
      });

      await batch.commit();
    }
    return true;
  } catch (err: any) {
    console.warn('Batch save transactions to cloud failed:', err?.message || err);
    return false;
  }
};

/**
 * SAVES BUDGET CONFIG TO CLOUD:
 * Writes to users/{userId}/settings/budget
 */
export const saveBudgetToCloud = async (
  userId: string,
  budget: BudgetConfig
): Promise<boolean> => {
  if (!userId) return false;
  const path = `users/${userId}/settings/budget`;

  try {
    const docRef = doc(db, 'users', userId, 'settings', 'budget');
    await setDoc(
      docRef,
      {
        ...budget,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    return true;
  } catch (err: any) {
    console.warn('Failed to save budget settings to cloud:', err?.message || err);
    try {
      handleFirestoreError(err, OperationType.WRITE, path);
    } catch {}
    return false;
  }
};

/**
 * SAVES CATEGORIES CONFIG TO CLOUD:
 * Writes to users/{userId}/settings/categories
 */
export const saveCategoriesToCloud = async (
  userId: string,
  categories: Record<string, CategoryInfo>
): Promise<boolean> => {
  if (!userId) return false;
  const path = `users/${userId}/settings/categories`;

  try {
    const docRef = doc(db, 'users', userId, 'settings', 'categories');
    await setDoc(
      docRef,
      {
        custom: categories,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    return true;
  } catch (err: any) {
    console.warn('Failed to save categories to cloud:', err?.message || err);
    try {
      handleFirestoreError(err, OperationType.WRITE, path);
    } catch {}
    return false;
  }
};

/**
 * BACKWARDS-COMPATIBILITY CHECK & MIGRATION:
 * Checks if user has legacy data in users/{userId}/ledger/current or accounts/{email}/ledger/current
 */
export const fetchLegacyLedgerIfAny = async (
  userId: string,
  email?: string | null
): Promise<{ expenses: Expense[]; incomes: Income[]; budget?: BudgetConfig } | null> => {
  try {
    // 1. Check users/{userId}/ledger/current
    if (userId) {
      const userLedgerRef = doc(db, 'users', userId, 'ledger', 'current');
      const snap = await getDoc(userLedgerRef);
      if (snap.exists()) {
        const d = snap.data();
        const exps = Array.isArray(d.expenses) ? d.expenses : [];
        const incs = Array.isArray(d.incomes) ? d.incomes : [];
        if (exps.length > 0 || incs.length > 0) {
          return { expenses: exps, incomes: incs, budget: d.budget };
        }
      }
    }

    // 2. Check accounts/{email}/ledger/current
    if (email && email.includes('@')) {
      const accountKey = email.trim().toLowerCase().replace(/[\/\s]/g, '_');
      const accountRef = doc(db, 'accounts', accountKey, 'ledger', 'current');
      const snap = await getDoc(accountRef);
      if (snap.exists()) {
        const d = snap.data();
        const exps = Array.isArray(d.expenses) ? d.expenses : [];
        const incs = Array.isArray(d.incomes) ? d.incomes : [];
        if (exps.length > 0 || incs.length > 0) {
          return { expenses: exps, incomes: incs, budget: d.budget };
        }
      }
    }
  } catch (err) {
    console.warn('Legacy ledger check notice:', err);
  }
  return null;
};
