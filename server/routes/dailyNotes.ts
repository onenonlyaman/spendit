import { Router } from 'express';
import { pool } from '../db/pool';

const router = Router();

// GET all daily notes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM daily_notes`);
    const notesMap: Record<string, any> = {};
    result.rows.forEach(row => {
      notesMap[row.date] = {
        date: row.date,
        mood: row.mood,
        weather: row.weather,
        location: row.location,
        reflection: row.reflection || '',
        sealed: row.sealed,
      };
    });
    res.json(notesMap);
  } catch (err: any) {
    console.error('Error fetching daily notes:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/daily-notes/:date - upsert daily note or toggle seal
router.put('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { mood, weather, location, reflection, sealed } = req.body;

    const existing = await pool.query(`SELECT * FROM daily_notes WHERE date = $1`, [date]);

    if (existing.rowCount === 0) {
      await pool.query(
        `INSERT INTO daily_notes (date, mood, weather, location, reflection, sealed, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          date,
          mood || 'peaceful',
          weather || 'sunny',
          location || null,
          reflection || '',
          sealed || false,
          Date.now(),
        ]
      );
    } else {
      await pool.query(
        `UPDATE daily_notes
         SET mood = COALESCE($1, mood),
             weather = COALESCE($2, weather),
             location = COALESCE($3, location),
             reflection = COALESCE($4, reflection),
             sealed = COALESCE($5, sealed),
             updated_at = $6
         WHERE date = $7`,
        [mood, weather, location, reflection, sealed, Date.now(), date]
      );
    }

    res.json({ success: true, date });
  } catch (err: any) {
    console.error('Error saving daily note:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
