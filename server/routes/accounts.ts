import { Router } from 'express';
import { pool } from '../db/pool';

const router = Router();

// GET all accounts with real-time balance calculated from ledger
router.get('/', async (req, res) => {
  try {
    const accResult = await pool.query(`SELECT * FROM accounts ORDER BY created_at ASC`);
    const accounts = accResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      balance: parseFloat(row.balance),
      initialBalance: parseFloat(row.initial_balance),
      color: row.color,
      icon: row.icon,
      accountNumberMasked: row.account_number_masked,
      institution: row.institution,
    }));

    // Calculate live balances from transactions
    const txnResult = await pool.query(`SELECT type, amount, account_id, destination_account_id FROM transactions`);
    const balances: Record<string, number> = {};
    accounts.forEach(a => {
      balances[a.id] = a.initialBalance;
    });

    for (const t of txnResult.rows) {
      const amt = parseFloat(t.amount);
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

    const updatedAccounts = accounts.map(a => ({
      ...a,
      balance: Math.round((balances[a.id] ?? a.initialBalance) * 100) / 100,
    }));

    res.json(updatedAccounts);
  } catch (err: any) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST new account
router.post('/', async (req, res) => {
  try {
    const { name, type, initialBalance, color, icon, accountNumberMasked, institution } = req.body;
    const id = 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const initBal = parseFloat(initialBalance) || 0;

    await pool.query(
      `INSERT INTO accounts (id, name, type, balance, initial_balance, color, icon, account_number_masked, institution, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, name, type, initBal, initBal, color || '#8C6D37', icon || 'Banknote', accountNumberMasked || null, institution || null, Date.now()]
    );

    res.status(201).json({
      id,
      name,
      type,
      balance: initBal,
      initialBalance: initBal,
      color,
      icon,
      accountNumberMasked,
      institution,
    });
  } catch (err: any) {
    console.error('Error creating account:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update account
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, color, icon, institution, accountNumberMasked, initialBalance } = req.body;

    await pool.query(
      `UPDATE accounts
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           color = COALESCE($3, color),
           icon = COALESCE($4, icon),
           institution = COALESCE($5, institution),
           account_number_masked = COALESCE($6, account_number_masked),
           initial_balance = COALESCE($7, initial_balance)
       WHERE id = $8`,
      [
        name,
        type,
        color,
        icon,
        institution,
        accountNumberMasked,
        initialBalance !== undefined ? parseFloat(initialBalance) : null,
        id,
      ]
    );

    res.json({ success: true, id });
  } catch (err: any) {
    console.error('Error updating account:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE account
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM accounts WHERE id = $1`, [id]);
    res.json({ success: true, id });
  } catch (err: any) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
