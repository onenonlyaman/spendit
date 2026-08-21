-- SpendIt PostgreSQL DDL Schema

CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(32) NOT NULL,
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  initial_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  color VARCHAR(32) NOT NULL DEFAULT '#8C6D37',
  icon VARCHAR(64) NOT NULL DEFAULT 'Banknote',
  account_number_masked VARCHAR(32),
  institution VARCHAR(255),
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(64) NOT NULL DEFAULT 'Tag',
  color VARCHAR(32) NOT NULL DEFAULT '#C07D2B',
  monthly_budget NUMERIC(14, 2) DEFAULT 0.00,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(64) PRIMARY KEY,
  date VARCHAR(10) NOT NULL, -- YYYY-MM-DD
  time VARCHAR(8) NOT NULL, -- HH:mm
  description VARCHAR(255) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  type VARCHAR(32) NOT NULL, -- 'expense' | 'income' | 'transfer'
  account_id VARCHAR(64) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  destination_account_id VARCHAR(64) REFERENCES accounts(id) ON DELETE SET NULL,
  category_id VARCHAR(64) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  receipt_url TEXT,
  reconciled BOOLEAN DEFAULT FALSE,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

CREATE TABLE IF NOT EXISTS daily_notes (
  date VARCHAR(10) PRIMARY KEY, -- YYYY-MM-DD
  mood VARCHAR(32) DEFAULT 'peaceful',
  weather VARCHAR(32) DEFAULT 'sunny',
  location VARCHAR(255),
  reflection TEXT,
  sealed BOOLEAN DEFAULT FALSE,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS money_goals (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  target_amount NUMERIC(14, 2) NOT NULL,
  current_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  target_date VARCHAR(10) NOT NULL,
  category VARCHAR(64) NOT NULL DEFAULT 'Savings',
  color VARCHAR(32) NOT NULL DEFAULT '#C07D2B',
  icon VARCHAR(64) NOT NULL DEFAULT 'Target',
  notes TEXT,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS recurring_items (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  account_id VARCHAR(64) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id VARCHAR(64) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  frequency VARCHAR(32) NOT NULL DEFAULT 'monthly',
  day_of_month INT NOT NULL DEFAULT 1,
  last_logged_date VARCHAR(10),
  created_at BIGINT NOT NULL
);
