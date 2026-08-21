import { Router } from 'express';
import { pool } from '../db/pool';
import { initDatabase } from '../db/init';

const router = Router();

// GET export full database backup
router.get('/export', async (req, res) => {
  try {
    const accounts = (await pool.query(`SELECT * FROM accounts`)).rows;
    const categories = (await pool.query(`SELECT * FROM categories`)).rows;
    const transactions = (await pool.query(`SELECT * FROM transactions`)).rows;
    const dailyNotes = (await pool.query(`SELECT * FROM daily_notes`)).rows;
    const goals = (await pool.query(`SELECT * FROM money_goals`)).rows;
    const recurring = (await pool.query(`SELECT * FROM recurring_items`)).rows;

    const dailyNotesMap: Record<string, any> = {};
    dailyNotes.forEach(n => {
      dailyNotesMap[n.date] = n;
    });

    res.json({
      version: 1,
      currency: '₹',
      exportedAt: new Date().toISOString(),
      accounts,
      categories,
      transactions,
      dailyNotes: dailyNotesMap,
      goals,
      recurring,
    });
  } catch (err: any) {
    console.error('Error exporting backup:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST reset database to clean factory Indian state
router.post('/reset', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM transactions`);
    await client.query(`DELETE FROM money_goals`);
    await client.query(`DELETE FROM daily_notes`);
    await client.query(`DELETE FROM recurring_items`);
    await client.query(`DELETE FROM accounts`);
    await client.query(`DELETE FROM categories`);
    await client.query('COMMIT');

    // Re-seed clean Indian accounts & categories
    await initDatabase();

    res.json({ success: true, message: 'Database reset to clean Indian defaults.' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error resetting database:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
