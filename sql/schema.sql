CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    merchant TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant);

CREATE OR REPLACE VIEW monthly_financial_summary AS
SELECT
    DATE_TRUNC('month', date)::date AS month,
    SUM(amount) FILTER (WHERE type = 'income') AS income,
    SUM(amount) FILTER (WHERE type = 'expense') AS expense,
    SUM(amount) FILTER (WHERE type = 'income') -
      SUM(amount) FILTER (WHERE type = 'expense') AS net_cashflow,
    COUNT(*) AS transaction_count
FROM transactions
GROUP BY 1
ORDER BY 1;

CREATE OR REPLACE VIEW category_spend_summary AS
SELECT
    category,
    SUM(amount) AS total_spend,
    COUNT(*) AS transaction_count,
    ROUND(AVG(amount), 2) AS avg_transaction
FROM transactions
WHERE type = 'expense'
GROUP BY category
ORDER BY total_spend DESC;

CREATE OR REPLACE VIEW merchant_spend_summary AS
SELECT
    merchant,
    MAX(description) AS description,
    SUM(amount) AS total_spend,
    COUNT(*) AS transaction_count,
    ROUND(AVG(amount), 2) AS avg_transaction
FROM transactions
WHERE type = 'expense'
GROUP BY merchant
ORDER BY total_spend DESC;

CREATE OR REPLACE VIEW daily_cashflow AS
SELECT
    date,
    SUM(amount) FILTER (WHERE type = 'income') AS income,
    SUM(amount) FILTER (WHERE type = 'expense') AS expense,
    COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) -
      COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS net_cashflow
FROM transactions
GROUP BY date
ORDER BY date;

CREATE OR REPLACE VIEW transaction_quality AS
SELECT
    COUNT(*) AS total_rows,
    COUNT(*) FILTER (WHERE id IS NULL) AS null_ids,
    COUNT(*) FILTER (WHERE date IS NULL) AS null_dates,
    COUNT(*) FILTER (WHERE description IS NULL OR BTRIM(description) = '') AS blank_descriptions,
    COUNT(*) FILTER (WHERE amount IS NULL OR amount <= 0) AS invalid_amounts,
    COUNT(*) FILTER (WHERE type NOT IN ('income', 'expense')) AS invalid_types,
    COUNT(*) - COUNT(DISTINCT (date, description, amount, category, type, merchant)) AS duplicate_rows
FROM transactions;
