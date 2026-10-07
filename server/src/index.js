import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', database: rows[0]?.ok === 1 });
  } catch (error) {
    res.status(503).json({ status: 'error', database: false });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const { type, category, startDate, endDate, search, limit = 5000 } = req.query;
    const conditions = [];
    const values = [];

    if (type && ['income', 'expense'].includes(type)) {
      values.push(type);
      conditions.push(`type = $${values.length}`);
    }
    if (category) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }
    if (startDate) {
      values.push(startDate);
      conditions.push(`date >= $${values.length}`);
    }
    if (endDate) {
      values.push(endDate);
      conditions.push(`date <= $${values.length}`);
    }
    if (search) {
      values.push(`%${search}%`);
      conditions.push(`description ILIKE $${values.length}`);
    }

    values.push(Math.min(Number(limit) || 5000, 10000));
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT
          id,
          date::text AS date,
          description,
          amount::double precision AS amount,
          category,
          type,
          merchant
      FROM transactions
      ${where}
      ORDER BY date DESC, id DESC
      LIMIT $${values.length}
    `;

    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { date, description, amount, category, type, merchant } = req.body;
    if (!date || !description || !amount || !category || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'date, description, positive amount, category and valid type are required' });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    const finalMerchant = merchant || description.trim().toLowerCase().replace(/\s+/g, '_');
    const { rows } = await pool.query(
      `INSERT INTO transactions(date, description, amount, category, type, merchant)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, date, description, amount::double precision AS amount, category, type, merchant`,
      [date, description.trim(), parsedAmount, category.trim(), type, finalMerchant]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Transaction not found' });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

app.delete('/api/transactions', async (_req, res) => {
  try {
    await pool.query('TRUNCATE TABLE transactions RESTART IDENTITY');
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to clear transactions' });
  }
});

app.get('/api/analytics/overview', async (_req, res) => {
  try {
    const summary = await pool.query(`
      SELECT COALESCE(SUM(income), 0)::double precision AS income,
             COALESCE(SUM(expense), 0)::double precision AS expense,
             COALESCE(SUM(net_cashflow), 0)::double precision AS balance,
             COALESCE(SUM(transaction_count), 0)::int AS transaction_count
      FROM monthly_financial_summary
    `);

    const categories = await pool.query(`
      SELECT category, total_spend::numeric AS value
      FROM category_spend_summary
      ORDER BY total_spend DESC
    `);

    const trend = await pool.query(`
      SELECT date,
             net_cashflow::double precision AS net_cashflow,
             SUM(net_cashflow) OVER (ORDER BY date)::double precision AS running_balance
      FROM daily_cashflow
      ORDER BY date
    `);

    const quality = await pool.query('SELECT * FROM transaction_quality');

    res.json({
      summary: summary.rows[0],
      categories: categories.rows,
      trend: trend.rows,
      quality: quality.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

app.get('/api/analytics/monthly', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      WITH monthly AS (
        SELECT month, income::double precision, expense::double precision, net_cashflow::double precision
        FROM monthly_financial_summary
      )
      SELECT month, income, expense, net_cashflow,
             LAG(expense) OVER (ORDER BY month)::double precision AS previous_month_expense,
             ROUND(100.0 * (expense - LAG(expense) OVER (ORDER BY month)) /
                   NULLIF(LAG(expense) OVER (ORDER BY month), 0), 2) AS mom_expense_growth_pct
      FROM monthly
      ORDER BY month
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to compute monthly analytics' });
  }
});

app.listen(port, () => {
  console.log(`FinTrack API listening on http://localhost:${port}`);
});
