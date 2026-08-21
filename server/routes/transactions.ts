import { Router } from 'express';
import { pool } from '../db/pool';

const router = Router();

// GET all transactions
router.get('/', async (req, res) => {
  try {
    const { date, month, accountId, categoryId } = req.query;
    let queryText = `SELECT * FROM transactions WHERE 1=1`;
    const params: any[] = [];

    if (date) {
      params.push(date);
      queryText += ` AND date = $${params.length}`;
    } else if (month) {
      params.push(`${month}%`);
      queryText += ` AND date LIKE $${params.length}`;
    }

    if (accountId) {
      params.push(accountId);
      queryText += ` AND (account_id = $${params.length} OR destination_account_id = $${params.length})`;
    }

    if (categoryId) {
      params.push(categoryId);
      queryText += ` AND category_id = $${params.length}`;
    }

    queryText += ` ORDER BY date DESC, time DESC, created_at DESC`;

    const result = await pool.query(queryText, params);
    const txns = result.rows.map(row => ({
      id: row.id,
      date: row.date,
      time: row.time,
      description: row.description,
      amount: parseFloat(row.amount),
      type: row.type,
      accountId: row.account_id,
      destinationAccountId: row.destination_account_id,
      categoryId: row.category_id,
      tags: row.tags || [],
      notes: row.notes,
      receiptUrl: row.receipt_url,
      reconciled: row.reconciled,
      createdAt: parseInt(row.created_at, 10),
    }));

    res.json(txns);
  } catch (err: any) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST create transaction
router.post('/', async (req, res) => {
  try {
    const {
      date,
      time,
      description,
      amount,
      type,
      accountId,
      destinationAccountId,
      categoryId,
      tags,
      notes,
      receiptUrl,
      reconciled,
    } = req.body;

    const id = 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const now = Date.now();
    const numAmount = Math.round(parseFloat(amount) * 100) / 100;

    await pool.query(
      `INSERT INTO transactions
       (id, date, time, description, amount, type, account_id, destination_account_id, category_id, tags, notes, receipt_url, reconciled, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id,
        date,
        time || '12:00',
        description,
        numAmount,
        type || 'expense',
        accountId,
        destinationAccountId || null,
        categoryId,
        tags || [],
        notes || null,
        receiptUrl || null,
        reconciled || false,
        now,
      ]
    );

    res.status(201).json({
      id,
      date,
      time: time || '12:00',
      description,
      amount: numAmount,
      type: type || 'expense',
      accountId,
      destinationAccountId,
      categoryId,
      tags: tags || [],
      notes,
      receiptUrl,
      reconciled: reconciled || false,
      createdAt: now,
    });
  } catch (err: any) {
    console.error('Error adding transaction:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update transaction
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      time,
      description,
      amount,
      type,
      accountId,
      destinationAccountId,
      categoryId,
      tags,
      notes,
      receiptUrl,
      reconciled,
    } = req.body;

    await pool.query(
      `UPDATE transactions
       SET date = COALESCE($1, date),
           time = COALESCE($2, time),
           description = COALESCE($3, description),
           amount = COALESCE($4, amount),
           type = COALESCE($5, type),
           account_id = COALESCE($6, account_id),
           destination_account_id = COALESCE($7, destination_account_id),
           category_id = COALESCE($8, category_id),
           tags = COALESCE($9, tags),
           notes = COALESCE($10, notes),
           receipt_url = COALESCE($11, receipt_url),
           reconciled = COALESCE($12, reconciled)
       WHERE id = $13`,
      [
        date,
        time,
        description,
        amount ? parseFloat(amount) : null,
        type,
        accountId,
        destinationAccountId,
        categoryId,
        tags,
        notes,
        receiptUrl,
        reconciled,
        id,
      ]
    );

    res.json({ success: true, id });
  } catch (err: any) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH toggle reconcile
router.patch('/:id/reconcile', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE transactions SET reconciled = NOT reconciled WHERE id = $1 RETURNING reconciled`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ success: true, reconciled: result.rows[0].reconciled });
  } catch (err: any) {
    console.error('Error toggling reconcile:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM transactions WHERE id = $1`, [id]);
    res.json({ success: true, id });
  } catch (err: any) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
