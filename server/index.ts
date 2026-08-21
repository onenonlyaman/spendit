import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import accountsRouter from './routes/accounts';
import transactionsRouter from './routes/transactions';
import categoriesRouter from './routes/categories';
import dailyNotesRouter from './routes/dailyNotes';
import goalsRouter from './routes/goals';
import recurringRouter from './routes/recurring';
import backupRouter from './routes/backup';
import { pool } from './db/pool';
import { initDatabase } from './db/init';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5001', 10);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW() as current_time');
    res.json({
      status: 'healthy',
      database: 'PostgreSQL connected',
      time: dbRes.rows[0].current_time,
      currency: '₹ INR',
    });
  } catch (err: any) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// API Routes
app.use('/api/accounts', accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/daily-notes', dailyNotesRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/recurring', recurringRouter);
app.use('/api/backup', backupRouter);

// Start server on 0.0.0.0 (accepts connections from 127.0.0.1 and localhost)
async function startServer() {
  try {
    await initDatabase().catch((err) => {
      console.warn('Database initialization note:', err.message);
    });
  } catch (e) {
    // Continue starting server
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ SpendIt PostgreSQL Backend Server running at http://127.0.0.1:${PORT}`);
  });
}

startServer();
