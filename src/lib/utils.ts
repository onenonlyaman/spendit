import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Account, Category, Transaction } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currencySymbol: string = '₹',
  isPrivate: boolean = false
): string {
  if (isPrivate) {
    return '••••••';
  }
  const isNegative = amount < 0;
  const absVal = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${currencySymbol}${absVal}`;
}

export function formatDateLong(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateJournalHeader(dateStr: string): {
  dayName: string;
  monthName: string;
  dayNumber: number;
  year: number;
} {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return {
    dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
    monthName: date.toLocaleDateString('en-US', { month: 'long' }),
    dayNumber: d,
    year: y,
  };
}

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getRelativeDayOffset(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[]
): string {
  const headers = ['Date', 'Time', 'Type', 'Description', 'Amount', 'Account', 'Destination Account', 'Category', 'Tags', 'Notes', 'Reconciled'];
  
  const rows = transactions.map(t => {
    const acc = accounts.find(a => a.id === t.accountId)?.name || t.accountId;
    const destAcc = t.destinationAccountId ? accounts.find(a => a.id === t.destinationAccountId)?.name || t.destinationAccountId : '';
    const cat = categories.find(c => c.id === t.categoryId)?.name || t.categoryId;
    
    return [
      `"${t.date}"`,
      `"${t.time}"`,
      `"${t.type}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      `"${acc.replace(/"/g, '""')}"`,
      `"${destAcc.replace(/"/g, '""')}"`,
      `"${cat.replace(/"/g, '""')}"`,
      `"${t.tags.join(', ')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      t.reconciled ? 'Yes' : 'No'
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
