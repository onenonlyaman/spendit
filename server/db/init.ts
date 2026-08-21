import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

const DEFAULT_INDIAN_ACCOUNTS = [
  {
    id: 'acc_cash',
    name: 'Cash Pouch / Wallet',
    type: 'cash',
    balance: 0.00,
    initial_balance: 0.00,
    color: '#8C6D37',
    icon: 'Banknote',
    institution: 'Physical Cash (₹ INR)',
  },
  {
    id: 'acc_upi',
    name: 'UPI / GPay / Paytm Wallet',
    type: 'cash',
    balance: 0.00,
    initial_balance: 0.00,
    color: '#235789',
    icon: 'Smartphone',
    institution: 'Instant UPI',
  },
  {
    id: 'acc_bank_primary',
    name: 'Primary Bank (HDFC / SBI / ICICI)',
    type: 'bank',
    balance: 0.00,
    initial_balance: 0.00,
    color: '#2A6F4E',
    icon: 'Building2',
    accountNumberMasked: '•••• 4821',
    institution: 'Savings Account',
  },
  {
    id: 'acc_credit',
    name: 'Credit Card',
    type: 'credit',
    balance: 0.00,
    initial_balance: 0.00,
    color: '#B83A3A',
    icon: 'CreditCard',
    accountNumberMasked: '•••• 8109',
    institution: 'Credit Facility',
  },
  {
    id: 'acc_vault',
    name: 'Gold & Sinking Reserve Vault',
    type: 'savings',
    balance: 0.00,
    initial_balance: 0.00,
    color: '#C07D2B',
    icon: 'Vault',
    institution: 'Emergency Fund',
  }
];

const DEFAULT_INDIAN_CATEGORIES = [
  { id: 'cat_chai', name: 'Chai, Street Food & Dining', icon: 'Utensils', color: '#C07D2B', monthly_budget: 3500 },
  { id: 'cat_kirana', name: 'Kirana, Groceries & Milk', icon: 'ShoppingBag', color: '#2A6F4E', monthly_budget: 8000 },
  { id: 'cat_transit', name: 'Auto, Metro, Cab & Petrol', icon: 'Car', color: '#235789', monthly_budget: 3000 },
  { id: 'cat_rent', name: 'Rent & Society Maintenance', icon: 'Home', color: '#8C6D37', monthly_budget: 18000 },
  { id: 'cat_utilities', name: 'Electricity, WiFi & Recharge', icon: 'Zap', color: '#D97706', monthly_budget: 2500 },
  { id: 'cat_ott', name: 'OTT & Entertainment', icon: 'Film', color: '#7E52A0', monthly_budget: 1200 },
  { id: 'cat_health', name: 'Medicines & Healthcare', icon: 'HeartPulse', color: '#059669', monthly_budget: 1500 },
  { id: 'cat_learning', name: 'Books, Stationery & Craft', icon: 'BookOpen', color: '#4B5563', monthly_budget: 1000 },
  { id: 'cat_income', name: 'Salary, UPI Credit & Dividends', icon: 'TrendingUp', color: '#16A34A', monthly_budget: 0 },
];

export async function initDatabase() {
  const host = process.env.PGHOST || 'localhost';
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || 'root';
  const port = parseInt(process.env.PGPORT || '5432', 10);
  const targetDb = process.env.PGDATABASE || 'spendit_db';

  console.log(`Connecting to PostgreSQL host ${host}:${port} as user ${user}...`);

  // Step 1: Connect to default postgres DB to ensure spendit_db exists
  const rootClient = new Client({
    host,
    user,
    password,
    port,
    database: 'postgres',
  });

  try {
    await rootClient.connect();
    const checkDb = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDb]
    );

    if (checkDb.rowCount === 0) {
      console.log(`Creating database "${targetDb}"...`);
      await rootClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`✓ Database "${targetDb}" created successfully.`);
    } else {
      console.log(`✓ Database "${targetDb}" already exists.`);
    }
  } catch (err: any) {
    console.error('Error connecting to root postgres DB:', err.message);
  } finally {
    await rootClient.end();
  }

  // Step 2: Connect to target spendit_db and run DDL
  const dbClient = new Client({
    host,
    user,
    password,
    port,
    database: targetDb,
  });

  try {
    await dbClient.connect();
    console.log(`Connected to database "${targetDb}". Executing DDL schema...`);

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await dbClient.query(schemaSql);
    console.log('✓ DDL tables created successfully.');

    // Step 3: Seed default Indian accounts if empty
    const accCountRes = await dbClient.query(`SELECT COUNT(*) as count FROM accounts`);
    if (parseInt(accCountRes.rows[0].count, 10) === 0) {
      console.log('Seeding default Indian accounts...');
      for (const acc of DEFAULT_INDIAN_ACCOUNTS) {
        await dbClient.query(
          `INSERT INTO accounts (id, name, type, balance, initial_balance, color, icon, account_number_masked, institution, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            acc.id,
            acc.name,
            acc.type,
            acc.balance,
            acc.initial_balance,
            acc.color,
            acc.icon,
            acc.accountNumberMasked || null,
            acc.institution || null,
            Date.now(),
          ]
        );
      }
      console.log('✓ Seeded Indian accounts.');
    }

    // Step 4: Seed default Indian categories if empty
    const catCountRes = await dbClient.query(`SELECT COUNT(*) as count FROM categories`);
    if (parseInt(catCountRes.rows[0].count, 10) === 0) {
      console.log('Seeding default Indian categories...');
      for (const cat of DEFAULT_INDIAN_CATEGORIES) {
        await dbClient.query(
          `INSERT INTO categories (id, name, icon, color, monthly_budget, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            cat.id,
            cat.name,
            cat.icon,
            cat.color,
            cat.monthly_budget,
            Date.now(),
          ]
        );
      }
      console.log('✓ Seeded Indian categories.');
    }

    console.log('✨ PostgreSQL database is fully ready and localized for India (₹ INR)!');
  } catch (err: any) {
    console.error('Error initializing schema on spendit_db:', err.message);
    throw err;
  } finally {
    await dbClient.end();
  }
}

// Run directly if invoked from CLI
if (process.argv[1] && process.argv[1].endsWith('init.ts')) {
  initDatabase().catch((err) => {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  });
}
