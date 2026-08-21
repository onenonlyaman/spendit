import { Account, Category, RecurringItem, Transaction } from '../types';

export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): Account[] {
  // Compute balances from initialBalance + ledger transaction deltas
  return accounts.map(acc => {
    let currentBalance = acc.initialBalance;

    for (const t of transactions) {
      if (t.type === 'expense' && t.accountId === acc.id) {
        currentBalance -= t.amount;
      } else if (t.type === 'income' && t.accountId === acc.id) {
        currentBalance += t.amount;
      } else if (t.type === 'transfer') {
        if (t.accountId === acc.id) {
          // Outflow from source account
          currentBalance -= t.amount;
        }
        if (t.destinationAccountId === acc.id) {
          // Inflow to destination account
          currentBalance += t.amount;
        }
      }
    }

    return {
      ...acc,
      balance: Math.round(currentBalance * 100) / 100,
    };
  });
}

export function getDailyTotals(transactions: Transaction[], dateStr: string) {
  const dayTxns = transactions.filter(t => t.date === dateStr);
  
  let expense = 0;
  let income = 0;
  let transfer = 0;

  for (const t of dayTxns) {
    if (t.type === 'expense') expense += t.amount;
    else if (t.type === 'income') income += t.amount;
    else if (t.type === 'transfer') transfer += t.amount;
  }

  return {
    expense: Math.round(expense * 100) / 100,
    income: Math.round(income * 100) / 100,
    transfer: Math.round(transfer * 100) / 100,
    net: Math.round((income - expense) * 100) / 100,
    count: dayTxns.length,
    isNoSpendDay: expense === 0 && dayTxns.length > 0,
  };
}

export function getTrailing7DayAverage(transactions: Transaction[], referenceDateStr: string): number {
  const refDate = new Date(referenceDateStr + 'T12:00:00');
  let totalTrailingSpend = 0;
  let validDaysCount = 0;

  for (let i = 1; i <= 7; i++) {
    const d = new Date(refDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const daySpend = transactions
      .filter(t => t.date === dateStr && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    totalTrailingSpend += daySpend;
    validDaysCount++;
  }

  return validDaysCount > 0 ? Math.round((totalTrailingSpend / validDaysCount) * 100) / 100 : 0;
}

export interface MonthSummary {
  yearMonth: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number; // in percentage e.g. 32.5%
  biggestExpense: { description: string; amount: number; date: string } | null;
  noSpendDaysCount: number;
  avgDailySpend: number;
  totalDaysInMonth: number;
  daysElapsed: number;
}

export function getMonthSummary(transactions: Transaction[], yearMonthStr: string): MonthSummary {
  const [yearStr, monthStr] = yearMonthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthTxns = transactions.filter(t => t.date.startsWith(yearMonthStr));

  let totalIncome = 0;
  let totalExpense = 0;
  let biggestExpense: { description: string; amount: number; date: string } | null = null;

  // Track daily spends
  const dailySpendMap: Record<number, number> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    dailySpendMap[d] = 0;
  }

  for (const t of monthTxns) {
    const dayNum = parseInt(t.date.split('-')[2], 10);
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else if (t.type === 'expense') {
      totalExpense += t.amount;
      dailySpendMap[dayNum] = (dailySpendMap[dayNum] || 0) + t.amount;

      if (!biggestExpense || t.amount > biggestExpense.amount) {
        biggestExpense = {
          description: t.description,
          amount: t.amount,
          date: t.date,
        };
      }
    }
  }

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((Math.max(0, netSavings) / totalIncome) * 1000) / 10 : 0;

  // Count no-spend days up to current date or whole month
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
  const daysElapsed = isCurrentMonth ? Math.min(today.getDate(), daysInMonth) : daysInMonth;

  let noSpendDaysCount = 0;
  for (let d = 1; d <= daysElapsed; d++) {
    if (dailySpendMap[d] === 0) {
      noSpendDaysCount++;
    }
  }

  const avgDailySpend = daysElapsed > 0 ? Math.round((totalExpense / daysElapsed) * 100) / 100 : 0;

  return {
    yearMonth: yearMonthStr,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    netSavings: Math.round(netSavings * 100) / 100,
    savingsRate,
    biggestExpense,
    noSpendDaysCount,
    avgDailySpend,
    totalDaysInMonth: daysInMonth,
    daysElapsed,
  };
}

export interface CategoryBreakdownItem {
  category: Category;
  totalSpent: number;
  transactionCount: number;
  percentage: number;
  budget: number;
  isOverBudget: boolean;
}

export function getCategoryBreakdown(
  transactions: Transaction[],
  yearMonthStr: string,
  categories: Category[]
): CategoryBreakdownItem[] {
  const monthExpenses = transactions.filter(t => t.date.startsWith(yearMonthStr) && t.type === 'expense');
  const totalExpense = monthExpenses.reduce((sum, t) => sum + t.amount, 0);

  return categories.map(cat => {
    const catTxns = monthExpenses.filter(t => t.categoryId === cat.id);
    const totalSpent = catTxns.reduce((sum, t) => sum + t.amount, 0);
    const percentage = totalExpense > 0 ? Math.round((totalSpent / totalExpense) * 1000) / 10 : 0;
    const budget = cat.monthlyBudget || 0;
    const isOverBudget = budget > 0 && totalSpent > budget;

    return {
      category: cat,
      totalSpent: Math.round(totalSpent * 100) / 100,
      transactionCount: catTxns.length,
      percentage,
      budget,
      isOverBudget,
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);
}

export interface DayHeatmapItem {
  dayNumber: number;
  dateStr: string;
  spendAmount: number;
  incomeAmount: number;
  transactionCount: number;
  intensity: number; // 0 to 4
  isNoSpend: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export function getMonthlyHeatmap(transactions: Transaction[], yearMonthStr: string): DayHeatmapItem[] {
  const [yearStr, monthStr] = yearMonthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  const todayStr = new Date().toISOString().split('T')[0];

  const monthTxns = transactions.filter(t => t.date.startsWith(yearMonthStr));
  const dailySpend: Record<number, number> = {};
  const dailyIncome: Record<number, number> = {};
  const dailyCount: Record<number, number> = {};

  let maxDailySpend = 1;

  for (let d = 1; d <= daysInMonth; d++) {
    dailySpend[d] = 0;
    dailyIncome[d] = 0;
    dailyCount[d] = 0;
  }

  for (const t of monthTxns) {
    const day = parseInt(t.date.split('-')[2], 10);
    if (t.type === 'expense') {
      dailySpend[day] = (dailySpend[day] || 0) + t.amount;
      dailyCount[day] = (dailyCount[day] || 0) + 1;
      if (dailySpend[day] > maxDailySpend) maxDailySpend = dailySpend[day];
    } else if (t.type === 'income') {
      dailyIncome[day] = (dailyIncome[day] || 0) + t.amount;
      dailyCount[day] = (dailyCount[day] || 0) + 1;
    }
  }

  const items: DayHeatmapItem[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStrPadded = d.toString().padStart(2, '0');
    const dateStr = `${yearMonthStr}-${dayStrPadded}`;
    const spend = dailySpend[d];
    const isToday = dateStr === todayStr;
    const isFuture = dateStr > todayStr;
    const isNoSpend = !isFuture && spend === 0;

    let intensity = 0;
    if (spend > 0) {
      const ratio = spend / maxDailySpend;
      if (ratio > 0.75) intensity = 4;
      else if (ratio > 0.5) intensity = 3;
      else if (ratio > 0.25) intensity = 2;
      else intensity = 1;
    }

    items.push({
      dayNumber: d,
      dateStr,
      spendAmount: Math.round(spend * 100) / 100,
      incomeAmount: Math.round(dailyIncome[d] * 100) / 100,
      transactionCount: dailyCount[d],
      intensity,
      isNoSpend,
      isToday,
      isFuture,
    });
  }

  return items;
}

export function calculateSafeToSpend(
  projectedMonthlyIncome: number,
  fixedBills: number,
  savingsTarget: number,
  spentSoFar: number,
  daysRemaining: number
): { safeDailySpend: number; remainingAllowance: number; status: 'healthy' | 'caution' | 'critical' } {
  const discretionaryBudget = Math.max(0, projectedMonthlyIncome - fixedBills - savingsTarget);
  const remainingAllowance = discretionaryBudget - spentSoFar;
  const safeDaily = daysRemaining > 0 ? Math.max(0, remainingAllowance / daysRemaining) : Math.max(0, remainingAllowance);

  let status: 'healthy' | 'caution' | 'critical' = 'healthy';
  if (remainingAllowance <= 0) {
    status = 'critical';
  } else if (remainingAllowance < discretionaryBudget * 0.2) {
    status = 'caution';
  }

  return {
    safeDailySpend: Math.round(safeDaily * 100) / 100,
    remainingAllowance: Math.round(remainingAllowance * 100) / 100,
    status,
  };
}
