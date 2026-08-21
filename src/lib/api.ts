import { Account, Category, DailyNote, MoneyGoal, RecurringItem, Transaction } from '../types';
import { getDb } from './db';

export interface RecurringSuggestion {
  id: string;
  name: string;
  amount: number;
  accountId: string;
  categoryId: string;
  dayOfMonth: number;
  urgency: 'due_today' | 'upcoming_soon' | 'overdue';
  daysUntilDue: number;
  formattedPrompt: string;
}

export interface FrequentSuggestion {
  description: string;
  amount: number;
  categoryId: string;
  accountId: string;
  frequency: number;
  prompt: string;
}

export interface SuggestionsResponse {
  dueSuggestions: RecurringSuggestion[];
  frequentSuggestions: FrequentSuggestion[];
}

export const api = {
  // Accounts
  async getAccounts(): Promise<Account[]> {
    const db = await getDb();
    const rows = await db.select<any[]>('SELECT * FROM accounts ORDER BY created_at ASC');
    const accounts: Account[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      balance: Number(row.balance) || 0,
      initialBalance: Number(row.initial_balance) || 0,
      color: row.color,
      icon: row.icon,
      accountNumberMasked: row.account_number_masked || undefined,
      institution: row.institution || undefined,
    }));

    // Compute live balance from transactions
    const txns = await db.select<any[]>('SELECT type, amount, account_id, destination_account_id FROM transactions');
    const balances: Record<string, number> = {};
    accounts.forEach(a => {
      balances[a.id] = a.initialBalance;
    });

    for (const t of txns) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'expense') {
        if (balances[t.account_id] !== undefined) balances[t.account_id] -= amt;
      } else if (t.type === 'income') {
        if (balances[t.account_id] !== undefined) balances[t.account_id] += amt;
      } else if (t.type === 'transfer') {
        if (balances[t.account_id] !== undefined) balances[t.account_id] -= amt;
        if (t.destination_account_id && balances[t.destination_account_id] !== undefined) {
          balances[t.destination_account_id] += amt;
        }
      }
    }

    return accounts.map(a => ({
      ...a,
      balance: Math.round((balances[a.id] ?? a.initialBalance) * 100) / 100,
    }));
  },

  async createAccount(acc: Omit<Account, 'id' | 'balance'>): Promise<Account> {
    const db = await getDb();
    const id = 'acc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const initBal = Number(acc.initialBalance) || 0;
    const now = Date.now();

    await db.execute(
      `INSERT INTO accounts (id, name, type, balance, initial_balance, color, icon, account_number_masked, institution, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        acc.name,
        acc.type,
        initBal,
        initBal,
        acc.color || '#8C6D37',
        acc.icon || 'Banknote',
        acc.accountNumberMasked || null,
        acc.institution || null,
        now,
      ]
    );

    return {
      id,
      name: acc.name,
      type: acc.type,
      balance: initBal,
      initialBalance: initBal,
      color: acc.color,
      icon: acc.icon,
      accountNumberMasked: acc.accountNumberMasked,
      institution: acc.institution,
    };
  },

  async updateAccount(id: string, updates: Partial<Account>): Promise<void> {
    const db = await getDb();
    const existing = await db.select<any[]>('SELECT * FROM accounts WHERE id = $1', [id]);
    if (existing.length === 0) throw new Error('Account not found');

    const curr = existing[0];
    const name = updates.name !== undefined ? updates.name : curr.name;
    const type = updates.type !== undefined ? updates.type : curr.type;
    const color = updates.color !== undefined ? updates.color : curr.color;
    const icon = updates.icon !== undefined ? updates.icon : curr.icon;
    const institution = updates.institution !== undefined ? updates.institution : curr.institution;
    const accountNumberMasked = updates.accountNumberMasked !== undefined ? updates.accountNumberMasked : curr.account_number_masked;
    const initialBalance = updates.initialBalance !== undefined ? Number(updates.initialBalance) : curr.initial_balance;

    await db.execute(
      `UPDATE accounts
       SET name = $1, type = $2, color = $3, icon = $4, institution = $5, account_number_masked = $6, initial_balance = $7
       WHERE id = $8`,
      [name, type, color, icon, institution, accountNumberMasked, initialBalance, id]
    );
  },

  async deleteAccount(id: string): Promise<void> {
    const db = await getDb();
    await db.execute('DELETE FROM accounts WHERE id = $1', [id]);
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const db = await getDb();
    const rows = await db.select<any[]>('SELECT * FROM categories ORDER BY created_at ASC');
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      monthlyBudget: row.monthly_budget !== null ? Number(row.monthly_budget) : undefined,
    }));
  },

  async createCategory(cat: Omit<Category, 'id'>): Promise<Category> {
    const db = await getDb();
    const id = 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = Date.now();
    const budget = cat.monthlyBudget !== undefined ? Number(cat.monthlyBudget) : 0;

    await db.execute(
      `INSERT INTO categories (id, name, icon, color, monthly_budget, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, cat.name, cat.icon || 'Tag', cat.color || '#C07D2B', budget, now]
    );

    return {
      id,
      name: cat.name,
      icon: cat.icon || 'Tag',
      color: cat.color || '#C07D2B',
      monthlyBudget: cat.monthlyBudget,
    };
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    const db = await getDb();
    const existing = await db.select<any[]>('SELECT * FROM categories WHERE id = $1', [id]);
    if (existing.length === 0) throw new Error('Category not found');

    const curr = existing[0];
    const name = updates.name !== undefined ? updates.name : curr.name;
    const icon = updates.icon !== undefined ? updates.icon : curr.icon;
    const color = updates.color !== undefined ? updates.color : curr.color;
    const monthlyBudget = updates.monthlyBudget !== undefined ? Number(updates.monthlyBudget) : curr.monthly_budget;

    await db.execute(
      `UPDATE categories SET name = $1, icon = $2, color = $3, monthly_budget = $4 WHERE id = $5`,
      [name, icon, color, monthlyBudget, id]
    );
  },

  // Transactions
  async getTransactions(filters?: { date?: string; month?: string; accountId?: string; categoryId?: string }): Promise<Transaction[]> {
    const db = await getDb();
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params: any[] = [];

    if (filters?.date) {
      params.push(filters.date);
      query += ` AND date = $${params.length}`;
    } else if (filters?.month) {
      params.push(`${filters.month}%`);
      query += ` AND date LIKE $${params.length}`;
    }

    if (filters?.accountId) {
      params.push(filters.accountId);
      query += ` AND (account_id = $${params.length} OR destination_account_id = $${params.length})`;
    }

    if (filters?.categoryId) {
      params.push(filters.categoryId);
      query += ` AND category_id = $${params.length}`;
    }

    query += ' ORDER BY date DESC, time DESC, created_at DESC';

    const rows = await db.select<any[]>(query, params);
    return rows.map(row => {
      let parsedTags: string[] = [];
      if (typeof row.tags === 'string') {
        try {
          parsedTags = JSON.parse(row.tags);
        } catch {
          parsedTags = row.tags ? [row.tags] : [];
        }
      } else if (Array.isArray(row.tags)) {
        parsedTags = row.tags;
      }

      return {
        id: row.id,
        date: row.date,
        time: row.time,
        description: row.description,
        amount: Number(row.amount) || 0,
        type: row.type,
        accountId: row.account_id,
        destinationAccountId: row.destination_account_id || undefined,
        categoryId: row.category_id,
        tags: parsedTags,
        notes: row.notes || undefined,
        receiptUrl: row.receipt_url || undefined,
        reconciled: Boolean(row.reconciled),
        createdAt: Number(row.created_at) || 0,
      };
    });
  },

  async createTransaction(txn: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const db = await getDb();
    const id = 'txn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = Date.now();
    const numAmount = Math.round((Number(txn.amount) || 0) * 100) / 100;
    const tagsJson = JSON.stringify(txn.tags || []);

    await db.execute(
      `INSERT INTO transactions
       (id, date, time, description, amount, type, account_id, destination_account_id, category_id, tags, notes, receipt_url, reconciled, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id,
        txn.date,
        txn.time || '12:00',
        txn.description,
        numAmount,
        txn.type || 'expense',
        txn.accountId,
        txn.destinationAccountId || null,
        txn.categoryId,
        tagsJson,
        txn.notes || null,
        txn.receiptUrl || null,
        txn.reconciled ? 1 : 0,
        now,
      ]
    );

    return {
      id,
      date: txn.date,
      time: txn.time || '12:00',
      description: txn.description,
      amount: numAmount,
      type: txn.type || 'expense',
      accountId: txn.accountId,
      destinationAccountId: txn.destinationAccountId,
      categoryId: txn.categoryId,
      tags: txn.tags || [],
      notes: txn.notes,
      receiptUrl: txn.receiptUrl,
      reconciled: Boolean(txn.reconciled),
      createdAt: now,
    };
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    const db = await getDb();
    const existing = await db.select<any[]>('SELECT * FROM transactions WHERE id = $1', [id]);
    if (existing.length === 0) throw new Error('Transaction not found');

    const curr = existing[0];
    const date = updates.date !== undefined ? updates.date : curr.date;
    const time = updates.time !== undefined ? updates.time : curr.time;
    const description = updates.description !== undefined ? updates.description : curr.description;
    const amount = updates.amount !== undefined ? Number(updates.amount) : curr.amount;
    const type = updates.type !== undefined ? updates.type : curr.type;
    const accountId = updates.accountId !== undefined ? updates.accountId : curr.account_id;
    const destinationAccountId = updates.destinationAccountId !== undefined ? updates.destinationAccountId : curr.destination_account_id;
    const categoryId = updates.categoryId !== undefined ? updates.categoryId : curr.category_id;
    const tags = updates.tags !== undefined ? JSON.stringify(updates.tags) : curr.tags;
    const notes = updates.notes !== undefined ? updates.notes : curr.notes;
    const receiptUrl = updates.receiptUrl !== undefined ? updates.receiptUrl : curr.receipt_url;
    const reconciled = updates.reconciled !== undefined ? (updates.reconciled ? 1 : 0) : curr.reconciled;

    await db.execute(
      `UPDATE transactions
       SET date = $1, time = $2, description = $3, amount = $4, type = $5, account_id = $6,
           destination_account_id = $7, category_id = $8, tags = $9, notes = $10, receipt_url = $11, reconciled = $12
       WHERE id = $13`,
      [date, time, description, amount, type, accountId, destinationAccountId, categoryId, tags, notes, receiptUrl, reconciled, id]
    );
  },

  async deleteTransaction(id: string): Promise<void> {
    const db = await getDb();
    await db.execute('DELETE FROM transactions WHERE id = $1', [id]);
  },

  async toggleReconcile(id: string): Promise<boolean> {
    const db = await getDb();
    const existing = await db.select<any[]>('SELECT reconciled FROM transactions WHERE id = $1', [id]);
    if (existing.length === 0) throw new Error('Transaction not found');

    const nextVal = existing[0].reconciled ? 0 : 1;
    await db.execute('UPDATE transactions SET reconciled = $1 WHERE id = $2', [nextVal, id]);
    return nextVal === 1;
  },

  // Daily Notes
  async getDailyNotes(): Promise<Record<string, DailyNote>> {
    const db = await getDb();
    const rows = await db.select<any[]>('SELECT * FROM daily_notes');
    const result: Record<string, DailyNote> = {};
    rows.forEach(row => {
      result[row.date] = {
        date: row.date,
        mood: row.mood || 'peaceful',
        weather: row.weather || undefined,
        location: row.location || undefined,
        reflection: row.reflection || '',
        sealed: Boolean(row.sealed),
      };
    });
    return result;
  },

  async saveDailyNote(date: string, note: Partial<DailyNote>): Promise<void> {
    const db = await getDb();
    const now = Date.now();
    const existing = await db.select<any[]>('SELECT * FROM daily_notes WHERE date = $1', [date]);

    if (existing.length > 0) {
      const curr = existing[0];
      const mood = note.mood !== undefined ? note.mood : curr.mood;
      const weather = note.weather !== undefined ? note.weather : curr.weather;
      const location = note.location !== undefined ? note.location : curr.location;
      const reflection = note.reflection !== undefined ? note.reflection : curr.reflection;
      const sealed = note.sealed !== undefined ? (note.sealed ? 1 : 0) : curr.sealed;

      await db.execute(
        `UPDATE daily_notes
         SET mood = $1, weather = $2, location = $3, reflection = $4, sealed = $5, updated_at = $6
         WHERE date = $7`,
        [mood, weather, location, reflection, sealed, now, date]
      );
    } else {
      await db.execute(
        `INSERT INTO daily_notes (date, mood, weather, location, reflection, sealed, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          date,
          note.mood || 'peaceful',
          note.weather || null,
          note.location || null,
          note.reflection || '',
          note.sealed ? 1 : 0,
          now,
        ]
      );
    }
  },

  // Goals
  async getGoals(): Promise<MoneyGoal[]> {
    const db = await getDb();
    const rows = await db.select<any[]>('SELECT * FROM money_goals ORDER BY created_at ASC');
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      targetAmount: Number(row.target_amount) || 0,
      currentAmount: Number(row.current_amount) || 0,
      targetDate: row.target_date,
      category: row.category,
      color: row.color,
      icon: row.icon,
      notes: row.notes || undefined,
    }));
  },

  async createGoal(goal: Omit<MoneyGoal, 'id' | 'currentAmount'>): Promise<MoneyGoal> {
    const db = await getDb();
    const id = 'goal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = Date.now();
    const targetAmt = Number(goal.targetAmount) || 0;

    await db.execute(
      `INSERT INTO money_goals (id, name, target_amount, current_amount, target_date, category, color, icon, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        goal.name,
        targetAmt,
        0,
        goal.targetDate,
        goal.category || 'Savings',
        goal.color || '#C07D2B',
        goal.icon || 'Target',
        goal.notes || null,
        now,
      ]
    );

    return {
      id,
      name: goal.name,
      targetAmount: targetAmt,
      currentAmount: 0,
      targetDate: goal.targetDate,
      category: goal.category || 'Savings',
      color: goal.color || '#C07D2B',
      icon: goal.icon || 'Target',
      notes: goal.notes,
    };
  },

  async updateGoal(id: string, updates: Partial<MoneyGoal>): Promise<void> {
    const db = await getDb();
    const existing = await db.select<any[]>('SELECT * FROM money_goals WHERE id = $1', [id]);
    if (existing.length === 0) throw new Error('Goal not found');

    const curr = existing[0];
    const name = updates.name !== undefined ? updates.name : curr.name;
    const targetAmount = updates.targetAmount !== undefined ? Number(updates.targetAmount) : curr.target_amount;
    const currentAmount = updates.currentAmount !== undefined ? Number(updates.currentAmount) : curr.current_amount;
    const targetDate = updates.targetDate !== undefined ? updates.targetDate : curr.target_date;
    const category = updates.category !== undefined ? updates.category : curr.category;
    const color = updates.color !== undefined ? updates.color : curr.color;
    const icon = updates.icon !== undefined ? updates.icon : curr.icon;
    const notes = updates.notes !== undefined ? updates.notes : curr.notes;

    await db.execute(
      `UPDATE money_goals
       SET name = $1, target_amount = $2, current_amount = $3, target_date = $4, category = $5, color = $6, icon = $7, notes = $8
       WHERE id = $9`,
      [name, targetAmount, currentAmount, targetDate, category, color, icon, notes, id]
    );
  },

  async deleteGoal(id: string): Promise<void> {
    const db = await getDb();
    await db.execute('DELETE FROM money_goals WHERE id = $1', [id]);
  },

  async contributeToGoal(id: string, amount: number, fromAccountId: string, date?: string): Promise<MoneyGoal> {
    const db = await getDb();
    const existing = await db.select<any[]>('SELECT * FROM money_goals WHERE id = $1', [id]);
    if (existing.length === 0) throw new Error('Goal not found');

    const curr = existing[0];
    const newAmount = Math.round(((Number(curr.current_amount) || 0) + amount) * 100) / 100;
    await db.execute('UPDATE money_goals SET current_amount = $1 WHERE id = $2', [newAmount, id]);

    // Create a transaction record for the goal contribution
    const today = date || new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const txnId = 'txn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = Date.now();

    // Find or fallback category
    const categories = await db.select<any[]>('SELECT id FROM categories LIMIT 1');
    const categoryId = categories[0]?.id || 'cat_savings';

    await db.execute(
      `INSERT INTO transactions
       (id, date, time, description, amount, type, account_id, destination_account_id, category_id, tags, notes, receipt_url, reconciled, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        txnId,
        today,
        time,
        `Goal Contribution: ${curr.name}`,
        amount,
        'expense',
        fromAccountId,
        null,
        categoryId,
        JSON.stringify(['#goal', `#${curr.name.replace(/\s+/g, '_')}`]),
        `Contribution toward ${curr.name}`,
        null,
        1,
        now,
      ]
    );

    return {
      id: curr.id,
      name: curr.name,
      targetAmount: Number(curr.target_amount) || 0,
      currentAmount: newAmount,
      targetDate: curr.target_date,
      category: curr.category,
      color: curr.color,
      icon: curr.icon,
      notes: curr.notes || undefined,
    };
  },

  // Recurring
  async getRecurring(): Promise<RecurringItem[]> {
    const db = await getDb();
    const rows = await db.select<any[]>('SELECT * FROM recurring_items ORDER BY day_of_month ASC');
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      amount: Number(row.amount) || 0,
      accountId: row.account_id,
      categoryId: row.category_id,
      frequency: row.frequency,
      dayOfMonth: Number(row.day_of_month) || 1,
      lastLoggedDate: row.last_logged_date || undefined,
    }));
  },

  async createRecurring(item: Omit<RecurringItem, 'id'>): Promise<RecurringItem> {
    const db = await getDb();
    const id = 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = Date.now();
    const amount = Number(item.amount) || 0;
    const day = Number(item.dayOfMonth) || 1;

    await db.execute(
      `INSERT INTO recurring_items (id, name, amount, account_id, category_id, frequency, day_of_month, last_logged_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, item.name, amount, item.accountId, item.categoryId, item.frequency || 'monthly', day, null, now]
    );

    return {
      id,
      name: item.name,
      amount,
      accountId: item.accountId,
      categoryId: item.categoryId,
      frequency: item.frequency || 'monthly',
      dayOfMonth: day,
    };
  },

  async updateRecurring(id: string, updates: Partial<RecurringItem>): Promise<void> {
    const db = await getDb();
    const existing = await db.select<any[]>('SELECT * FROM recurring_items WHERE id = $1', [id]);
    if (existing.length === 0) throw new Error('Recurring item not found');

    const curr = existing[0];
    const name = updates.name !== undefined ? updates.name : curr.name;
    const amount = updates.amount !== undefined ? Number(updates.amount) : curr.amount;
    const accountId = updates.accountId !== undefined ? updates.accountId : curr.account_id;
    const categoryId = updates.categoryId !== undefined ? updates.categoryId : curr.category_id;
    const frequency = updates.frequency !== undefined ? updates.frequency : curr.frequency;
    const dayOfMonth = updates.dayOfMonth !== undefined ? Number(updates.dayOfMonth) : curr.day_of_month;
    const lastLoggedDate = updates.lastLoggedDate !== undefined ? updates.lastLoggedDate : curr.last_logged_date;

    await db.execute(
      `UPDATE recurring_items
       SET name = $1, amount = $2, account_id = $3, category_id = $4, frequency = $5, day_of_month = $6, last_logged_date = $7
       WHERE id = $8`,
      [name, amount, accountId, categoryId, frequency, dayOfMonth, lastLoggedDate, id]
    );
  },

  async deleteRecurring(id: string): Promise<void> {
    const db = await getDb();
    await db.execute('DELETE FROM recurring_items WHERE id = $1', [id]);
  },

  async getSuggestions(): Promise<SuggestionsResponse> {
    const db = await getDb();
    const today = new Date();
    const currentDay = today.getDate();
    const currentYearMonth = today.toISOString().slice(0, 7); // YYYY-MM

    const recResult = await db.select<any[]>('SELECT * FROM recurring_items ORDER BY day_of_month ASC');
    const monthTxns = await db.select<any[]>('SELECT description, amount, date FROM transactions WHERE date LIKE $1', [
      `${currentYearMonth}%`,
    ]);

    const dueSuggestions: RecurringSuggestion[] = [];

    for (const row of recResult) {
      const recAmount = Number(row.amount);
      const recDay = Number(row.day_of_month);
      const recName = row.name;

      const alreadyLogged = monthTxns.some(
        t =>
          t.description.toLowerCase().includes(recName.toLowerCase()) ||
          (Math.abs(Number(t.amount) - recAmount) < 0.01 &&
            t.description.toLowerCase().includes(recName.slice(0, 4).toLowerCase()))
      );

      const dayDiff = recDay - currentDay;
      let urgency: 'due_today' | 'upcoming_soon' | 'overdue' | null = null;
      if (!alreadyLogged) {
        if (dayDiff === 0) urgency = 'due_today';
        else if (dayDiff > 0 && dayDiff <= 3) urgency = 'upcoming_soon';
        else if (dayDiff < 0 && dayDiff >= -5) urgency = 'overdue';
      }

      if (urgency) {
        dueSuggestions.push({
          id: row.id,
          name: row.name,
          amount: recAmount,
          accountId: row.account_id,
          categoryId: row.category_id,
          dayOfMonth: recDay,
          urgency,
          daysUntilDue: dayDiff,
          formattedPrompt: `${recName} (₹${recAmount.toLocaleString('en-IN')})`,
        });
      }
    }

    // Frequent Suggestions: Find recurring spending patterns
    const pastTxns = await db.select<any[]>(
      `SELECT description, amount, category_id, account_id, COUNT(*) as freq
       FROM transactions
       WHERE type = 'expense'
       GROUP BY description, amount, category_id, account_id
       HAVING COUNT(*) >= 3
       ORDER BY COUNT(*) DESC
       LIMIT 5`
    );

    const frequentSuggestions: FrequentSuggestion[] = pastTxns.map(row => ({
      description: row.description,
      amount: Number(row.amount),
      categoryId: row.category_id,
      accountId: row.account_id,
      frequency: Number(row.freq),
      prompt: `${row.description} · ₹${Number(row.amount)}`,
    }));

    return {
      dueSuggestions,
      frequentSuggestions,
    };
  },

  async logRecurringItem(id: string, accountId?: string, date?: string): Promise<void> {
    const db = await getDb();
    const existing = await db.select<any[]>('SELECT * FROM recurring_items WHERE id = $1', [id]);
    if (existing.length === 0) throw new Error('Recurring item not found');

    const item = existing[0];
    const logDate = date || new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const targetAccountId = accountId || item.account_id;
    const txnId = 'txn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = Date.now();

    await db.execute(
      `INSERT INTO transactions
       (id, date, time, description, amount, type, account_id, destination_account_id, category_id, tags, notes, receipt_url, reconciled, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        txnId,
        logDate,
        time,
        item.name,
        Number(item.amount),
        'expense',
        targetAccountId,
        null,
        item.category_id,
        JSON.stringify(['#recurring']),
        `Automated recurring entry for ${item.name}`,
        null,
        1,
        now,
      ]
    );

    await db.execute('UPDATE recurring_items SET last_logged_date = $1 WHERE id = $2', [logDate, id]);
  },

  // Backup & Reset
  async exportBackup(): Promise<any> {
    const db = await getDb();
    const accounts = await db.select<any[]>('SELECT * FROM accounts');
    const categories = await db.select<any[]>('SELECT * FROM categories');
    const transactions = await db.select<any[]>('SELECT * FROM transactions');
    const dailyNotes = await db.select<any[]>('SELECT * FROM daily_notes');
    const goals = await db.select<any[]>('SELECT * FROM money_goals');
    const recurring = await db.select<any[]>('SELECT * FROM recurring_items');

    const dailyNotesMap: Record<string, any> = {};
    dailyNotes.forEach(n => {
      dailyNotesMap[n.date] = {
        date: n.date,
        mood: n.mood,
        weather: n.weather,
        location: n.location,
        reflection: n.reflection,
        sealed: Boolean(n.sealed),
      };
    });

    return {
      version: 2,
      currency: '₹',
      exportedAt: new Date().toISOString(),
      accounts: accounts.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: Number(a.balance),
        initialBalance: Number(a.initial_balance),
        color: a.color,
        icon: a.icon,
        accountNumberMasked: a.account_number_masked,
        institution: a.institution,
      })),
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        monthlyBudget: c.monthly_budget,
      })),
      transactions: transactions.map(t => ({
        id: t.id,
        date: t.date,
        time: t.time,
        description: t.description,
        amount: Number(t.amount),
        type: t.type,
        accountId: t.account_id,
        destinationAccountId: t.destination_account_id,
        categoryId: t.category_id,
        tags: typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags,
        notes: t.notes,
        receiptUrl: t.receipt_url,
        reconciled: Boolean(t.reconciled),
        createdAt: Number(t.created_at),
      })),
      dailyNotes: dailyNotesMap,
      goals: goals.map(g => ({
        id: g.id,
        name: g.name,
        targetAmount: Number(g.target_amount),
        currentAmount: Number(g.current_amount),
        targetDate: g.target_date,
        category: g.category,
        color: g.color,
        icon: g.icon,
        notes: g.notes,
      })),
      recurring: recurring.map(r => ({
        id: r.id,
        name: r.name,
        amount: Number(r.amount),
        accountId: r.account_id,
        categoryId: r.category_id,
        frequency: r.frequency,
        dayOfMonth: Number(r.day_of_month),
        lastLoggedDate: r.last_logged_date,
      })),
    };
  },

  async importBackup(data: any): Promise<boolean> {
    try {
      const db = await getDb();

      // Clear existing tables
      await db.execute('DELETE FROM transactions;');
      await db.execute('DELETE FROM money_goals;');
      await db.execute('DELETE FROM daily_notes;');
      await db.execute('DELETE FROM recurring_items;');
      await db.execute('DELETE FROM accounts;');
      await db.execute('DELETE FROM categories;');

      // Insert Accounts
      if (Array.isArray(data.accounts)) {
        for (const a of data.accounts) {
          await db.execute(
            `INSERT INTO accounts (id, name, type, balance, initial_balance, color, icon, account_number_masked, institution, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              a.id,
              a.name,
              a.type,
              Number(a.balance || 0),
              Number(a.initialBalance || a.initial_balance || 0),
              a.color || '#8C6D37',
              a.icon || 'Banknote',
              a.accountNumberMasked || a.account_number_masked || null,
              a.institution || null,
              a.createdAt || a.created_at || Date.now(),
            ]
          );
        }
      }

      // Insert Categories
      if (Array.isArray(data.categories)) {
        for (const c of data.categories) {
          await db.execute(
            `INSERT INTO categories (id, name, icon, color, monthly_budget, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              c.id,
              c.name,
              c.icon || 'Tag',
              c.color || '#C07D2B',
              c.monthlyBudget !== undefined ? Number(c.monthlyBudget) : (c.monthly_budget !== undefined ? Number(c.monthly_budget) : 0),
              c.createdAt || c.created_at || Date.now(),
            ]
          );
        }
      }

      // Insert Transactions
      if (Array.isArray(data.transactions)) {
        for (const t of data.transactions) {
          await db.execute(
            `INSERT INTO transactions
             (id, date, time, description, amount, type, account_id, destination_account_id, category_id, tags, notes, receipt_url, reconciled, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [
              t.id,
              t.date,
              t.time || '12:00',
              t.description,
              Number(t.amount || 0),
              t.type || 'expense',
              t.accountId || t.account_id,
              t.destinationAccountId || t.destination_account_id || null,
              t.categoryId || t.category_id,
              JSON.stringify(t.tags || []),
              t.notes || null,
              t.receiptUrl || t.receipt_url || null,
              t.reconciled ? 1 : 0,
              t.createdAt || t.created_at || Date.now(),
            ]
          );
        }
      }

      // Insert Daily Notes
      if (data.dailyNotes && typeof data.dailyNotes === 'object') {
        const notes = Array.isArray(data.dailyNotes) ? data.dailyNotes : Object.values(data.dailyNotes);
        for (const n of notes as any[]) {
          await db.execute(
            `INSERT INTO daily_notes (date, mood, weather, location, reflection, sealed, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              n.date,
              n.mood || 'peaceful',
              n.weather || null,
              n.location || null,
              n.reflection || '',
              n.sealed ? 1 : 0,
              Date.now(),
            ]
          );
        }
      }

      // Insert Goals
      if (Array.isArray(data.goals)) {
        for (const g of data.goals) {
          await db.execute(
            `INSERT INTO money_goals (id, name, target_amount, current_amount, target_date, category, color, icon, notes, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              g.id,
              g.name,
              Number(g.targetAmount || g.target_amount || 0),
              Number(g.currentAmount || g.current_amount || 0),
              g.targetDate || g.target_date,
              g.category || 'Savings',
              g.color || '#C07D2B',
              g.icon || 'Target',
              g.notes || null,
              g.createdAt || g.created_at || Date.now(),
            ]
          );
        }
      }

      // Insert Recurring
      if (Array.isArray(data.recurring)) {
        for (const r of data.recurring) {
          await db.execute(
            `INSERT INTO recurring_items (id, name, amount, account_id, category_id, frequency, day_of_month, last_logged_date, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              r.id,
              r.name,
              Number(r.amount || 0),
              r.accountId || r.account_id,
              r.categoryId || r.category_id,
              r.frequency || 'monthly',
              Number(r.dayOfMonth || r.day_of_month || 1),
              r.lastLoggedDate || r.last_logged_date || null,
              r.createdAt || r.created_at || Date.now(),
            ]
          );
        }
      }

      return true;
    } catch (err) {
      console.error('Failed to import backup:', err);
      return false;
    }
  },

  async resetDatabase(): Promise<void> {
    const db = await getDb();
    await db.execute('DELETE FROM transactions;');
    await db.execute('DELETE FROM money_goals;');
    await db.execute('DELETE FROM daily_notes;');
    await db.execute('DELETE FROM recurring_items;');
    await db.execute('DELETE FROM accounts;');
    await db.execute('DELETE FROM categories;');
  },
};
