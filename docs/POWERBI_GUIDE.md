# FinTrack — Power BI Handoff

The project produces a clean `data/transactions.csv` dataset and PostgreSQL views that can be used as Power BI sources.

## Recommended model

Use `transactions` as the fact table and the following analytical views as pre-aggregated tables:

- `monthly_financial_summary`
- `category_spend_summary`
- `merchant_spend_summary`
- `daily_cashflow`

## Suggested KPI cards

- Total Income
- Total Expense
- Net Cash Flow
- Transaction Count
- Savings Rate

## Suggested visuals

- Monthly income vs expense column chart
- Running cash balance line chart
- Expense by category bar chart
- Expense share by category donut chart
- Monthly expense growth table
- Top merchants table

## Suggested slicers

- Date
- Transaction Type
- Category
- Merchant

The Power BI file itself is intentionally not stored in this repository; the dashboard can be recreated directly from the dataset/views above.
