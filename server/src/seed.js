import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');
const schemaPath = path.join(ROOT, 'sql/schema.sql');
const csvPath = path.join(ROOT, 'data/transactions.csv');

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(',');
  return lines.map((line) => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

try {
  await pool.query(fs.readFileSync(schemaPath, 'utf8'));
  await pool.query('TRUNCATE TABLE transactions RESTART IDENTITY');

  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const text = `INSERT INTO transactions(date, description, amount, category, type, merchant)
                  VALUES ($1, $2, $3, $4, $5, $6)`;
    for (const row of rows) {
      await client.query(text, [
        row.date,
        row.description,
        Number(row.amount),
        row.category,
        row.type,
        row.merchant,
      ]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  console.log(`Seeded ${rows.length.toLocaleString()} transactions into PostgreSQL.`);
} catch (error) {
  console.error('Seeding failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
