-- FinTrack Analytical SQL Library (25+ queries)

-- Q01: Monthly income, expense, and net cash flow.
SELECT * FROM monthly_financial_summary;

-- Q02: Month-over-month expense growth using LAG.
WITH monthly AS (
    SELECT DATE_TRUNC('month', date)::date AS month, SUM(amount) AS expense
    FROM transactions WHERE type = 'expense' GROUP BY 1
)
SELECT month, expense,
       LAG(expense) OVER (ORDER BY month) AS previous_month_expense,
       ROUND(100.0 * (expense - LAG(expense) OVER (ORDER BY month)) /
             NULLIF(LAG(expense) OVER (ORDER BY month), 0), 2) AS mom_growth_pct
FROM monthly ORDER BY month;

-- Q03: Running cash balance with a window function.
WITH daily AS (
    SELECT date,
           SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS net_cashflow
    FROM transactions GROUP BY date
)
SELECT date, net_cashflow,
       SUM(net_cashflow) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING) AS running_balance
FROM daily ORDER BY date;

-- Q04: Expense share by category.
SELECT category, total_spend,
       ROUND(100.0 * total_spend / SUM(total_spend) OVER (), 2) AS expense_share_pct
FROM category_spend_summary ORDER BY total_spend DESC;

-- Q05: Category rank by total spend.
SELECT category, total_spend,
       RANK() OVER (ORDER BY total_spend DESC) AS spend_rank
FROM category_spend_summary;

-- Q06: Top 3 categories in each month.
WITH monthly_category AS (
    SELECT DATE_TRUNC('month', date)::date AS month, category, SUM(amount) AS spend
    FROM transactions WHERE type = 'expense'
    GROUP BY 1, 2
), ranked AS (
    SELECT *, RANK() OVER (PARTITION BY month ORDER BY spend DESC) AS rnk
    FROM monthly_category
)
SELECT * FROM ranked WHERE rnk <= 3 ORDER BY month, rnk;

-- Q07: Monthly savings rate.
WITH m AS (SELECT * FROM monthly_financial_summary)
SELECT month, income, expense, net_cashflow,
       ROUND(100.0 * net_cashflow / NULLIF(income, 0), 2) AS savings_rate_pct
FROM m ORDER BY month;

-- Q08: Weekend vs weekday expense behavior.
SELECT CASE WHEN EXTRACT(ISODOW FROM date) IN (6,7) THEN 'Weekend' ELSE 'Weekday' END AS day_type,
       COUNT(*) AS transactions, SUM(amount) AS spend, ROUND(AVG(amount), 2) AS avg_spend
FROM transactions WHERE type = 'expense'
GROUP BY 1 ORDER BY 1;

-- Q09: Daily expense ranking.
SELECT date, SUM(amount) AS daily_expense,
       RANK() OVER (ORDER BY SUM(amount) DESC) AS spend_rank
FROM transactions WHERE type = 'expense'
GROUP BY date ORDER BY daily_expense DESC;

-- Q10: 7-day rolling average expense.
WITH daily AS (
    SELECT date, SUM(amount) AS expense
    FROM transactions WHERE type = 'expense' GROUP BY date
)
SELECT date, expense,
       ROUND(AVG(expense) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS rolling_7d_avg
FROM daily ORDER BY date;

-- Q11: Top merchants by total spending.
SELECT * FROM merchant_spend_summary LIMIT 10;

-- Q12: Merchant contribution and cumulative share (Pareto analysis).
WITH merchant AS (
    SELECT merchant, SUM(amount) AS spend
    FROM transactions WHERE type = 'expense' GROUP BY merchant
)
SELECT merchant, spend,
       ROUND(100.0 * spend / SUM(spend) OVER (), 2) AS share_pct,
       ROUND(100.0 * SUM(spend) OVER (ORDER BY spend DESC ROWS UNBOUNDED PRECEDING) /
             SUM(spend) OVER (), 2) AS cumulative_share_pct
FROM merchant ORDER BY spend DESC;

-- Q13: High-value expense transactions above the 95th percentile.
WITH threshold AS (
    SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY amount) AS p95
    FROM transactions WHERE type = 'expense'
)
SELECT t.* FROM transactions t, threshold x
WHERE t.type = 'expense' AND t.amount > x.p95 ORDER BY t.amount DESC;

-- Q14: Category monthly contribution.
SELECT DATE_TRUNC('month', date)::date AS month,
       category, SUM(amount) AS spend
FROM transactions WHERE type = 'expense'
GROUP BY 1, 2 ORDER BY 1, 3 DESC;

-- Q15: Latest transaction in each category using ROW_NUMBER.
WITH ranked AS (
    SELECT t.*, ROW_NUMBER() OVER (PARTITION BY category ORDER BY date DESC, id DESC) AS rn
    FROM transactions t
)
SELECT * FROM ranked WHERE rn = 1;

-- Q16: Transaction count and average ticket by category.
SELECT category, COUNT(*) AS transaction_count, ROUND(AVG(amount), 2) AS avg_ticket,
       MIN(amount) AS min_ticket, MAX(amount) AS max_ticket
FROM transactions WHERE type = 'expense'
GROUP BY category ORDER BY transaction_count DESC;

-- Q17: Monthly transaction mix by income vs expense.
SELECT DATE_TRUNC('month', date)::date AS month, type,
       COUNT(*) AS transaction_count, SUM(amount) AS amount
FROM transactions GROUP BY 1, 2 ORDER BY 1, 2;

-- Q18: Months with expense greater than income.
SELECT month, income, expense, net_cashflow
FROM monthly_financial_summary
WHERE expense > income ORDER BY month;

-- Q19: Category with highest monthly spend.
WITH monthly_category AS (
    SELECT DATE_TRUNC('month', date)::date AS month, category, SUM(amount) AS spend
    FROM transactions WHERE type = 'expense' GROUP BY 1, 2
), ranked AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY month ORDER BY spend DESC) AS rn
    FROM monthly_category
)
SELECT month, category, spend FROM ranked WHERE rn = 1 ORDER BY month;

-- Q20: Repeat purchase / subscription candidates by description.
SELECT description, COUNT(*) AS occurrences,
       MIN(date) AS first_seen, MAX(date) AS last_seen,
       SUM(amount) AS total_spend
FROM transactions WHERE type = 'expense'
GROUP BY description HAVING COUNT(*) >= 6
ORDER BY occurrences DESC, total_spend DESC;

-- Q21: Month with highest expense.
SELECT month, expense
FROM monthly_financial_summary
ORDER BY expense DESC LIMIT 1;

-- Q22: Month with highest income.
SELECT month, income
FROM monthly_financial_summary
ORDER BY income DESC LIMIT 1;

-- Q23: Average daily spend by month.
SELECT DATE_TRUNC('month', date)::date AS month,
       ROUND(SUM(amount) / COUNT(DISTINCT date), 2) AS avg_daily_spend
FROM transactions WHERE type = 'expense'
GROUP BY 1 ORDER BY 1;

-- Q24: Data quality checks.
SELECT * FROM transaction_quality;

-- Q25: Potential duplicate records.
SELECT date, description, amount, category, type, merchant, COUNT(*) AS duplicate_count
FROM transactions
GROUP BY date, description, amount, category, type, merchant
HAVING COUNT(*) > 1 ORDER BY duplicate_count DESC;

-- Q26: Income source contribution.
WITH income AS (
    SELECT description, SUM(amount) AS income_amount
    FROM transactions WHERE type = 'income' GROUP BY description
)
SELECT description, income_amount,
       ROUND(100.0 * income_amount / SUM(income_amount) OVER (), 2) AS income_share_pct
FROM income ORDER BY income_amount DESC;
