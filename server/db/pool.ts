import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool, types } = pg;

// Parse numeric types from PostgreSQL directly as float numbers
types.setTypeParser(1700, (val: string) => parseFloat(val));

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/spendit_db',
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'spendit_db',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});
