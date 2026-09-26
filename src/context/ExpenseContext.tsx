import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  Expense,
  Income,
  BudgetConfig,
  PageTab,
  DailySectionTab,
  CategoryInfo,
  TransactionDoc,
} from '../types/expense';
import { CATEGORIES } from '../utils/categories';
import { getInitialSampleExpenses, getInitialSampleIncomes, getDemoSampleData } from '../utils/sampleData';
import { auth } from '../services/googleAuth';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  subscribeToUserTransactions,
  subscribeToUserSettings,
  saveTransactionToCloud,
  deleteTransactionFromCloud,
  batchSaveTransactionsToCloud,
  saveBudgetToCloud,
  saveCategoriesToCloud,
  fetchLegacyLedgerIfAny,
  expenseToTransactionDoc,
  incomeToTransactionDoc,
} from '../services/cloudSync';
import { isSoundEnabled, setSoundEnabled } from '../utils/soundEffects';
import firebaseConfig from '../../firebase-applet-config.json';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error' | 'guest';

interface ExpenseContextType {
  // Expenses
  expenses: Expense[];
  addExpense: (exp: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, updated: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Incomes
  incomes: Income[];
  addIncome: (inc: Omit<Income, 'id' | 'createdAt'>) => void;
  updateIncome: (id: string, updated: Partial<Income>) => void;
  deleteIncome: (id: string) => void;

  // Global actions
  clearAll: () => void;
  resetToSample: () => void;
  importAllData: (data: {
    expenses?: Expense[];
    incomes?: Income[];
    budget?: BudgetConfig;
    categories?: Record<string, CategoryInfo>;
  }) => void;

  // Categories (Single Source of Truth)
  categories: Record<string, CategoryInfo>;
  categoryList: CategoryInfo[];
  addCategory: (name: string, color?: string, icon?: string) => CategoryInfo;
  updateCategory: (id: string, updates: Partial<CategoryInfo>) => void;
  deleteCategory: (id: string) => { success: boolean; reason?: string };

  // Budgets & settings
  budget: BudgetConfig;
  updateBudget: (updates: Partial<BudgetConfig>) => void;

  // View state
  activeTab: PageTab;
  setActiveTab: (tab: PageTab) => void;
  dailySectionTab: DailySectionTab;
  setDailySectionTab: (tab: DailySectionTab) => void;

  // Modal state
  isAddModalOpen: boolean;
  modalType: 'expense' | 'income';
  openAddModal: (type?: 'expense' | 'income') => void;
  closeAddModal: () => void;
  setIsAddModalOpen: (open: boolean) => void;

  // Sound Effects & Theme & Date
  soundEffectsEnabled: boolean;
  toggleSoundEffects: () => void;
  setSoundEffectsEnabled: (enabled: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  // Real-time Cloud Synchronization
  syncState: SyncState;
  lastSyncTime: string | null;
  forceSyncNow: () => Promise<void>;
  cloudUser: User | null;
  authInitialized: boolean;

  // Safe Diagnostic Info
  firebaseUid: string | null;
  userEmail: string | null;
  firebaseProjectId: string;

  // Migration of local transactions
  pendingMigrationCount: number;
  migrateLocalToCloud: () => Promise<void>;
  dismissMigration: () => void;

  // Backwards compatibility
  accountEmail: string | null;
  connectAccountEmail: (email: string) => Promise<boolean>;
  disconnectAccountEmail: () => void;
}

const DEFAULT_BUDGET: BudgetConfig = {
  daily: 500,
  weekly: 3500,
  monthly: 15000,
  monthlySavingsTarget: 10000,
  currency: '₹',
  dateFormat: 'DD/MM/YYYY',
  weekStartsOn: 'Monday',
};

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

// Storage key prefixes
const STORAGE_PREFIX = 'aura_v3';
const STORAGE_KEY_LEGACY_EXPENSES = 'aura_personal_expenses_v2';
const STORAGE_KEY_LEGACY_INCOMES = 'aura_personal_incomes_v2';
const STORAGE_KEY_THEME = 'aura_theme_v2';
const STORAGE_KEY_DAILY_SECTION = 'aura_daily_section_v2';
const STORAGE_KEY_ACTIVE_TAB = 'aura_active_tab_v2';

const VALID_TABS: PageTab[] = [
  'dashboard',
  'daily',
  'weekly-monthly',
  'charts',
  'budgets',
  'budget-limits',
  'categories',
  'backup',
];

const getTabFromUrl = (): PageTab => {
  if (typeof window === 'undefined') return 'dashboard';
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
  if (VALID_TABS.includes(hash as PageTab)) return hash as PageTab;
  if (hash === 'budget' || hash === 'budgets-limits') return 'budget-limits';
  if (hash === 'export' || hash === 'export-backup') return 'backup';
  if (hash === 'settings' || hash === 'account') return 'budgets';

  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_TAB);
    if (saved && VALID_TABS.includes(saved as PageTab)) {
      return saved as PageTab;
    }
  } catch {}

  return 'dashboard';
};

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved !== null) {
        return saved === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Sound Effects preference
  const [soundEffectsEnabled, setSoundEffectsEnabledState] = useState<boolean>(() => isSoundEnabled());

  const setSoundEffectsEnabled = useCallback((enabled: boolean) => {
    setSoundEffectsEnabledState(enabled);
    setSoundEnabled(enabled);
  }, []);

  const toggleSoundEffects = useCallback(() => {
    setSoundEffectsEnabledState((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      return next;
    });
  }, []);

  // Online / Offline tracking
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth & User canonical state
  const [cloudUser, setCloudUser] = useState<User | null>(() => auth.currentUser);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [syncState, setSyncState] = useState<SyncState>('syncing');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Core Ledger state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budget, setBudget] = useState<BudgetConfig>(DEFAULT_BUDGET);
  const [categories, setCategories] = useState<Record<string, CategoryInfo>>(CATEGORIES);

  // Migration state for unmigrated local device data
  const [pendingMigrationCount, setPendingMigrationCount] = useState<number>(0);
  const unmigratedLocalDataRef = useRef<{ expenses: Expense[]; incomes: Income[] } | null>(null);

  // Refs to maintain fresh state inside async subscriptions without stale closures
  const expensesRef = useRef(expenses);
  const incomesRef = useRef(incomes);
  const budgetRef = useRef(budget);
  const categoriesRef = useRef(categories);
  const currentUserRef = useRef<User | null>(cloudUser);

  useEffect(() => {
    expensesRef.current = expenses;
  }, [expenses]);

  useEffect(() => {
    incomesRef.current = incomes;
  }, [incomes]);

  useEffect(() => {
    budgetRef.current = budget;
  }, [budget]);

  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  useEffect(() => {
    currentUserRef.current = cloudUser;
  }, [cloudUser]);

  // Daily Section Tab
  const [dailySectionTab, setDailySectionTabState] = useState<DailySectionTab>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DAILY_SECTION);
      if (saved === 'expenses' || saved === 'income' || saved === 'both') {
        return saved;
      }
    } catch {}
    return 'expenses';
  });

  const setDailySectionTab = (tab: DailySectionTab) => {
    setDailySectionTabState(tab);
    try {
      localStorage.setItem(STORAGE_KEY_DAILY_SECTION, tab);
    } catch {}
  };

  // Navigation tab
  const [activeTab, setActiveTabState] = useState<PageTab>(getTabFromUrl);

  const setActiveTab = useCallback((tab: PageTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, tab);
    } catch {}

    const targetHash = `#/${tab}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState({ tab }, '', targetHash);
    }
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      const tabFromUrl = getTabFromUrl();
      setActiveTabState(tabFromUrl);
      try {
        localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, tabFromUrl);
      } catch {}
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    if (!window.location.hash && !window.location.pathname.replace(/^\//, '')) {
      window.history.replaceState({ tab: activeTab }, '', `#/${activeTab}`);
    }

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [activeTab]);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'expense' | 'income'>('expense');

  const openAddModal = (type: 'expense' | 'income' = 'expense') => {
    setModalType(type);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  // Date selection
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  // Cached user cache loader
  const loadUserOfflineCache = useCallback((uid: string) => {
    try {
      const cachedExp = localStorage.getItem(`${STORAGE_PREFIX}_${uid}_expenses`);
      const cachedInc = localStorage.getItem(`${STORAGE_PREFIX}_${uid}_incomes`);
      const cachedBudget = localStorage.getItem(`${STORAGE_PREFIX}_${uid}_budget`);
      const cachedCats = localStorage.getItem(`${STORAGE_PREFIX}_${uid}_categories`);

      if (cachedExp) {
        const parsed = JSON.parse(cachedExp);
        if (Array.isArray(parsed) && parsed.length > 0) setExpenses(parsed);
      }
      if (cachedInc) {
        const parsed = JSON.parse(cachedInc);
        if (Array.isArray(parsed) && parsed.length > 0) setIncomes(parsed);
      }
      if (cachedBudget) {
        const parsed = JSON.parse(cachedBudget);
        if (parsed) setBudget(parsed);
      }
      if (cachedCats) {
        const parsed = JSON.parse(cachedCats);
        if (parsed && typeof parsed === 'object') setCategories((prev) => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.warn('Error reading user offline cache:', err);
    }
  }, []);

  // Save to user-specific offline cache
  const saveUserOfflineCache = useCallback((
    uid: string,
    curExpenses: Expense[],
    curIncomes: Income[],
    curBudget: BudgetConfig,
    curCategories: Record<string, CategoryInfo>
  ) => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}_${uid}_expenses`, JSON.stringify(curExpenses));
      localStorage.setItem(`${STORAGE_PREFIX}_${uid}_incomes`, JSON.stringify(curIncomes));
      localStorage.setItem(`${STORAGE_PREFIX}_${uid}_budget`, JSON.stringify(curBudget));
      localStorage.setItem(`${STORAGE_PREFIX}_${uid}_categories`, JSON.stringify(curCategories));
    } catch {}
  }, []);

  // Load guest local data
  const loadGuestData = useCallback(() => {
    try {
      const savedExp = localStorage.getItem(`${STORAGE_PREFIX}_guest_expenses`) || localStorage.getItem(STORAGE_KEY_LEGACY_EXPENSES);
      const savedInc = localStorage.getItem(`${STORAGE_PREFIX}_guest_incomes`) || localStorage.getItem(STORAGE_KEY_LEGACY_INCOMES);

      if (savedExp) {
        const parsed = JSON.parse(savedExp);
        if (Array.isArray(parsed)) {
          setExpenses(parsed);
        } else {
          setExpenses(getInitialSampleExpenses());
        }
      } else {
        setExpenses(getInitialSampleExpenses());
      }

      if (savedInc) {
        const parsed = JSON.parse(savedInc);
        if (Array.isArray(parsed)) {
          setIncomes(parsed);
        } else {
          setIncomes(getInitialSampleIncomes());
        }
      } else {
        setIncomes(getInitialSampleIncomes());
      }
    } catch {
      setExpenses(getInitialSampleExpenses());
      setIncomes(getInitialSampleIncomes());
    }
  }, []);

  // Flush offline pending transactions when back online
  useEffect(() => {
    if (!isOnline || !cloudUser?.uid) return;

    try {
      const pendingRaw = localStorage.getItem(`${STORAGE_PREFIX}_${cloudUser.uid}_pending`);
      if (pendingRaw) {
        const pendingList: TransactionDoc[] = JSON.parse(pendingRaw);
        if (Array.isArray(pendingList) && pendingList.length > 0) {
          batchSaveTransactionsToCloud(cloudUser.uid, pendingList).then((ok) => {
            if (ok) {
              localStorage.removeItem(`${STORAGE_PREFIX}_${cloudUser.uid}_pending`);
            }
          });
        }
      }
    } catch {}
  }, [isOnline, cloudUser]);

  // MAIN AUTH & SUBSCRIPTION LIFECYCLE
  useEffect(() => {
    let unsubscribeTx: (() => void) | null = null;
    let unsubscribeSettings: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCloudUser(user);
      currentUserRef.current = user;
      setAuthInitialized(true);

      // Clean up previous subscriptions if any
      if (unsubscribeTx) {
        unsubscribeTx();
        unsubscribeTx = null;
      }
      if (unsubscribeSettings) {
        unsubscribeSettings();
        unsubscribeSettings = null;
      }

      if (user) {
        // Authenticated with Firebase UID: canonical source of truth
        setSyncState('syncing');

        // 1. Instantly populate UI from user's local cache if available (prevent blank screen)
        loadUserOfflineCache(user.uid);

        // 2. Subscribe to real-time transactions in users/{userId}/transactions
        let isFirstSnapshot = true;
        unsubscribeTx = subscribeToUserTransactions(
          user.uid,
          async (cloudExpenses, cloudIncomes) => {
            setExpenses(cloudExpenses);
            setIncomes(cloudIncomes);
            saveUserOfflineCache(user.uid, cloudExpenses, cloudIncomes, budgetRef.current, categoriesRef.current);
            setSyncState('synced');
            setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

            // On first snapshot, if cloud collection has 0 items, check for legacy or local data to migrate seamlessly
            if (isFirstSnapshot) {
              isFirstSnapshot = false;
              if (cloudExpenses.length === 0 && cloudIncomes.length === 0) {
                // Check legacy Firestore paths first
                const legacy = await fetchLegacyLedgerIfAny(user.uid, user.email);
                if (legacy && (legacy.expenses.length > 0 || legacy.incomes.length > 0)) {
                  console.info('Migrating legacy Firestore ledger into canonical transactions collection...');
                  const txList: TransactionDoc[] = [
                    ...legacy.expenses.map((e) => expenseToTransactionDoc(user.uid, e)),
                    ...legacy.incomes.map((i) => incomeToTransactionDoc(user.uid, i)),
                  ];
                  await batchSaveTransactionsToCloud(user.uid, txList);
                  if (legacy.budget) {
                    await saveBudgetToCloud(user.uid, legacy.budget);
                  }
                  return;
                }

                // Check if device has unmigrated localStorage transactions
                try {
                  const localExpRaw = localStorage.getItem(STORAGE_KEY_LEGACY_EXPENSES);
                  const localIncRaw = localStorage.getItem(STORAGE_KEY_LEGACY_INCOMES);
                  const localExp = localExpRaw ? JSON.parse(localExpRaw) : [];
                  const localInc = localIncRaw ? JSON.parse(localIncRaw) : [];
                  const totalLocal = (Array.isArray(localExp) ? localExp.length : 0) + (Array.isArray(localInc) ? localInc.length : 0);

                  if (totalLocal > 0) {
                    unmigratedLocalDataRef.current = { expenses: localExp, incomes: localInc };
                    setPendingMigrationCount(totalLocal);
                  }
                } catch {}
              }
            }
          },
          (err) => {
            console.warn('Real-time transactions error:', err);
            setSyncState('error');
          }
        );

        // 3. Subscribe to real-time settings in users/{userId}/settings
        unsubscribeSettings = subscribeToUserSettings(
          user.uid,
          (cloudBudget) => {
            setBudget(cloudBudget);
            saveUserOfflineCache(user.uid, expensesRef.current, incomesRef.current, cloudBudget, categoriesRef.current);
          },
          (cloudCategories) => {
            setCategories((prev) => ({ ...prev, ...cloudCategories }));
            saveUserOfflineCache(user.uid, expensesRef.current, incomesRef.current, budgetRef.current, {
              ...categoriesRef.current,
              ...cloudCategories,
            });
          }
        );
      } else {
        // User is not signed in: guest mode
        setSyncState('guest');
        loadGuestData();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeTx) unsubscribeTx();
      if (unsubscribeSettings) unsubscribeSettings();
    };
  }, [loadUserOfflineCache, loadGuestData, saveUserOfflineCache]);

  // Local Data Migration Handlers
  const migrateLocalToCloud = useCallback(async () => {
    const user = currentUserRef.current;
    const localData = unmigratedLocalDataRef.current;
    if (!user || !localData) return;

    setSyncState('syncing');
    const txList: TransactionDoc[] = [
      ...localData.expenses.map((e) => expenseToTransactionDoc(user.uid, e)),
      ...localData.incomes.map((i) => incomeToTransactionDoc(user.uid, i)),
    ];

    const ok = await batchSaveTransactionsToCloud(user.uid, txList);
    if (ok) {
      setPendingMigrationCount(0);
      unmigratedLocalDataRef.current = null;
      setSyncState('synced');
    } else {
      setSyncState('error');
    }
  }, []);

  const dismissMigration = useCallback(() => {
    setPendingMigrationCount(0);
    unmigratedLocalDataRef.current = null;
  }, []);

  // Force Sync Now Action
  const forceSyncNow = useCallback(async () => {
    const user = currentUserRef.current;
    if (!user) return;

    setSyncState('syncing');
    try {
      // Re-save offline user cache and flush any pending transactions
      const pendingRaw = localStorage.getItem(`${STORAGE_PREFIX}_${user.uid}_pending`);
      if (pendingRaw) {
        const pendingList: TransactionDoc[] = JSON.parse(pendingRaw);
        if (Array.isArray(pendingList) && pendingList.length > 0) {
          await batchSaveTransactionsToCloud(user.uid, pendingList);
          localStorage.removeItem(`${STORAGE_PREFIX}_${user.uid}_pending`);
        }
      }
      setSyncState('synced');
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Manual sync failed:', err);
      setSyncState('error');
    }
  }, []);

  // EXPENSE CRUD OPERATIONS
  const addExpense = useCallback((newExp: Omit<Expense, 'id' | 'createdAt'>) => {
    const user = currentUserRef.current;
    const stableId = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const created: Expense = {
      ...newExp,
      id: stableId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: user ? 'synced' : 'pending_sync',
    };

    // Optimistic local state update
    const updated = [created, ...expensesRef.current];
    setExpenses(updated);

    if (user) {
      saveUserOfflineCache(user.uid, updated, incomesRef.current, budgetRef.current, categoriesRef.current);
      const txDoc = expenseToTransactionDoc(user.uid, created, 'synced');
      saveTransactionToCloud(user.uid, txDoc).catch(() => {
        // Queue for offline sync if write fails
        try {
          const pendingKey = `${STORAGE_PREFIX}_${user.uid}_pending`;
          const existingPending: TransactionDoc[] = JSON.parse(localStorage.getItem(pendingKey) || '[]');
          existingPending.push(txDoc);
          localStorage.setItem(pendingKey, JSON.stringify(existingPending));
        } catch {}
      });
    } else {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}_guest_expenses`, JSON.stringify(updated));
      } catch {}
    }
  }, [saveUserOfflineCache]);

  const updateExpense = useCallback((id: string, updatedFields: Partial<Expense>) => {
    const user = currentUserRef.current;
    const updated = expensesRef.current.map((item) =>
      item.id === id ? { ...item, ...updatedFields, updatedAt: Date.now() } : item
    );
    setExpenses(updated);

    const changedItem = updated.find((item) => item.id === id);
    if (user && changedItem) {
      saveUserOfflineCache(user.uid, updated, incomesRef.current, budgetRef.current, categoriesRef.current);
      const txDoc = expenseToTransactionDoc(user.uid, changedItem, 'synced');
      saveTransactionToCloud(user.uid, txDoc);
    } else if (!user) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}_guest_expenses`, JSON.stringify(updated));
      } catch {}
    }
  }, [saveUserOfflineCache]);

  const deleteExpense = useCallback((id: string) => {
    const user = currentUserRef.current;
    const updated = expensesRef.current.filter((item) => item.id !== id);
    setExpenses(updated);

    if (user) {
      saveUserOfflineCache(user.uid, updated, incomesRef.current, budgetRef.current, categoriesRef.current);
      deleteTransactionFromCloud(user.uid, id);
    } else {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}_guest_expenses`, JSON.stringify(updated));
      } catch {}
    }
  }, [saveUserOfflineCache]);

  // INCOME CRUD OPERATIONS
  const addIncome = useCallback((newInc: Omit<Income, 'id' | 'createdAt'>) => {
    const user = currentUserRef.current;
    const stableId = `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const created: Income = {
      ...newInc,
      id: stableId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: user ? 'synced' : 'pending_sync',
    };

    const updated = [created, ...incomesRef.current];
    setIncomes(updated);

    if (user) {
      saveUserOfflineCache(user.uid, expensesRef.current, updated, budgetRef.current, categoriesRef.current);
      const txDoc = incomeToTransactionDoc(user.uid, created, 'synced');
      saveTransactionToCloud(user.uid, txDoc).catch(() => {
        try {
          const pendingKey = `${STORAGE_PREFIX}_${user.uid}_pending`;
          const existingPending: TransactionDoc[] = JSON.parse(localStorage.getItem(pendingKey) || '[]');
          existingPending.push(txDoc);
          localStorage.setItem(pendingKey, JSON.stringify(existingPending));
        } catch {}
      });
    } else {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}_guest_incomes`, JSON.stringify(updated));
      } catch {}
    }
  }, [saveUserOfflineCache]);

  const updateIncome = useCallback((id: string, updatedFields: Partial<Income>) => {
    const user = currentUserRef.current;
    const updated = incomesRef.current.map((item) =>
      item.id === id ? { ...item, ...updatedFields, updatedAt: Date.now() } : item
    );
    setIncomes(updated);

    const changedItem = updated.find((item) => item.id === id);
    if (user && changedItem) {
      saveUserOfflineCache(user.uid, expensesRef.current, updated, budgetRef.current, categoriesRef.current);
      const txDoc = incomeToTransactionDoc(user.uid, changedItem, 'synced');
      saveTransactionToCloud(user.uid, txDoc);
    } else if (!user) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}_guest_incomes`, JSON.stringify(updated));
      } catch {}
    }
  }, [saveUserOfflineCache]);

  const deleteIncome = useCallback((id: string) => {
    const user = currentUserRef.current;
    const updated = incomesRef.current.filter((item) => item.id !== id);
    setIncomes(updated);

    if (user) {
      saveUserOfflineCache(user.uid, expensesRef.current, updated, budgetRef.current, categoriesRef.current);
      deleteTransactionFromCloud(user.uid, id);
    } else {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}_guest_incomes`, JSON.stringify(updated));
      } catch {}
    }
  }, [saveUserOfflineCache]);

  // CATEGORY MANAGEMENT
  const categoryList = useMemo(() => Object.values(categories), [categories]);

  const addCategory = useCallback((name: string, color?: string, icon?: string): CategoryInfo => {
    const cleanName = name.trim();
    const id = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_') || `cat_${Date.now()}`;
    const pickedColor = color || '#0D9488';
    const newCat: CategoryInfo = {
      id,
      name: cleanName,
      color: pickedColor,
      bgLight: `${pickedColor}15`,
      bgDark: `${pickedColor}25`,
      textLight: pickedColor,
      textDark: pickedColor,
      icon: icon || 'Tag',
      isCustom: true,
    };
    setCategories((prev) => {
      const updated = { ...prev, [id]: newCat };
      const user = currentUserRef.current;
      if (user) {
        saveCategoriesToCloud(user.uid, updated);
      }
      return updated;
    });
    return newCat;
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<CategoryInfo>) => {
    setCategories((prev) => {
      if (!prev[id]) return prev;
      const updated = { ...prev, [id]: { ...prev[id], ...updates } };
      const user = currentUserRef.current;
      if (user) {
        saveCategoriesToCloud(user.uid, updated);
      }
      return updated;
    });
  }, []);

  const deleteCategory = useCallback((id: string): { success: boolean; reason?: string } => {
    const usedCount = expensesRef.current.filter((e) => e.category === id).length;
    if (usedCount > 0) {
      return {
        success: false,
        reason: `Cannot delete "${categories[id]?.name || id}" because it is used by ${usedCount} transaction${usedCount === 1 ? '' : 's'}.`,
      };
    }
    setCategories((prev) => {
      const copy = { ...prev };
      delete copy[id];
      const user = currentUserRef.current;
      if (user) {
        saveCategoriesToCloud(user.uid, copy);
      }
      return copy;
    });
    return { success: true };
  }, [categories]);

  // BUDGET MANAGEMENT
  const updateBudget = useCallback((updates: Partial<BudgetConfig>) => {
    const newBudget = { ...budgetRef.current, ...updates };
    setBudget(newBudget);
    const user = currentUserRef.current;
    if (user) {
      saveBudgetToCloud(user.uid, newBudget);
      saveUserOfflineCache(user.uid, expensesRef.current, incomesRef.current, newBudget, categoriesRef.current);
    }
  }, [saveUserOfflineCache]);

  // DATA MANAGEMENT
  const clearAll = useCallback(() => {
    const user = currentUserRef.current;
    const currentExp = expensesRef.current;
    const currentInc = incomesRef.current;
    setExpenses([]);
    setIncomes([]);

    if (user) {
      currentExp.forEach((e) => deleteTransactionFromCloud(user.uid, e.id));
      currentInc.forEach((i) => deleteTransactionFromCloud(user.uid, i.id));
      saveUserOfflineCache(user.uid, [], [], budgetRef.current, categoriesRef.current);
    } else {
      localStorage.removeItem(`${STORAGE_PREFIX}_guest_expenses`);
      localStorage.removeItem(`${STORAGE_PREFIX}_guest_incomes`);
    }
  }, [saveUserOfflineCache]);

  const resetToSample = useCallback(() => {
    const demo = getDemoSampleData();
    setExpenses(demo.expenses);
    setIncomes(demo.incomes);
    const user = currentUserRef.current;
    if (user) {
      const txList: TransactionDoc[] = [
        ...demo.expenses.map((e) => expenseToTransactionDoc(user.uid, e)),
        ...demo.incomes.map((i) => incomeToTransactionDoc(user.uid, i)),
      ];
      batchSaveTransactionsToCloud(user.uid, txList);
      saveUserOfflineCache(user.uid, demo.expenses, demo.incomes, budgetRef.current, categoriesRef.current);
    }
  }, [saveUserOfflineCache]);

  const importAllData = useCallback((data: {
    expenses?: Expense[];
    incomes?: Income[];
    budget?: BudgetConfig;
    categories?: Record<string, CategoryInfo>;
  }) => {
    const newExpenses = Array.isArray(data.expenses) ? data.expenses : expensesRef.current;
    const newIncomes = Array.isArray(data.incomes) ? data.incomes : incomesRef.current;
    setExpenses(newExpenses);
    setIncomes(newIncomes);
    if (data.budget) setBudget((prev) => ({ ...prev, ...data.budget }));
    if (data.categories) setCategories((prev) => ({ ...prev, ...data.categories }));

    const user = currentUserRef.current;
    if (user) {
      const txList: TransactionDoc[] = [
        ...newExpenses.map((e) => expenseToTransactionDoc(user.uid, e)),
        ...newIncomes.map((i) => incomeToTransactionDoc(user.uid, i)),
      ];
      batchSaveTransactionsToCloud(user.uid, txList);
      if (data.budget) saveBudgetToCloud(user.uid, data.budget);
      if (data.categories) saveCategoriesToCloud(user.uid, data.categories);
      saveUserOfflineCache(user.uid, newExpenses, newIncomes, data.budget || budgetRef.current, data.categories || categoriesRef.current);
    }
  }, [saveUserOfflineCache]);

  // Backwards compatibility functions
  const connectAccountEmail = useCallback(async (_email: string): Promise<boolean> => {
    return true;
  }, []);

  const disconnectAccountEmail = useCallback(() => {}, []);

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        incomes,
        addIncome,
        updateIncome,
        deleteIncome,
        clearAll,
        resetToSample,
        importAllData,
        categories,
        categoryList,
        addCategory,
        updateCategory,
        deleteCategory,
        budget,
        updateBudget,
        activeTab,
        setActiveTab,
        dailySectionTab,
        setDailySectionTab,
        isAddModalOpen,
        modalType,
        openAddModal,
        closeAddModal,
        setIsAddModalOpen,
        darkMode,
        toggleDarkMode,
        soundEffectsEnabled,
        toggleSoundEffects,
        setSoundEffectsEnabled,
        selectedDate,
        setSelectedDate,
        syncState,
        lastSyncTime,
        forceSyncNow,
        cloudUser,
        authInitialized,
        firebaseUid: cloudUser?.uid || null,
        userEmail: cloudUser?.email || null,
        firebaseProjectId: firebaseConfig.projectId,
        pendingMigrationCount,
        migrateLocalToCloud,
        dismissMigration,
        accountEmail: cloudUser?.email || null,
        connectAccountEmail,
        disconnectAccountEmail,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}
