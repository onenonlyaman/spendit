export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  description: string;
  amount: number;
  type: TransactionType;
  accountId: string;
  destinationAccountId?: string; // For transfers
  categoryId: string;
  tags: string[];
  notes?: string;
  receiptUrl?: string; // base64 or URL
  reconciled: boolean;
  createdAt: number;
}

export type AccountType = 'cash' | 'bank' | 'credit' | 'savings' | 'investment';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  initialBalance: number;
  color: string;
  icon: string;
  accountNumberMasked?: string;
  institution?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlyBudget?: number;
}

export interface MoneyGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  color: string;
  icon: string;
  notes?: string;
}

export interface DailyNote {
  date: string; // YYYY-MM-DD
  mood: 'peaceful' | 'focused' | 'frugal' | 'celebratory' | 'stressed' | 'neutral';
  weather?: 'sunny' | 'rainy' | 'cloudy' | 'snowy';
  location?: string;
  reflection: string;
  sealed: boolean; // Has the user closed/sealed the day?
}

export interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  accountId: string;
  categoryId: string;
  frequency: 'monthly' | 'weekly' | 'yearly';
  dayOfMonth: number;
  lastLoggedDate?: string;
  autoLogged?: boolean;
}


export interface ParsedNLPInput {
  description: string;
  amount: number;
  type: TransactionType;
  accountId?: string;
  destinationAccountId?: string;
  categoryId?: string;
  tags: string[];
  notes?: string;
  time?: string; // "HH:mm" (e.g. "07:30", "12:23", "20:45")
  timeSlot?: 'morning' | 'noon' | 'evening' | 'night' | 'late_night';
}
