import { Router } from 'express';
import { pool } from '../db/pool';

const router = Router();

// GET all recurring items
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM recurring_items ORDER BY day_of_month ASC`);
    const items = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      amount: parseFloat(row.amount),
      accountId: row.account_id,
      categoryId: row.category_id,
      frequency: row.frequency,
      dayOfMonth: row.day_of_month,
      lastLoggedDate: row.last_logged_date,
    }));
    res.json(items);
  } catch (err: any) {
    console.error('Error fetching recurring:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET dynamic recurring and frequent spend suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const today = new Date();
    const currentDay = today.getDate();
    const currentYearMonth = today.toISOString().slice(0, 7); // YYYY-MM
    const todayStr = today.toISOString().split('T')[0];

    // 1. Fetch recurring items
    const recResult = await pool.query(`SELECT * FROM recurring_items ORDER BY day_of_month ASC`);

    // 2. Fetch all transactions logged this month to check if already recorded
    const monthTxns = await pool.query(
      `SELECT description, amount, date FROM transactions WHERE date LIKE $1`,
      [`${currentYearMonth}%`]
    );

    const dueSuggestions: any[] = [];

    for (const row of recResult.rows) {
      const recAmount = parseFloat(row.amount);
      const recDay = row.day_of_month;
      const recName = row.name;

      // Check if logged in current month
      const alreadyLogged = monthTxns.rows.some(
        t => t.description.toLowerCase().includes(recName.toLowerCase()) ||
             (Math.abs(parseFloat(t.amount) - recAmount) < 0.01 && t.description.toLowerCase().includes(recName.slice(0, 4).toLowerCase()))
      );

      const dayDiff = recDay - currentDay;

      let urgency: 'due_today' | 'upcoming_soon' | 'overdue' | null = null;
      if (!alreadyLogged) {
        if (recDay === currentDay) {
          urgency = 'due_today';
        } else if (recDay < currentDay) {
          urgency = 'overdue';
        } else if (dayDiff > 0 && dayDiff <= 5) {
          urgency = 'upcoming_soon';
        }
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
          formattedPrompt: `${row.name} ${recAmount}`,
        });
      }
    }

    // 3. Calculate top repetitive daily spends for quick 1-tap logging
    const frequentResult = await pool.query(
      `SELECT description, amount, category_id, account_id, COUNT(*) as frequency
       FROM transactions
       WHERE type = 'expense'
       GROUP BY description, amount, category_id, account_id
       HAVING COUNT(*) >= 2
       ORDER BY COUNT(*) DESC
       LIMIT 4`
    );

    const frequentSuggestions = frequentResult.rows.map(r => ({
      description: r.description,
      amount: parseFloat(r.amount),
      categoryId: r.category_id,
      accountId: r.account_id,
      frequency: parseInt(r.frequency, 10),
      prompt: `${r.description} ${r.amount}`,
    }));

    res.json({
      dueSuggestions,
      frequentSuggestions,
    });
  } catch (err: any) {
    console.error('Error computing recurring suggestions:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST create recurring item
router.post('/', async (req, res) => {
  try {
    const { name, amount, accountId, categoryId, frequency, dayOfMonth } = req.body;
    const id = 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const numAmount = parseFloat(amount) || 0;

    await pool.query(
      `INSERT INTO recurring_items (id, name, amount, account_id, category_id, frequency, day_of_month, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, name, numAmount, accountId, categoryId, frequency || 'monthly', parseInt(dayOfMonth, 10) || 1, Date.now()]
    );

    res.status(201).json({
      id,
      name,
      amount: numAmount,
      accountId,
      categoryId,
      frequency: frequency || 'monthly',
      dayOfMonth: parseInt(dayOfMonth, 10) || 1,
    });
  } catch (err: any) {
    console.error('Error creating recurring item:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST one-tap log recurring item
router.post('/:id/log', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { date, accountId } = req.body;

    await client.query('BEGIN');

    const recRes = await client.query(`SELECT * FROM recurring_items WHERE id = $1`, [id]);
    if (recRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Recurring item not found' });
    }

    const rec = recRes.rows[0];
    const txnId = 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const todayStr = date || new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    // Insert transaction
    await client.query(
      `INSERT INTO transactions
       (id, date, time, description, amount, type, account_id, category_id, tags, notes, reconciled, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        txnId,
        todayStr,
        timeStr,
        rec.name,
        parseFloat(rec.amount),
        'expense',
        accountId || rec.account_id,
        rec.category_id,
        ['#recurring', '#bill'],
        `Scheduled ${rec.frequency} recurring commitment`,
        true,
        Date.now(),
      ]
    );

    // Update last_logged_date
    await client.query(`UPDATE recurring_items SET last_logged_date = $1 WHERE id = $2`, [todayStr, id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      transactionId: txnId,
      message: `Recorded "${rec.name}" for ₹${rec.amount}`,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error logging recurring item:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT update recurring item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, accountId, categoryId, frequency, dayOfMonth } = req.body;

    await pool.query(
      `UPDATE recurring_items
       SET name = COALESCE($1, name),
           amount = COALESCE($2, amount),
           account_id = COALESCE($3, account_id),
           category_id = COALESCE($4, category_id),
           frequency = COALESCE($5, frequency),
           day_of_month = COALESCE($6, day_of_month)
       WHERE id = $7`,
      [
        name,
        amount !== undefined ? parseFloat(amount) : null,
        accountId,
        categoryId,
        frequency,
        dayOfMonth !== undefined ? parseInt(dayOfMonth, 10) : null,
        id,
      ]
    );

    res.json({ success: true, id });
  } catch (err: any) {
    console.error('Error updating recurring item:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE recurring item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM recurring_items WHERE id = $1`, [id]);
    res.json({ success: true, id });
  } catch (err: any) {
    console.error('Error deleting recurring item:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
