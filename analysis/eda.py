from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data' / 'transactions.csv'
OUT = ROOT / 'analysis' / 'outputs'
OUT.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(DATA, parse_dates=['date'])
df['month'] = df['date'].dt.to_period('M').astype(str)
df['day_type'] = df['date'].dt.dayofweek.map(lambda x: 'Weekend' if x >= 5 else 'Weekday')

expenses = df.loc[df['type'].eq('expense')].copy()
income = df.loc[df['type'].eq('income')].copy()

monthly = df.pivot_table(index='month', columns='type', values='amount', aggfunc='sum', fill_value=0)
monthly['net_cashflow'] = monthly.get('income', 0) - monthly.get('expense', 0)
monthly['savings_rate_pct'] = monthly['net_cashflow'].div(monthly['income'].replace(0, pd.NA)).mul(100).round(2)
monthly.to_csv(OUT / 'monthly_summary.csv')

category = expenses.groupby('category')['amount'].agg(['sum', 'count', 'mean']).sort_values('sum', ascending=False)
category.columns = ['total_spend', 'transaction_count', 'avg_transaction']
category.to_csv(OUT / 'category_summary.csv')

weekday = expenses.groupby('day_type')['amount'].agg(['count', 'sum', 'mean']).round(2)
weekday.to_csv(OUT / 'weekday_summary.csv')

# Robust outlier screening using the IQR rule.
q1 = expenses['amount'].quantile(0.25)
q3 = expenses['amount'].quantile(0.75)
iqr = q3 - q1
upper = q3 + 1.5 * iqr
outliers = expenses[expenses['amount'] > upper].sort_values('amount', ascending=False)
outliers.head(100).to_csv(OUT / 'expense_outliers.csv', index=False)

insights = {
    'transaction_count': int(len(df)),
    'months_covered': int(df['month'].nunique()),
    'income_total': float(income['amount'].sum()),
    'expense_total': float(expenses['amount'].sum()),
    'net_cashflow': float(income['amount'].sum() - expenses['amount'].sum()),
    'highest_spend_category': str(category.index[0]),
    'highest_spend_category_amount': float(category.iloc[0]['total_spend']),
    'highest_spend_category_share_pct': float(category.iloc[0]['total_spend'] / expenses['amount'].sum() * 100),
    'weekend_avg_vs_weekday_ratio': float(weekday.loc['Weekend', 'mean'] / weekday.loc['Weekday', 'mean']),
    'iqr_upper_bound': float(upper),
    'outlier_count': int(len(outliers)),
}

with (OUT / 'insights.txt').open('w', encoding='utf-8') as f:
    for key, value in insights.items():
        f.write(f'{key}: {value}\n')

# 1. Monthly cash flow.
monthly[['income', 'expense']].plot(kind='bar', figsize=(11, 5))
plt.title('Monthly Income vs Expense')
plt.ylabel('Amount (INR)')
plt.tight_layout()
plt.savefig(OUT / 'monthly_income_expense.png', dpi=160)
plt.close()

# 2. Category spend.
category['total_spend'].sort_values().plot(kind='barh', figsize=(9, 5))
plt.title('Expense by Category')
plt.xlabel('Spend (INR)')
plt.tight_layout()
plt.savefig(OUT / 'category_spend.png', dpi=160)
plt.close()

print('EDA complete')
for key, value in insights.items():
    print(f'{key}: {value}')
