# 📈 FinTrack — Financial Data Analytics Dashboard

An end-to-end financial data analytics platform built with **React, Express.js, PostgreSQL, SQL, Python, Pandas, and Recharts**.

FinTrack combines a responsive finance dashboard with a PostgreSQL-backed transaction system and a Python-based analytics workflow. The project processes a **1,800-transaction dataset covering 12 months** and provides interactive analysis of cash flow, spending patterns, merchants, outliers, and data quality.

---

## 🚀 Project Overview

FinTrack was upgraded from a frontend-only finance dashboard into a full-stack analytics application.

The system includes:

- PostgreSQL database for persistent transaction storage
- Express.js REST API for transaction and overview data
- React + Recharts dashboard for interactive visualization
- SQL-based analytical views and queries
- Python + Pandas EDA workflow
- IQR-based expense outlier detection
- Transaction data-quality validation
- Monthly, category, merchant, and weekday/weekend analysis
- Role-based Admin / Viewer interface
- CSV / JSON transaction export
- Local fallback using browser storage when the API is unavailable

---

## 📊 Dataset & Analytical Results

The current sample dataset contains:

| Metric | Value |
|---|---:|
| Transactions | 1,800 |
| Period Covered | 12 months |
| Total Income | ₹37,87,007 |
| Total Expenses | ₹47,18,817 |
| Net Cash Flow | -₹9,31,810 |
| Highest Expense Category | Shopping |
| Shopping Share of Expenses | 32.7% |
| Detected Expense Outliers | 66 |
| IQR Upper Bound | ₹7,981.25 |
| Weekend / Weekday Spend Ratio | 1.15x |

The dataset is generated programmatically using `generate_data.py`, allowing the analytical workflow to be reproduced consistently.

---

## 📸 Screenshots

> Add the application screenshots to a `screenshots/` folder using the filenames below.

### Overview

![FinTrack Overview](./screenshots/screenshot-overview.png)

### Transactions

![FinTrack Transactions](./screenshots/screenshot-transactions.png)

### Insights

![FinTrack Insights](./screenshots/screenshot-insights.png)

---

## ✨ Features

### 1. Dashboard Overview

The Overview dashboard provides an interactive financial summary based on the PostgreSQL transaction dataset.

- **Dynamic KPI Cards** for total balance, income, and expenses
- **Running Balance Trend** over time
- **Income vs Expense Analysis**
- **Category-based Spending Breakdown**
- Real-time recalculation after transaction changes
- Responsive dashboard layout

### 2. Transaction Management

FinTrack provides a complete transaction workflow backed by the Express API and PostgreSQL.

- Add income and expense transactions
- Delete individual transactions
- Clear transaction history
- Search transactions by description
- Filter by transaction type
- Filter by category
- Filter by date range
- Sort by date or amount
- Export filtered transactions as CSV / JSON
- Empty-state handling for filters and transaction history

### 3. PostgreSQL Backend

The backend is implemented using **Node.js + Express.js + PostgreSQL**.

Main backend capabilities include:

- REST API for transactions
- Overview / summary API
- PostgreSQL schema and constraints
- Indexed transaction fields
- Database integrity checks
- Database seeding with generated transaction data
- PostgreSQL-backed analytical views

### 4. SQL Analytics

The project includes dedicated SQL scripts for analytical processing.

Analytical SQL covers:

- Monthly income and expense analysis
- Net cash-flow calculation
- Category-level spending
- Merchant-level spending
- Daily cash-flow analysis
- Transaction quality checks
- Aggregations and analytical transformations

The project contains **5 SQL views** used for reusable analytics:

- `monthly_financial_summary`
- `category_spend_summary`
- `merchant_spend_summary`
- `daily_cashflow`
- `transaction_quality`

These views provide reusable analytical results for the dashboard and downstream analysis workflows.

### 5. Python EDA

A Python-based exploratory data analysis workflow is included under `analysis/`.

Using **Pandas and Python**, the project performs:

- Descriptive statistics
- Monthly financial analysis
- Category spending analysis
- Weekday vs weekend comparison
- Distribution analysis
- IQR-based outlier detection
- Data-quality validation
- Automated analytical summaries

Generated outputs include CSV summaries, analytical charts, and an insights report.

### 6. Financial Insights

The Insights dashboard provides deeper analysis beyond basic transaction management.

It includes:

- Highest spending category
- Category contribution percentages
- Monthly income vs expense
- Monthly net cash flow
- Best and worst performing months
- Top merchants
- Expense outlier detection
- Weekend vs weekday spending comparison
- Automated analyst observations
- Data-quality checks

For the current dataset, the analysis identifies a **net cash-flow deficit of ₹9.31 lakh**, with **Shopping accounting for 32.7% of total expenses**.

### 7. Outlier Detection

FinTrack uses the **Interquartile Range (IQR)** method to identify unusually large expense transactions.

The dashboard reports:

- Q1
- Q3
- IQR
- Upper outlier threshold
- Number of detected outliers
- Largest outlier transactions

For the current dataset, the calculated upper bound is **₹7,981.25**, resulting in **66 detected expense outliers**.

### 8. Data Quality

A dedicated data-quality analysis checks the transaction dataset for common problems.

The current dataset reports:

- **0 null IDs**
- **0 null dates**
- **0 blank descriptions**
- **0 invalid amounts**
- **0 invalid transaction types**
- **0 duplicate rows**

The same validation logic is also represented in the SQL analytics workflow.

### 9. Role-Based Access

The dashboard includes Admin and Viewer roles.

**Admin**

- View transactions
- Add transactions
- Delete transactions
- Clear transaction history
- Use filtering and analytical features

**Viewer**

- View and analyze transaction data
- Search and filter transactions
- Access analytical insights
- Transaction modification actions are hidden

The current role system is implemented at the application UI level.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Database Access | `pg` |
| Analytics | Python, Pandas |
| Visualization | Matplotlib, Recharts |
| API | REST |
| Development | Git, Linux-compatible tooling |
| Optional Environment | Docker / Docker Compose |

---

## 📂 Project Structure

```text
fintrack/
├── analysis/
│   ├── eda.py
│   ├── requirements.txt
│   └── outputs/
│       ├── category_spend.png
│       ├── category_summary.csv
│       ├── expense_outliers.csv
│       ├── insights.txt
│       ├── monthly_income_expense.png
│       ├── monthly_summary.csv
│       └── weekday_summary.csv
│
├── data/
│   └── transactions.csv
│
├── docs/
│   ├── DATA_ANALYSIS.md
│   └── POWERBI_GUIDE.md
│
├── server/
│   ├── src/
│   │   ├── db.js
│   │   ├── index.js
│   │   └── seed.js
│   ├── package.json
│   └── .env.example
│
├── sql/
│   ├── analytics_queries.sql
│   ├── load.sql
│   └── schema.sql
│
├── src/
│   ├── components/
│   │   ├── Insights.jsx
│   │   ├── Overview.jsx
│   │   ├── Sidebar.jsx
│   │   └── Transactions.jsx
│   ├── api.js
│   ├── App.jsx
│   ├── data.js
│   ├── index.css
│   └── main.jsx
│
├── generate_data.py
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 💻 Local Setup

### Prerequisites

Install:

- Node.js
- PostgreSQL
- Python 3.x

### 1. Clone the repository

```bash
git clone https://github.com/ak-jaat-007/Fintrack.git
cd Fintrack
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Configure PostgreSQL

Create a PostgreSQL database named:

```text
fintrack
```

Create:

```text
server/.env
```

using:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/fintrack
CLIENT_ORIGIN=http://localhost:5173
```

Adjust the PostgreSQL port if your local installation uses a different port.

### 5. Seed the database

From the `server` directory:

```bash
npm run seed
```

This populates PostgreSQL with the generated transaction dataset.

### 6. Start the backend

```bash
npm run dev
```

The API runs on:

```text
http://localhost:5000
```

### 7. Start the frontend

Open another terminal from the project root:

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

## 🔬 Running the Python Analysis

Install the analysis dependencies:

```bash
pip install -r analysis/requirements.txt
```

Run:

```bash
python analysis/eda.py
```

The script generates analytical CSV files, charts, and an insights report under:

```text
analysis/outputs/
```

---

## 🗄️ Database & SQL

The SQL directory contains:

```text
sql/
├── schema.sql
├── load.sql
└── analytics_queries.sql
```

### `schema.sql`

Defines the PostgreSQL transaction schema, constraints, indexes, and analytical views.

### `load.sql`

Provides SQL-based data loading support.

### `analytics_queries.sql`

Contains reusable financial analytics queries for:

- Monthly performance
- Category analysis
- Merchant analysis
- Cash flow
- Transaction quality
- Analytical summaries

---

## 📈 Analytical Workflow

The project follows an end-to-end data workflow:

```text
Generated Transaction Data
          ↓
      CSV Dataset
          ↓
      PostgreSQL
          ↓
     SQL Analytics
          ↓
   Python / Pandas EDA
          ↓
 Analytical Outputs
          ↓
 React + Recharts Dashboard
```

This separates:

- Data generation
- Data storage
- Analytical transformation
- Exploratory analysis
- Visualization

into distinct stages.

---

## 📊 Example Analytical Questions

FinTrack is designed to answer questions such as:

- Which category contributes the most to total expenses?
- How does income compare with expenses month by month?
- Which months generated positive or negative cash flow?
- Which merchants account for the highest spending?
- Are weekends associated with higher discretionary spending?
- Which transactions are statistical outliers?
- Does the dataset contain duplicate or invalid records?

---

## 🔐 Data & Security Notes

- Database credentials are stored in `server/.env`
- Environment files are excluded from Git using `.gitignore`
- `server/.env.example` is provided as a configuration template
- No real financial or personal transaction data is used; the included dataset is generated sample data

---

## 📚 Documentation

Additional documentation is available in:

```text
docs/
├── DATA_ANALYSIS.md
└── POWERBI_GUIDE.md
```

These documents describe the analytical workflow and how the dataset can be further explored using BI tools.

---

## 🎯 Project Highlights

FinTrack demonstrates practical experience across:

- Full-stack application development
- REST API design
- PostgreSQL database design
- SQL analytics
- Python-based EDA
- Data quality validation
- Statistical outlier detection
- Financial data visualization
- Dashboard development
- Data-to-insight workflows

---

## 👨‍💻 Author

**Aman Kaliramna**

- GitHub: https://github.com/ak-jaat-007
- LinkedIn: https://www.linkedin.com/in/aman-kaliramna
