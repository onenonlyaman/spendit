import { Router } from 'express';
import { pool } from '../db/pool';

const router = Router();

// GET all money goals / jars
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM money_goals ORDER BY created_at ASC`);
    const goals = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      targetAmount: parseFloat(row.target_amount),
      currentAmount: parseFloat(row.current_amount),
      targetDate: row.target_date,
      category: row.category,
      color: row.color,
      icon: row.icon,
      notes: row.notes,
    }));
    res.json(goals);
  } catch (err: any) {
    console.error('Error fetching goals:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST create goal
router.post('/', async (req, res) => {
  try {
    const { name, targetAmount, targetDate, category, color, icon, notes } = req.body;
    const id = 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const targetNum = parseFloat(targetAmount) || 0;

    await pool.query(
      `INSERT INTO money_goals (id, name, target_amount, current_amount, target_date, category, color, icon, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        name,
        targetNum,
        0.00,
        targetDate || '2026-12-31',
        category || 'Savings',
        color || '#C07D2B',
        icon || 'Target',
        notes || null,
        Date.now(),
      ]
    );

    res.status(201).json({
      id,
      name,
      targetAmount: targetNum,
      currentAmount: 0.00,
      targetDate,
      category,
      color,
      icon,
      notes,
    });
  } catch (err: any) {
    console.error('Error creating goal:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update goal
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, targetAmount, currentAmount, targetDate, category, color, icon, notes } = req.body;

    await pool.query(
      `UPDATE money_goals
       SET name = COALESCE($1, name),
           target_amount = COALESCE($2, target_amount),
           current_amount = COALESCE($3, current_amount),
           target_date = COALESCE($4, target_date),
           category = COALESCE($5, category),
           color = COALESCE($6, color),
           icon = COALESCE($7, icon),
           notes = COALESCE($8, notes)
       WHERE id = $9`,
      [
        name,
        targetAmount !== undefined ? parseFloat(targetAmount) : null,
        currentAmount !== undefined ? parseFloat(currentAmount) : null,
        targetDate,
        category,
        color,
        icon,
        notes,
        id,
      ]
    );

    res.json({ success: true, id });
  } catch (err: any) {
    console.error('Error updating goal:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE goal
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM money_goals WHERE id = $1`, [id]);
    res.json({ success: true, id });
  } catch (err: any) {
    console.error('Error deleting goal:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST contribute to goal
router.post('/:id/contribute', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { amount, fromAccountId, date } = req.body;
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    await client.query('BEGIN');

    // 1. Update goal amount
    const goalRes = await client.query(
      `UPDATE money_goals SET current_amount = current_amount + $1 WHERE id = $2 RETURNING *`,
      [numAmount, id]
    );

    if (goalRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Goal not found' });
    }

    const updatedGoal = goalRes.rows[0];

    // 2. Log transaction
    const txnId = 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const todayStr = date || new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    // Pick first category or savings
    const catRes = await client.query(`SELECT id FROM categories LIMIT 1`);
    const catId = catRes.rows[0]?.id || 'cat_chai';

    await client.query(
      `INSERT INTO transactions
       (id, date, time, description, amount, type, account_id, category_id, tags, notes, reconciled, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        txnId,
        todayStr,
        timeStr,
        `Allocation: ${updatedGoal.name}`,
        numAmount,
        'expense',
        fromAccountId,
        catId,
        ['#goal', '#savings', `#${updatedGoal.category.toLowerCase()}`],
        `Sinking fund deposit into "${updatedGoal.name}"`,
        true,
        Date.now(),
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      goal: {
        id: updatedGoal.id,
        name: updatedGoal.name,
        targetAmount: parseFloat(updatedGoal.target_amount),
        currentAmount: parseFloat(updatedGoal.current_amount),
        targetDate: updatedGoal.target_date,
        category: updatedGoal.category,
        color: updatedGoal.color,
        icon: updatedGoal.icon,
        notes: updatedGoal.notes,
      },
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error contributing to goal:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
