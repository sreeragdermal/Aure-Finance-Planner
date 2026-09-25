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
} from '../types/expense';
import { CATEGORIES } from '../utils/categories';
import { getInitialSampleExpenses, getInitialSampleIncomes, getDemoSampleData } from '../utils/sampleData';
import { auth } from '../services/googleAuth';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  subscribeToAccountLedger,
  saveAccountLedgerToCloud,
  fetchAccountLedgerOnce,
  subscribeToUserLedger,
  saveUserLedgerToCloud,
  fetchUserLedgerOnce,
  mergeExpenses,
  mergeIncomes,
  normalizeEmailAccountKey,
  CloudLedgerPayload,
} from '../services/cloudSync';
import { isSoundEnabled, setSoundEnabled } from '../utils/soundEffects';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'guest';

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

  // Unified 1-Email = 1-Account System
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

// Storage keys
const STORAGE_KEY_EXPENSES = 'aura_personal_expenses_v2';
const STORAGE_KEY_INCOMES = 'aura_personal_incomes_v2';
const STORAGE_KEY_BUDGET = 'aura_personal_budget_v2';
const STORAGE_KEY_THEME = 'aura_theme_v2';
const STORAGE_KEY_DAILY_SECTION = 'aura_daily_section_v2';
const STORAGE_KEY_ACCOUNT_EMAIL = 'aura_unified_account_email';
const STORAGE_KEY_CATEGORIES = 'aura_personal_categories_v2';
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
  if (VALID_TABS.includes(hash as PageTab)) {
    return hash as PageTab;
  }
  if (hash === 'budget' || hash === 'budgets-limits') return 'budget-limits';
  if (hash === 'export' || hash === 'export-backup') return 'backup';
  if (hash === 'settings' || hash === 'account') return 'budgets';

  const pathname = window.location.pathname.replace(/^\//, '').toLowerCase().trim();
  if (VALID_TABS.includes(pathname as PageTab)) {
    return pathname as PageTab;
  }
  if (pathname === 'budget' || pathname === 'budgets-limits') return 'budget-limits';
  if (pathname === 'export' || pathname === 'export-backup') return 'backup';
  if (pathname === 'settings' || pathname === 'account') return 'budgets';

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

  // Sound Effects preference state (Default: ON)
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

  useEffect(() => {
    const handlePrefChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      if (typeof customEvent.detail?.enabled === 'boolean') {
        setSoundEffectsEnabledState(customEvent.detail.enabled);
      }
    };
    window.addEventListener('aura_sound_pref_changed', handlePrefChange);
    return () => window.removeEventListener('aura_sound_pref_changed', handlePrefChange);
  }, []);

  // Local storage initial state
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXPENSES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load local expenses', e);
    }
    return getInitialSampleExpenses();
  });

  const [incomes, setIncomes] = useState<Income[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INCOMES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load local incomes', e);
    }
    return getInitialSampleIncomes();
  });

  const [budget, setBudget] = useState<BudgetConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BUDGET);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.currency) parsed.currency = '₹';
        return { ...DEFAULT_BUDGET, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load budget config', e);
    }
    return DEFAULT_BUDGET;
  });

  // Dynamic Categories (Single Source of Truth)
  const [categories, setCategories] = useState<Record<string, CategoryInfo>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return { ...CATEGORIES, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to load local categories', e);
    }
    return CATEGORIES;
  });

  const categoryList = useMemo(() => Object.values(categories), [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    } catch {}
  }, [categories]);

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

  // Navigation & UI state with browser URL synchronization (direct entry, refresh, popstate)
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

    // Sync initial hash if none exists
    if (!window.location.hash && !window.location.pathname.replace(/^\//, '')) {
      window.history.replaceState({ tab: activeTab }, '', `#/${activeTab}`);
    }

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [activeTab]);

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

  // Unified 1-Email = 1-Account State
  const [accountEmail, setAccountEmailState] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACCOUNT_EMAIL);
      if (saved && saved.includes('@')) {
        return saved.trim().toLowerCase();
      }
      const remembered =
        localStorage.getItem('aura_remembered_account') ||
        localStorage.getItem('aura_remembered_google_account');
      if (remembered) {
        const parsed = JSON.parse(remembered);
        if (parsed?.email && parsed.email.includes('@')) {
          return parsed.email.trim().toLowerCase();
        }
      }
      if (auth.currentUser?.email) {
        return auth.currentUser.email.trim().toLowerCase();
      }
    } catch {}
    return null;
  });

  // Real-time Cloud Sync State
  const [cloudUser, setCloudUser] = useState<User | null>(() => auth.currentUser);
  const [syncState, setSyncState] = useState<SyncState>(() => (accountEmail ? 'synced' : 'guest'));
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // References to keep callbacks fresh without triggering re-renders
  const isIncomingFromCloudRef = useRef(false);
  const cloudSaveTimerRef = useRef<any>(null);
  const expensesRef = useRef(expenses);
  const incomesRef = useRef(incomes);
  const budgetRef = useRef(budget);
  const accountEmailRef = useRef(accountEmail);

  useEffect(() => {
    expensesRef.current = expenses;
    try {
      localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
    } catch {}
  }, [expenses]);

  useEffect(() => {
    incomesRef.current = incomes;
    try {
      localStorage.setItem(STORAGE_KEY_INCOMES, JSON.stringify(incomes));
    } catch {}
  }, [incomes]);

  useEffect(() => {
    budgetRef.current = budget;
    try {
      localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify(budget));
    } catch {}
  }, [budget]);

  useEffect(() => {
    accountEmailRef.current = accountEmail;
  }, [accountEmail]);

  // Debounced cloud save function for both central Account email & Firebase User UID
  const scheduleCloudSave = useCallback((
    newExpenses: Expense[],
    newIncomes: Income[],
    newBudget: BudgetConfig
  ) => {
    const activeEmail = accountEmailRef.current;
    const currentUser = auth.currentUser;

    if ((!activeEmail && !currentUser) || isIncomingFromCloudRef.current) {
      return;
    }

    if (cloudSaveTimerRef.current) {
      clearTimeout(cloudSaveTimerRef.current);
    }

    setSyncState('syncing');
    cloudSaveTimerRef.current = setTimeout(async () => {
      let savedOk = false;

      // 1. Save to central 1-Email = 1-Account store (Computer & Mobile shared access)
      if (activeEmail) {
        const ok = await saveAccountLedgerToCloud(activeEmail, {
          expenses: newExpenses,
          incomes: newIncomes,
          budget: newBudget,
        });
        if (ok) savedOk = true;
      }

      // 2. Also save to user UID doc if authenticated with Google
      if (currentUser?.uid) {
        const ok = await saveUserLedgerToCloud(currentUser.uid, {
          expenses: newExpenses,
          incomes: newIncomes,
          budget: newBudget,
        });
        if (ok) savedOk = true;
      }

      if (savedOk) {
        setSyncState('synced');
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(now);
      } else {
        setSyncState('offline');
      }
    }, 300);
  }, []);

  // Connect or switch Account Email
  const connectAccountEmail = useCallback(async (email: string): Promise<boolean> => {
    const normalized = normalizeEmailAccountKey(email);
    if (!normalized || !normalized.includes('@')) return false;

    setAccountEmailState(normalized);
    try {
      localStorage.setItem(STORAGE_KEY_ACCOUNT_EMAIL, normalized);
    } catch {}

    setSyncState('syncing');
    try {
      const cloudData = await fetchAccountLedgerOnce(normalized);
      if (cloudData && (cloudData.expenses.length > 0 || cloudData.incomes.length > 0)) {
        isIncomingFromCloudRef.current = true;
        setExpenses(cloudData.expenses);
        setIncomes(cloudData.incomes);
        if (cloudData.budget) {
          setBudget((prev) => ({ ...prev, ...cloudData.budget }));
        }
        setTimeout(() => {
          isIncomingFromCloudRef.current = false;
        }, 300);
      } else {
        // First time initializing this email account in cloud: push existing ledger
        await saveAccountLedgerToCloud(normalized, {
          expenses: expensesRef.current,
          incomes: incomesRef.current,
          budget: budgetRef.current,
        });
      }
      setSyncState('synced');
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      return true;
    } catch (err) {
      console.warn('Connect account email notice:', err);
      setSyncState('offline');
      return false;
    }
  }, []);

  const disconnectAccountEmail = useCallback(() => {
    setAccountEmailState(null);
    try {
      localStorage.removeItem(STORAGE_KEY_ACCOUNT_EMAIL);
      localStorage.removeItem('aura_remembered_account');
      localStorage.removeItem('aura_remembered_google_account');
    } catch {}
    setSyncState('guest');
  }, []);

  // Listen to Firestore real-time updates for Central 1-Email = 1-Account store
  useEffect(() => {
    if (!accountEmail) return;

    setSyncState('syncing');

    // Subscribe to real-time changes on this email's central document
    const unsubscribeSnapshot = subscribeToAccountLedger(
      accountEmail,
      (cloudData: CloudLedgerPayload) => {
        isIncomingFromCloudRef.current = true;

        if (Array.isArray(cloudData.expenses)) {
          setExpenses(cloudData.expenses);
        }
        if (Array.isArray(cloudData.incomes)) {
          setIncomes(cloudData.incomes);
        }

        if (cloudData.budget) {
          setBudget((prev) => ({ ...prev, ...cloudData.budget }));
        }

        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(now);
        setSyncState('synced');

        setTimeout(() => {
          isIncomingFromCloudRef.current = false;
        }, 300);
      },
      (err) => {
        console.warn('Real-time account ledger listener notice:', err);
        setSyncState('offline');
      }
    );

    return () => {
      unsubscribeSnapshot();
    };
  }, [accountEmail]);

  // Listen to Firebase Auth state
  useEffect(() => {
    let unsubscribeUserSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCloudUser(user);

      if (unsubscribeUserSnapshot) {
        unsubscribeUserSnapshot();
        unsubscribeUserSnapshot = null;
      }

      if (user) {
        // Automatically sync email account if user signed in with Google
        if (user.email) {
          const userEmail = user.email.toLowerCase().trim();
          if (!accountEmailRef.current || accountEmailRef.current !== userEmail) {
            connectAccountEmail(userEmail);
          } else {
            setSyncState('synced');
          }
        }

        // Also maintain backup user UID subscription
        unsubscribeUserSnapshot = subscribeToUserLedger(
          user.uid,
          (cloudData: CloudLedgerPayload) => {
            if (!accountEmailRef.current) {
              isIncomingFromCloudRef.current = true;
              if (Array.isArray(cloudData.expenses)) setExpenses(cloudData.expenses);
              if (Array.isArray(cloudData.incomes)) setIncomes(cloudData.incomes);
              if (cloudData.budget) setBudget((prev) => ({ ...prev, ...cloudData.budget }));
              setSyncState('synced');
              setTimeout(() => {
                isIncomingFromCloudRef.current = false;
              }, 300);
            }
          },
          () => {}
        );
      } else if (!accountEmailRef.current) {
        setSyncState('guest');
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserSnapshot) unsubscribeUserSnapshot();
      if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
    };
  }, [connectAccountEmail]);

  // Manual Force Sync
  const forceSyncNow = async () => {
    const activeEmail = accountEmailRef.current;
    const user = auth.currentUser;

    if (!activeEmail && !user) return;
    setSyncState('syncing');

    try {
      if (activeEmail) {
        const cloudData = await fetchAccountLedgerOnce(activeEmail);
        if (cloudData) {
          isIncomingFromCloudRef.current = true;
          if (Array.isArray(cloudData.expenses)) setExpenses(cloudData.expenses);
          if (Array.isArray(cloudData.incomes)) setIncomes(cloudData.incomes);
          if (cloudData.budget) setBudget((prev) => ({ ...prev, ...cloudData.budget }));
          setTimeout(() => {
            isIncomingFromCloudRef.current = false;
          }, 300);
        } else {
          await saveAccountLedgerToCloud(activeEmail, {
            expenses: expensesRef.current,
            incomes: incomesRef.current,
            budget: budgetRef.current,
          });
        }
      } else if (user) {
        const cloudData = await fetchUserLedgerOnce(user.uid);
        if (cloudData) {
          isIncomingFromCloudRef.current = true;
          if (Array.isArray(cloudData.expenses)) setExpenses(cloudData.expenses);
          if (Array.isArray(cloudData.incomes)) setIncomes(cloudData.incomes);
          if (cloudData.budget) setBudget((prev) => ({ ...prev, ...cloudData.budget }));
          setTimeout(() => {
            isIncomingFromCloudRef.current = false;
          }, 300);
        }
      }
      setSyncState('synced');
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Manual sync failed:', err);
      setSyncState('offline');
    }
  };

  // Expense CRUD
  const addExpense = (newExp: Omit<Expense, 'id' | 'createdAt'>) => {
    const created: Expense = {
      ...newExp,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };
    const updated = [created, ...expensesRef.current];
    setExpenses(updated);
    scheduleCloudSave(updated, incomesRef.current, budgetRef.current);
  };

  const updateExpense = (id: string, updatedFields: Partial<Expense>) => {
    const updated = expensesRef.current.map((item) =>
      item.id === id ? { ...item, ...updatedFields } : item
    );
    setExpenses(updated);
    scheduleCloudSave(updated, incomesRef.current, budgetRef.current);
  };

  const deleteExpense = (id: string) => {
    const updated = expensesRef.current.filter((item) => item.id !== id);
    setExpenses(updated);
    scheduleCloudSave(updated, incomesRef.current, budgetRef.current);
  };

  // Income CRUD
  const addIncome = (newInc: Omit<Income, 'id' | 'createdAt'>) => {
    const created: Income = {
      ...newInc,
      id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };
    const updated = [created, ...incomesRef.current];
    setIncomes(updated);
    scheduleCloudSave(expensesRef.current, updated, budgetRef.current);
  };

  const updateIncome = (id: string, updatedFields: Partial<Income>) => {
    const updated = incomesRef.current.map((item) =>
      item.id === id ? { ...item, ...updatedFields } : item
    );
    setIncomes(updated);
    scheduleCloudSave(expensesRef.current, updated, budgetRef.current);
  };

  const deleteIncome = (id: string) => {
    const updated = incomesRef.current.filter((item) => item.id !== id);
    setIncomes(updated);
    scheduleCloudSave(expensesRef.current, updated, budgetRef.current);
  };

  // Category CRUD (Single Source of Truth)
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
      try {
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    return newCat;
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<CategoryInfo>) => {
    setCategories((prev) => {
      if (!prev[id]) return prev;
      const updated = { ...prev, [id]: { ...prev[id], ...updates } };
      try {
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const deleteCategory = useCallback((id: string): { success: boolean; reason?: string } => {
    const usedCount = expensesRef.current.filter((e) => e.category === id).length;
    if (usedCount > 0) {
      return {
        success: false,
        reason: `Cannot delete "${categories[id]?.name || id}" because it is currently used by ${usedCount} transaction${usedCount === 1 ? '' : 's'}. Please reassign or delete these transactions first.`,
      };
    }
    setCategories((prev) => {
      const copy = { ...prev };
      delete copy[id];
      try {
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(copy));
      } catch {}
      return copy;
    });
    return { success: true };
  }, [categories]);

  // Data management
  const clearAll = () => {
    setExpenses([]);
    setIncomes([]);
    scheduleCloudSave([], [], budgetRef.current);
  };

  const resetToSample = () => {
    const demo = getDemoSampleData();
    setExpenses(demo.expenses);
    setIncomes(demo.incomes);
    scheduleCloudSave(demo.expenses, demo.incomes, budgetRef.current);
  };

  const importAllData = (data: {
    expenses?: Expense[];
    incomes?: Income[];
    budget?: BudgetConfig;
    categories?: Record<string, CategoryInfo>;
  }) => {
    const newExpenses = Array.isArray(data.expenses) ? data.expenses : expensesRef.current;
    const newIncomes = Array.isArray(data.incomes) ? data.incomes : incomesRef.current;
    setExpenses(newExpenses);
    setIncomes(newIncomes);
    if (data.budget) {
      setBudget((prev) => ({ ...prev, ...data.budget }));
    }
    if (data.categories && typeof data.categories === 'object') {
      setCategories((prev) => ({ ...prev, ...data.categories }));
    }
    scheduleCloudSave(newExpenses, newIncomes, data.budget || budgetRef.current);
  };

  const updateBudget = (updates: Partial<BudgetConfig>) => {
    const newBudget = { ...budgetRef.current, ...updates };
    setBudget(newBudget);
    scheduleCloudSave(expensesRef.current, incomesRef.current, newBudget);
  };

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
        accountEmail,
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
