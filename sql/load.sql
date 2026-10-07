\set ON_ERROR_STOP on
TRUNCATE TABLE transactions RESTART IDENTITY;
\copy transactions(date, description, amount, category, type, merchant) FROM 'data/transactions.csv' WITH (FORMAT csv, HEADER true);
