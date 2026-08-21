import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { calculateAccountBalances } from '../lib/accounting';
import { getRelativeDayOffset, getTodayString } from '../lib/utils';
import { Account, Category, CustomReminder, DailyNote, MoneyGoal, RecurringItem, Transaction } from '../types';
import { DEFAULT_REMINDERS } from '../lib/notifications';

export type ActiveView = 'diary' | 'accounts' | 'chapters' | 'goals' | 'simulator' | 'search' | 'settings';

export const VIEW_ORDER: Record<ActiveView, number> = {
  diary: 0,
  accounts: 1,
  chapters: 2,
  goals: 3,
  simulator: 4,
  search: 5,
  settings: 6,
};

interface FinanceContextType {
  // State
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  goals: MoneyGoal[];
  dailyNotes: Record<string, DailyNote>;
  recurring: RecurringItem[];
  reminders: CustomReminder[];

  // Navigation & UI
  currentDiaryDate: string;
  activeView: ActiveView;
  navDirection: number;
  privacyMode: boolean;
  currencySymbol: string;
  isQuickAddOpen: boolean;
  theme: 'light' | 'dark';
  performanceMode: boolean;
  isLoading: boolean;
  searchQuery: string;
  /** The entry just written, so the ledger can show where it landed. */
  recentlyAddedId: string | null;

  // Navigation Setters
  setDiaryDate: (date: string) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  setActiveView: (view: ActiveView) => void;
  togglePrivacyMode: () => void;
  togglePerformanceMode: () => void;
  setCurrencySymbol: (sym: string) => void;
  setIsQuickAddOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setSearchQuery: (query: string) => void;
  refreshAllData: () => Promise<void>;

  // Transaction Operations
  addTransaction: (txn: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  toggleReconcile: (id: string) => Promise<void>;

  // Account Operations
  addAccount: (acc: Omit<Account, 'id' | 'balance'>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  transferFunds: (fromId: string, toId: string, amount: number, description?: string) => Promise<void>;

  // Category Operations
  addCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;

  // Goal Operations
  addGoal: (goal: Omit<MoneyGoal, 'id' | 'currentAmount'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<MoneyGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  contributeToGoal: (goalId: string, amount: number, fromAccountId: string) => Promise<void>;

  // Daily Notes Operations
  getNoteForDate: (date: string) => DailyNote;
  saveDailyNote: (date: string, updates: Partial<DailyNote>) => Promise<void>;
  toggleSealDay: (date: string) => Promise<void>;

  // Custom Reminders Operations
  addReminder: (reminder: Omit<CustomReminder, 'id' | 'createdAt'>) => Promise<CustomReminder>;
  updateReminder: (id: string, updates: Partial<CustomReminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  markReminderFired: (id: string) => Promise<void>;

  // Recurring Operations
  addRecurring: (item: Omit<RecurringItem, 'id'>) => Promise<void>;
  updateRecurring: (id: string, updates: Partial<RecurringItem>) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;

  // Backup & Reset
  exportBackup: () => Promise<any>;
  importBackup: (jsonStr: string) => Promise<boolean>;
  resetAllData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [rawAccounts, setRawAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<MoneyGoal[]>([]);
  const [dailyNotes, setDailyNotes] = useState<Record<string, DailyNote>>({});
  const [recurring, setRecurring] = useState<RecurringItem[]>([]);
  const [reminders, setReminders] = useState<CustomReminder[]>(() => {
    try {
      const saved = localStorage.getItem('spendit_custom_reminders');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse reminders from storage', e);
    }
    return DEFAULT_REMINDERS;
  });

  const [currentDiaryDate, setCurrentDiaryDate] = useState<string>(getTodayString());
  const [activeView, setActiveViewState] = useState<ActiveView>('diary');
  const [navDirection, setNavDirection] = useState<number>(0);

  const setActiveView = (nextView: ActiveView) => {
    setActiveViewState(current => {
      if (current === nextView) return current;
      const currentOrder = VIEW_ORDER[current] ?? 0;
      const nextOrder = VIEW_ORDER[nextView] ?? 0;
      setNavDirection(nextOrder >= currentOrder ? 1 : -1);
      return nextView;
    });
  };

  const [privacyMode, setPrivacyMode] = useState<boolean>(false);
  const [currencySymbol, setCurrencySymbol] = useState<string>('₹');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('spendit_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [performanceMode, setPerformanceMode] = useState<boolean>(() => {
    return localStorage.getItem('spendit_performance_mode') === 'true';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // The one authored moment in the app: a new entry settling into the ledger.
  // Without it the row simply exists, and the user has to hunt for what they
  // just wrote.
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Sync theme with document element and color-scheme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [theme]);

  // Sync performance mode (disables heavy blurs & spring animations)
  useEffect(() => {
    if (performanceMode) {
      document.documentElement.classList.add('performance-mode');
    } else {
      document.documentElement.classList.remove('performance-mode');
    }
  }, [performanceMode]);

  const togglePerformanceMode = () => {
    setPerformanceMode(prev => {
      const next = !prev;
      localStorage.setItem('spendit_performance_mode', String(next));
      return next;
    });
  };

  // Fetch all data from SQLite
  const refreshAllData = async () => {
    try {
      setIsLoading(true);
      const [accs, cats, txns, notes, gls, recs] = await Promise.all([
        api.getAccounts(),
        api.getCategories(),
        api.getTransactions(),
        api.getDailyNotes(),
        api.getGoals(),
        api.getRecurring(),
      ]);

      setRawAccounts(accs);
      setCategories(cats);
      setRawTransactions(txns);
      setDailyNotes(notes);
      setGoals(gls);
      setRecurring(recs);
    } catch (err) {
      console.error('Error fetching SQLite data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load from SQLite
  useEffect(() => {
    refreshAllData();
  }, []);

  // Compute live real-time account balances from transactions
  const accounts = useMemo(() => {
    return calculateAccountBalances(rawAccounts, rawTransactions);
  }, [rawAccounts, rawTransactions]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Never steal a keystroke that belongs to a control the user is editing.
      // SELECT matters as much as INPUT: type-ahead inside a dropdown is how
      // people pick an option, and single-letter shortcuts used to eat it.
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]')
      ) {
        return;
      }

      // A dialog owns the keyboard while it is open; navigating the page behind
      // it would leave the user somewhere they cannot see.
      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsQuickAddOpen(prev => !prev);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsQuickAddOpen(true);
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setPrivacyMode(prev => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setCurrentDiaryDate(getTodayString());
        setActiveView('diary');
      } else if (e.key === 'ArrowLeft' && activeView === 'diary') {
        goToPreviousDay();
      } else if (e.key === 'ArrowRight' && activeView === 'diary') {
        goToNextDay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, currentDiaryDate]);

  // Navigation handlers
  const goToPreviousDay = () => setCurrentDiaryDate(prev => getRelativeDayOffset(prev, -1));
  const goToNextDay = () => setCurrentDiaryDate(prev => getRelativeDayOffset(prev, 1));
  const goToToday = () => setCurrentDiaryDate(getTodayString());
  const togglePrivacyMode = () => setPrivacyMode(prev => !prev);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('spendit_theme', next);
      return next;
    });
  };

  // Transaction Actions
  const addTransaction = async (txnData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
    const created = await api.createTransaction(txnData);
    setRawTransactions(prev => [created, ...prev]);
    setRecentlyAddedId(created.id);
    window.setTimeout(() => {
      setRecentlyAddedId(current => (current === created.id ? null : current));
    }, 2400);
    return created;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    await api.updateTransaction(id, updates);
    setRawTransactions(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTransaction = async (id: string) => {
    await api.deleteTransaction(id);
    setRawTransactions(prev => prev.filter(t => t.id !== id));
  };

  const toggleReconcile = async (id: string) => {
    const nextReconciled = await api.toggleReconcile(id);
    setRawTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, reconciled: nextReconciled } : t))
    );
  };

  // Account Actions
  const addAccount = async (accData: Omit<Account, 'id' | 'balance'>) => {
    const created = await api.createAccount(accData);
    setRawAccounts(prev => [...prev, created]);
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    await api.updateAccount(id, updates);
    setRawAccounts(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteAccount = async (id: string) => {
    await api.deleteAccount(id);
    setRawAccounts(prev => prev.filter(a => a.id !== id));
  };

  const transferFunds = async (fromId: string, toId: string, amount: number, description?: string) => {
    const fromAcc = accounts.find(a => a.id === fromId);
    const toAcc = accounts.find(a => a.id === toId);
    if (!fromAcc || !toAcc || amount <= 0) return;

    await addTransaction({
      date: currentDiaryDate,
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      description: description || `Transfer: ${fromAcc.name} → ${toAcc.name}`,
      amount,
      type: 'transfer',
      accountId: fromId,
      destinationAccountId: toId,
      categoryId: categories[0]?.id || 'cat_transfer',
      tags: ['#transfer'],
      reconciled: true,
    });
  };

  // Category Actions
  const addCategory = async (catData: Omit<Category, 'id'>) => {
    const created = await api.createCategory(catData);
    setCategories(prev => [...prev, created]);
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    await api.updateCategory(id, updates);
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  // Goal Actions
  const addGoal = async (goalData: Omit<MoneyGoal, 'id' | 'currentAmount'>) => {
    const created = await api.createGoal(goalData);
    setGoals(prev => [...prev, created]);
  };

  const updateGoal = async (id: string, updates: Partial<MoneyGoal>) => {
    await api.updateGoal(id, updates);
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, ...updates } : g)));
  };

  const deleteGoal = async (id: string) => {
    await api.deleteGoal(id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const contributeToGoal = async (goalId: string, amount: number, fromAccountId: string) => {
    const updated = await api.contributeToGoal(goalId, amount, fromAccountId, currentDiaryDate);
    setGoals(prev => prev.map(g => (g.id === goalId ? updated : g)));
    await refreshAllData();
  };

  // Daily Notes Actions
  const getNoteForDate = (date: string): DailyNote => {
    return dailyNotes[date] || {
      date,
      mood: 'peaceful',
      weather: 'sunny',
      reflection: '',
      sealed: false,
    };
  };

  const saveDailyNote = async (date: string, updates: Partial<DailyNote>) => {
    const current = dailyNotes[date] || {
      date,
      mood: 'peaceful',
      weather: 'sunny',
      reflection: '',
      sealed: false,
    };
    const updated = { ...current, ...updates };
    setDailyNotes(prev => ({ ...prev, [date]: updated }));
    await api.saveDailyNote(date, updated);
  };

  const toggleSealDay = async (date: string) => {
    const current = dailyNotes[date] || {
      date,
      mood: 'peaceful',
      weather: 'sunny',
      reflection: '',
      sealed: false,
    };
    await saveDailyNote(date, { sealed: !current.sealed });
  };

  // Recurring Actions
  const addRecurring = async (itemData: Omit<RecurringItem, 'id'>) => {
    const created = await api.createRecurring(itemData);
    setRecurring(prev => [...prev, created]);
  };

  const updateRecurring = async (id: string, updates: Partial<RecurringItem>) => {
    await api.updateRecurring(id, updates);
    setRecurring(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)));
  };

  const deleteRecurring = async (id: string) => {
    await api.deleteRecurring(id);
    setRecurring(prev => prev.filter(r => r.id !== id));
  };

  // Custom Reminders Actions
  const saveRemindersToStorage = (items: CustomReminder[]) => {
    setReminders(items);
    try {
      localStorage.setItem('spendit_custom_reminders', JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save reminders to storage', e);
    }
  };

  const addReminder = async (reminderData: Omit<CustomReminder, 'id' | 'createdAt'>): Promise<CustomReminder> => {
    const newReminder: CustomReminder = {
      ...reminderData,
      id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    };
    const updated = [newReminder, ...reminders];
    saveRemindersToStorage(updated);
    return newReminder;
  };

  const updateReminder = async (id: string, updates: Partial<CustomReminder>) => {
    const updated = reminders.map(r => (r.id === id ? { ...r, ...updates } : r));
    saveRemindersToStorage(updated);
  };

  const deleteReminder = async (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    saveRemindersToStorage(updated);
  };

  const toggleReminder = async (id: string) => {
    const updated = reminders.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    saveRemindersToStorage(updated);
  };

  const markReminderFired = async (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updated = reminders.map(r => (r.id === id ? { ...r, lastTriggeredDate: todayStr } : r));
    saveRemindersToStorage(updated);
  };

  // Backup & Reset
  const exportBackup = async () => {
    const backupData = await api.exportBackup();
    return {
      ...backupData,
      reminders,
    };
  };

  const importBackup = async (jsonStr: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonStr);
      const ok = await api.importBackup(data);
      if (ok) {
        if (Array.isArray(data.reminders)) {
          saveRemindersToStorage(data.reminders);
        }
        await refreshAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const resetAllData = async () => {
    await api.resetDatabase();
    setRawTransactions([]);
    setRawAccounts([]);
    setCategories([]);
    setGoals([]);
    setDailyNotes({});
    setRecurring([]);
    saveRemindersToStorage(DEFAULT_REMINDERS);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions: rawTransactions,
        accounts,
        categories,
        goals,
        dailyNotes,
        recurring,
        reminders,
        currentDiaryDate,
        activeView,
        navDirection,
        privacyMode,
        currencySymbol,
        isQuickAddOpen,
        theme,
        performanceMode,
        isLoading,
        searchQuery,
        recentlyAddedId,
        setSearchQuery,
        setDiaryDate: setCurrentDiaryDate,
        goToPreviousDay,
        goToNextDay,
        goToToday,
        setActiveView,
        togglePrivacyMode,
        togglePerformanceMode,
        setCurrencySymbol,
        setIsQuickAddOpen,
        toggleTheme,
        refreshAllData,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        toggleReconcile,
        addAccount,
        updateAccount,
        deleteAccount,
        transferFunds,
        addCategory,
        updateCategory,
        addGoal,
        updateGoal,
        deleteGoal,
        contributeToGoal,
        getNoteForDate,
        saveDailyNote,
        toggleSealDay,
        addRecurring,
        updateRecurring,
        deleteRecurring,
        addReminder,
        updateReminder,
        deleteReminder,
        toggleReminder,
        markReminderFired,
        exportBackup,
        importBackup,
        resetAllData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
