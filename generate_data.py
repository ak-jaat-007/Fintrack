from __future__ import annotations

import csv
from datetime import date, timedelta
from pathlib import Path

OUT = Path(__file__).parent / 'data' / 'transactions.csv'
OUT.parent.mkdir(parents=True, exist_ok=True)

# Rent and salary are modelled as recurring monthly transactions instead of
# being randomly generated. This keeps the synthetic dataset closer to a
# realistic personal-finance ledger while preserving 1,800 total rows.
EXPENSE_CATEGORIES = [
    ('Food', ['Grocery Store', 'Restaurant', 'Cafe', 'Food Delivery', 'Supermarket'], (250, 5000), 24),
    ('Transport', ['Uber Ride', 'Metro Recharge', 'Fuel Station', 'Cab Ride'], (120, 2500), 15),
    ('Entertainment', ['Netflix Subscription', 'Movie Tickets', 'Spotify', 'Gaming Store'], (199, 2200), 7),
    ('Healthcare', ['Pharmacy', 'Clinic Visit', 'Diagnostics'], (300, 4500), 8),
    ('Shopping', ['Amazon Purchase', 'Clothing Store', 'Electronics Store', 'Home Store'], (500, 9000), 18),
    ('Utilities', ['Electricity Bill', 'Internet Bill', 'Mobile Recharge'], (400, 3500), 10),
    ('Education', ['Online Course', 'Books', 'Certification'], (300, 6000), 8),
]
INCOME_TYPES = [
    ('Freelance Client', 8000, 28000),
    ('Bonus', 5000, 25000),
    ('Interest Credit', 300, 3500),
]

start = date(2025, 10, 1)
months = 12
TOTAL_ROWS = 1800
MONTHLY_SALARY_COUNT = months
MONTHLY_RENT_COUNT = months
OTHER_INCOME_COUNT = 245
OTHER_EXPENSE_COUNT = TOTAL_ROWS - MONTHLY_SALARY_COUNT - MONTHLY_RENT_COUNT - OTHER_INCOME_COUNT

# Deterministic pseudo-random generator (no third-party dependency)
state = 123456789


def rand_u32() -> int:
    global state
    state = (1664525 * state + 1013904223) % (2**32)
    return state


def randint(lo: int, hi: int) -> int:
    return lo + (rand_u32() % (hi - lo + 1))


def weighted_category():
    total = sum(weight for _, _, _, weight in EXPENSE_CATEGORIES)
    pick = randint(1, total)
    running = 0
    for item in EXPENSE_CATEGORIES:
        running += item[3]
        if pick <= running:
            return item
    return EXPENSE_CATEGORIES[-1]


def random_date() -> date:
    return start + timedelta(days=randint(0, 364))


rows = []

# 12 monthly salary credits.
for month_index in range(months):
    # Keep the credit date consistent while allowing a small realistic salary variation.
    d = date(start.year + (start.month - 1 + month_index) // 12,
             (start.month - 1 + month_index) % 12 + 1,
             1)
    amount = randint(78000, 88000)
    rows.append({
        'date': d.isoformat(),
        'description': 'Salary',
        'amount': amount,
        'category': 'Income',
        'type': 'income',
        'merchant': 'salary_credit',
    })

# 12 monthly rent payments.
for month_index in range(months):
    d = date(start.year + (start.month - 1 + month_index) // 12,
             (start.month - 1 + month_index) % 12 + 1,
             3)
    amount = randint(24000, 28000)
    rows.append({
        'date': d.isoformat(),
        'description': 'Monthly Rent',
        'amount': amount,
        'category': 'Rent',
        'type': 'expense',
        'merchant': 'monthly_rent',
    })

# Additional income events: freelance, bonus, and interest.
for _ in range(OTHER_INCOME_COUNT):
    d = random_date()
    name, lo, hi = INCOME_TYPES[randint(0, len(INCOME_TYPES) - 1)]
    amount = randint(lo, hi)
    rows.append({
        'date': d.isoformat(),
        'description': name,
        'amount': amount,
        'category': 'Income',
        'type': 'income',
        'merchant': name.replace(' ', '_').lower(),
    })

# Remaining expenses are generated as day-to-day spending across the seven
# non-rent categories. Weekend discretionary spending is nudged upward so
# there is a measurable pattern for EDA without overpowering the dataset.
for _ in range(OTHER_EXPENSE_COUNT):
    d = random_date()
    cat, descriptions, (lo, hi), _weight = weighted_category()
    description = descriptions[randint(0, len(descriptions) - 1)]
    amount = randint(lo, hi)

    if d.weekday() >= 5 and cat in {'Food', 'Entertainment', 'Shopping'}:
        amount = int(amount * 1.35)

    rows.append({
        'date': d.isoformat(),
        'description': description,
        'amount': amount,
        'category': cat,
        'type': 'expense',
        'merchant': description.replace(' ', '_').lower(),
    })

rows.sort(key=lambda r: (r['date'], r['type'], r['description']))

if len(rows) != TOTAL_ROWS:
    raise RuntimeError(f'Expected {TOTAL_ROWS:,} rows, generated {len(rows):,}')

with OUT.open('w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)

print(f'Wrote {len(rows):,} transactions to {OUT}')
print(f'Monthly salary rows: {MONTHLY_SALARY_COUNT}')
print(f'Monthly rent rows: {MONTHLY_RENT_COUNT}')
print(f'Other income rows: {OTHER_INCOME_COUNT}')
print(f'Other expense rows: {OTHER_EXPENSE_COUNT}')
