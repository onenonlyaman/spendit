import Database from '@tauri-apps/plugin-sql';

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await Database.load('sqlite:spendit.db');

    // Enable foreign keys
    await db.execute('PRAGMA foreign_keys = ON;');

    // Create DDL Schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0.00,
        initial_balance REAL NOT NULL DEFAULT 0.00,
        color TEXT NOT NULL DEFAULT '#8C6D37',
        icon TEXT NOT NULL DEFAULT 'Banknote',
        account_number_masked TEXT,
        institution TEXT,
        created_at INTEGER NOT NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'Tag',
        color TEXT NOT NULL DEFAULT '#C07D2B',
        monthly_budget REAL DEFAULT 0.00,
        created_at INTEGER NOT NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        destination_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        tags TEXT DEFAULT '[]',
        notes TEXT,
        receipt_url TEXT,
        reconciled INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );
    `);

    await db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);`);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS daily_notes (
        date TEXT PRIMARY KEY,
        mood TEXT DEFAULT 'peaceful',
        weather TEXT DEFAULT 'sunny',
        location TEXT,
        reflection TEXT,
        sealed INTEGER DEFAULT 0,
        updated_at INTEGER NOT NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS money_goals (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        target_amount REAL NOT NULL,
        current_amount REAL NOT NULL DEFAULT 0.00,
        target_date TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Savings',
        color TEXT NOT NULL DEFAULT '#C07D2B',
        icon TEXT NOT NULL DEFAULT 'Target',
        notes TEXT,
        created_at INTEGER NOT NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS recurring_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        frequency TEXT NOT NULL DEFAULT 'monthly',
        day_of_month INTEGER NOT NULL DEFAULT 1,
        last_logged_date TEXT,
        created_at INTEGER NOT NULL
      );
    `);

    await seedStarterLedger(db);

    dbInstance = db;
    return db;
  })();

  return initPromise;
}

/**
 * A ledger with no accounts and no categories cannot accept a single entry:
 * transactions carry NOT NULL foreign keys to both. Seed the minimum viable
 * ledger on first launch so the first thing a new user types actually saves.
 *
 * Runs only when the table is empty, so it never fights a real ledger or a
 * restored backup, and never resurrects rows the user deliberately deleted.
 */
async function seedStarterLedger(db: Database): Promise<void> {
  const now = Date.now();

  const [{ count: accountCount }] = await db.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM accounts'
  );

  if (accountCount === 0) {
    const starterAccounts = [
      { id: 'acc_cash', name: 'Cash', type: 'cash', color: '#34C759', icon: 'Banknote' },
      { id: 'acc_upi', name: 'UPI', type: 'wallet', color: '#007AFF', icon: 'Smartphone' },
      { id: 'acc_bank', name: 'Bank Account', type: 'bank', color: '#5856D6', icon: 'Landmark' },
    ];

    for (const acc of starterAccounts) {
      await db.execute(
        `INSERT INTO accounts (id, name, type, balance, initial_balance, color, icon, created_at)
         VALUES ($1, $2, $3, 0, 0, $4, $5, $6)`,
        [acc.id, acc.name, acc.type, acc.color, acc.icon, now]
      );
    }
  }

  const [{ count: categoryCount }] = await db.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM categories'
  );

  if (categoryCount === 0) {
    const starterCategories = [
      { id: 'cat_food', name: 'Food & Drink', icon: 'UtensilsCrossed', color: '#FF9500' },
      { id: 'cat_groceries', name: 'Groceries', icon: 'ShoppingBasket', color: '#34C759' },
      { id: 'cat_transport', name: 'Transport', icon: 'Car', color: '#5AC8FA' },
      { id: 'cat_bills', name: 'Bills & Utilities', icon: 'ReceiptText', color: '#FF3B30' },
      { id: 'cat_shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#FF2D55' },
      { id: 'cat_health', name: 'Health', icon: 'HeartPulse', color: '#AF52DE' },
      { id: 'cat_income', name: 'Income', icon: 'TrendingUp', color: '#34C759' },
      { id: 'cat_transfer', name: 'Transfer', icon: 'ArrowRightLeft', color: '#8E8E93' },
      { id: 'cat_other', name: 'Other', icon: 'Tag', color: '#8E8E93' },
    ];

    for (const cat of starterCategories) {
      await db.execute(
        `INSERT INTO categories (id, name, icon, color, monthly_budget, created_at)
         VALUES ($1, $2, $3, $4, 0, $5)`,
        [cat.id, cat.name, cat.icon, cat.color, now]
      );
    }
  }
}
