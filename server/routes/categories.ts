import { Router } from 'express';
import { pool } from '../db/pool';

const router = Router();

// GET all categories
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM categories ORDER BY created_at ASC`);
    const categories = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      monthlyBudget: parseFloat(row.monthly_budget || '0'),
    }));
    res.json(categories);
  } catch (err: any) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST new category
router.post('/', async (req, res) => {
  try {
    const { name, icon, color, monthlyBudget } = req.body;
    const id = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    await pool.query(
      `INSERT INTO categories (id, name, icon, color, monthly_budget, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, name, icon || 'Tag', color || '#C07D2B', parseFloat(monthlyBudget || '0'), Date.now()]
    );

    res.status(201).json({
      id,
      name,
      icon: icon || 'Tag',
      color: color || '#C07D2B',
      monthlyBudget: parseFloat(monthlyBudget || '0'),
    });
  } catch (err: any) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, color, monthlyBudget } = req.body;

    await pool.query(
      `UPDATE categories
       SET name = COALESCE($1, name),
           icon = COALESCE($2, icon),
           color = COALESCE($3, color),
           monthly_budget = COALESCE($4, monthly_budget)
       WHERE id = $5`,
      [name, icon, color, monthlyBudget !== undefined ? parseFloat(monthlyBudget) : null, id]
    );

    res.json({ success: true, id });
  } catch (err: any) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
