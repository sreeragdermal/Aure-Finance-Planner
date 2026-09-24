import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Expense,
  Income,
  BudgetConfig,
  PageTab,
  DailySectionTab,
} from '../types/expense';
import { getInitialSampleExpenses, getInitialSampleIncomes, getDemoSampleData } from '../utils/sampleData';

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
  importAllData: (data: { expenses?: Expense[]; incomes?: Income[] }) => void;

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

  // Theme & Date
  darkMode: boolean;
  toggleDarkMode: () => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const DEFAULT_BUDGET: BudgetConfig = {
  daily: 500,
  weekly: 3500,
  monthly: 15000,
  monthlySavingsTarget: 10000,
  currency: '₹',
};

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

// Storage keys for personal clean usage
const STORAGE_KEY_EXPENSES = 'aura_personal_expenses_v2';
const STORAGE_KEY_INCOMES = 'aura_personal_incomes_v2';
const STORAGE_KEY_BUDGET = 'aura_personal_budget_v2';
const STORAGE_KEY_THEME = 'aura_theme_v2';
const STORAGE_KEY_DAILY_SECTION = 'aura_daily_section_v2';

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Dark mode
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

  // Expenses: Starts clean (0 records) for personal use
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXPENSES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load local expenses', e);
    }
    return getInitialSampleExpenses();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
    } catch (e) {
      console.warn('Failed to save expenses', e);
    }
  }, [expenses]);

  // Incomes: Starts clean (0 records) for personal use
  const [incomes, setIncomes] = useState<Income[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INCOMES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load local incomes', e);
    }
    return getInitialSampleIncomes();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INCOMES, JSON.stringify(incomes));
    } catch (e) {
      console.warn('Failed to save incomes', e);
    }
  }, [incomes]);

  // Budget
  const [budget, setBudget] = useState<BudgetConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BUDGET);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure Indian Rupee default currency
        if (!parsed.currency) {
          parsed.currency = '₹';
        }
        return { ...DEFAULT_BUDGET, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load budget config', e);
    }
    return DEFAULT_BUDGET;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify(budget));
    } catch (e) {
      console.warn('Failed to save budget', e);
    }
  }, [budget]);

  // Daily Section Tab (Expenses vs Income vs Both)
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

  // Page Tab & Modal
  const [activeTab, setActiveTab] = useState<PageTab>('daily');
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

  // Expense CRUD
  const addExpense = (newExp: Omit<Expense, 'id' | 'createdAt'>) => {
    const created: Expense = {
      ...newExp,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };
    setExpenses((prev) => [created, ...prev]);
  };

  const updateExpense = (id: string, updated: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  // Income CRUD
  const addIncome = (newInc: Omit<Income, 'id' | 'createdAt'>) => {
    const created: Income = {
      ...newInc,
      id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };
    setIncomes((prev) => [created, ...prev]);
  };

  const updateIncome = (id: string, updated: Partial<Income>) => {
    setIncomes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const deleteIncome = (id: string) => {
    setIncomes((prev) => prev.filter((item) => item.id !== id));
  };

  // Data management
  const clearAll = () => {
    setExpenses([]);
    setIncomes([]);
  };

  const resetToSample = () => {
    const demo = getDemoSampleData();
    setExpenses(demo.expenses);
    setIncomes(demo.incomes);
  };

  const importAllData = (data: { expenses?: Expense[]; incomes?: Income[] }) => {
    if (Array.isArray(data.expenses)) {
      setExpenses(data.expenses);
    }
    if (Array.isArray(data.incomes)) {
      setIncomes(data.incomes);
    }
  };

  const updateBudget = (updates: Partial<BudgetConfig>) => {
    setBudget((prev) => ({ ...prev, ...updates }));
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
        selectedDate,
        setSelectedDate,
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
