import React, { useMemo } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Database,
  ReceiptText,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const formatINR = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;

/*
 * IMPORTANT:
 * Backend returns PostgreSQL timestamps such as:
 * 2026-05-02T18:30:00.000Z
 *
 * We always keep only YYYY-MM-DD so timezone conversion
 * does not shift the transaction to the previous day/month.
 */
const dateOnly = (value) => String(value ?? '').slice(0, 10);

const formatDisplayDate = (value) => {
  const date = dateOnly(value);

  if (!date || date.length !== 10) {
    return '—';
  }

  const [year, month, day] = date.split('-');

  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatMonthLabel = (monthKey) => {
  if (!monthKey || monthKey.length !== 7) {
    return monthKey;
  }

  const [year, month] = monthKey.split('-');

  const date = new Date(
    Number(year),
    Number(month) - 1,
    1
  );

  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
  });
};

const quantile = (values, q) => {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);

  const position = (sorted.length - 1) * q;
  const base = Math.floor(position);
  const rest = position - base;

  if (sorted[base + 1] !== undefined) {
    return (
      sorted[base] +
      rest * (sorted[base + 1] - sorted[base])
    );
  }

  return sorted[base];
};

const Insights = ({ transactions }) => {
  const expenseTransactions = useMemo(
    () =>
      transactions
        .filter((txn) => txn.type === 'expense')
        .map((txn) => ({
          ...txn,
          amount: Number(txn.amount),
        })),
    [transactions]
  );

  const incomeTransactions = useMemo(
    () =>
      transactions
        .filter((txn) => txn.type === 'income')
        .map((txn) => ({
          ...txn,
          amount: Number(txn.amount),
        })),
    [transactions]
  );

  const metrics = useMemo(() => {
    const totalExpense = expenseTransactions.reduce(
      (sum, txn) => sum + txn.amount,
      0
    );

    const totalIncome = incomeTransactions.reduce(
      (sum, txn) => sum + txn.amount,
      0
    );

    // =========================================================
    // CATEGORY ANALYSIS
    // =========================================================

    const categoryTotals = expenseTransactions.reduce(
      (acc, txn) => {
        const category = txn.category || 'Unknown';

        acc[category] =
          (acc[category] || 0) + txn.amount;

        return acc;
      },
      {}
    );

    const categoryRows = Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value,
        share: totalExpense
          ? (value / totalExpense) * 100
          : 0,
      }))
      .sort((a, b) => b.value - a.value);

    const highestCategory = categoryRows[0] || {
      name: 'None',
      value: 0,
      share: 0,
    };

    // =========================================================
    // MERCHANT ANALYSIS
    // =========================================================

    const merchantTotals = expenseTransactions.reduce(
      (acc, txn) => {
        const merchant =
          txn.merchant ||
          txn.description ||
          'Unknown';

        acc[merchant] =
          (acc[merchant] || 0) + txn.amount;

        return acc;
      },
      {}
    );

    const merchantRows = Object.entries(merchantTotals)
      .map(([merchant, value]) => ({
        merchant,
        value,
        share: totalExpense
          ? (value / totalExpense) * 100
          : 0,
      }))
      .sort((a, b) => b.value - a.value);

    // =========================================================
    // MONTHLY ANALYSIS
    // =========================================================

    const monthlyMap = transactions.reduce(
      (acc, txn) => {
        // FIX:
        // Never slice directly from an ISO UTC timestamp.
        // Extract original YYYY-MM-DD first.
        const transactionDate = dateOnly(txn.date);
        const month = transactionDate.slice(0, 7);

        if (!month || month.length !== 7) {
          return acc;
        }

        if (!acc[month]) {
          acc[month] = {
            month,
            income: 0,
            expense: 0,
          };
        }

        if (txn.type === 'income') {
          acc[month].income += Number(txn.amount);
        } else if (txn.type === 'expense') {
          acc[month].expense += Number(txn.amount);
        }

        return acc;
      },
      {}
    );

    const monthlyRows = Object.values(monthlyMap)
      .sort((a, b) =>
        a.month.localeCompare(b.month)
      )
      .map((row) => ({
        ...row,
        net: row.income - row.expense,
        label: formatMonthLabel(row.month),
      }));

    // =========================================================
    // WEEKEND VS WEEKDAY
    // =========================================================

    const weekend = expenseTransactions.filter(
      (txn) => {
        const cleanDate = dateOnly(txn.date);

        const day = new Date(
          `${cleanDate}T00:00:00`
        ).getDay();

        return day === 0 || day === 6;
      }
    );

    const weekday = expenseTransactions.filter(
      (txn) => {
        const cleanDate = dateOnly(txn.date);

        const day = new Date(
          `${cleanDate}T00:00:00`
        ).getDay();

        return day !== 0 && day !== 6;
      }
    );

    const weekendAverage = weekend.length
      ? weekend.reduce(
          (sum, txn) => sum + txn.amount,
          0
        ) / weekend.length
      : 0;

    const weekdayAverage = weekday.length
      ? weekday.reduce(
          (sum, txn) => sum + txn.amount,
          0
        ) / weekday.length
      : 0;

    const weekendRatio = weekdayAverage
      ? weekendAverage / weekdayAverage
      : 0;

    // =========================================================
    // IQR OUTLIER ANALYSIS
    // =========================================================

    const amounts = expenseTransactions.map(
      (txn) => txn.amount
    );

    const q1 = quantile(amounts, 0.25);
    const q3 = quantile(amounts, 0.75);

    const iqr = q3 - q1;
    const iqrUpperBound = q3 + 1.5 * iqr;

    const outliers = expenseTransactions
      .filter(
        (txn) => txn.amount > iqrUpperBound
      )
      .sort((a, b) => b.amount - a.amount);

    // =========================================================
    // MONTHLY BEST / WORST
    // =========================================================

    const positiveMonths = monthlyRows.filter(
      (row) => row.net >= 0
    );

    const negativeMonths = monthlyRows.filter(
      (row) => row.net < 0
    );

    const bestMonth =
      [...monthlyRows].sort(
        (a, b) => b.net - a.net
      )[0] || null;

    const worstMonth =
      [...monthlyRows].sort(
        (a, b) => a.net - b.net
      )[0] || null;

    // =========================================================
    // TOP MERCHANT
    // =========================================================

    const topMerchant = merchantRows[0] || {
      merchant: 'None',
      value: 0,
    };

    return {
      totalExpense,
      totalIncome,
      balance: totalIncome - totalExpense,

      categoryRows,
      highestCategory,
      highestCategoryShare:
        highestCategory.share,

      merchantRows,
      topMerchant,

      monthlyRows,
      positiveMonths,
      negativeMonths,

      bestMonth,
      worstMonth,

      weekendAverage,
      weekdayAverage,
      weekendRatio,

      q1,
      q3,
      iqrUpperBound,
      outliers,
    };
  }, [
    transactions,
    expenseTransactions,
    incomeTransactions,
  ]);

  const categoryColors = [
    '#f97316',
    '#eab308',
    '#a855f7',
    '#ec4899',
    '#84cc16',
    '#0ea5e9',
    '#14b8a6',
    '#8b5cf6',
  ];

  // =========================================================
  // DATA QUALITY
  // =========================================================

  const quality = useMemo(() => {
    const duplicateKeys = new Set();

    let duplicateRows = 0;
    let blankDescriptions = 0;
    let invalidAmounts = 0;
    let invalidTypes = 0;

    transactions.forEach((txn) => {
      const key = [
        txn.date,
        txn.description,
        txn.amount,
        txn.category,
        txn.type,
        txn.merchant,
      ].join('|');

      if (duplicateKeys.has(key)) {
        duplicateRows += 1;
      }

      duplicateKeys.add(key);

      if (
        !String(txn.description || '').trim()
      ) {
        blankDescriptions += 1;
      }

      if (
        !Number.isFinite(Number(txn.amount)) ||
        Number(txn.amount) <= 0
      ) {
        invalidAmounts += 1;
      }

      if (
        !['income', 'expense'].includes(
          txn.type
        )
      ) {
        invalidTypes += 1;
      }
    });

    return {
      duplicateRows,
      blankDescriptions,
      invalidAmounts,
      invalidTypes,
    };
  }, [transactions]);

  // =========================================================
  // ANALYST OBSERVATION
  // =========================================================

  const observation =
    transactions.length === 0
      ? 'No transactions are available yet. Add records to unlock the analytical views.'
      : metrics.balance >= 0
      ? `The dataset shows a positive net cash flow of ${formatINR(
          metrics.balance
        )}. ${metrics.highestCategory.name} is the largest expense category at ${metrics.highestCategoryShare.toFixed(
          1
        )}% of total spending.`
      : `The dataset shows a net cash-flow deficit of ${formatINR(
          Math.abs(metrics.balance)
        )}. ${metrics.highestCategory.name} contributes ${metrics.highestCategoryShare.toFixed(
          1
        )}% of total spending, making it the main category to investigate for cost-control opportunities.`;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div>
        <h2 className="text-2xl font-bold">
          Financial Insights
        </h2>

        <p className="text-zinc-500 text-sm mt-1">
          Data-driven analysis from the PostgreSQL
          transaction dataset.
        </p>
      </div>

      {/* =====================================================
          KPI CARDS
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* TOP CATEGORY */}

        <div className="bg-[#242424] p-5 rounded-xl border border-zinc-700/50">

          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 mb-4">
            <ShoppingCart size={20} />
          </div>

          <p className="text-zinc-400 text-sm">
            Top Expense Category
          </p>

          <p className="text-xl font-bold mt-1">
            {metrics.highestCategory.name}
          </p>

          <p className="text-zinc-500 text-xs mt-1">
            {formatINR(
              metrics.highestCategory.value
            )}{' '}
            ·{' '}
            {metrics.highestCategoryShare.toFixed(
              2
            )}
            %
          </p>

        </div>

        {/* NET CASH FLOW */}

        <div className="bg-[#242424] p-5 rounded-xl border border-zinc-700/50">

          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 mb-4">
            <TrendingDown size={20} />
          </div>

          <p className="text-zinc-400 text-sm">
            Net Cash Flow
          </p>

          <p
            className={`text-xl font-bold mt-1 ${
              metrics.balance >= 0
                ? 'text-emerald-400'
                : 'text-red-400'
            }`}
          >
            {formatINR(metrics.balance)}
          </p>

          <p className="text-zinc-500 text-xs mt-1">
            Income minus expenses
          </p>

        </div>

        {/* IQR OUTLIERS */}

        <div className="bg-[#242424] p-5 rounded-xl border border-zinc-700/50">

          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
            <AlertCircle size={20} />
          </div>

          <p className="text-zinc-400 text-sm">
            IQR Outliers
          </p>

          <p className="text-xl font-bold mt-1">
            {metrics.outliers.length}
          </p>

          <p className="text-zinc-500 text-xs mt-1">
            Threshold:{' '}
            {formatINR(metrics.iqrUpperBound)}
          </p>

        </div>

        {/* WEEKEND */}

        <div className="bg-[#242424] p-5 rounded-xl border border-zinc-700/50">

          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mb-4">
            <ArrowUpRight size={20} />
          </div>

          <p className="text-zinc-400 text-sm">
            Weekend vs Weekday
          </p>

          <p className="text-xl font-bold mt-1">
            {metrics.weekendRatio.toFixed(2)}×
          </p>

          <p className="text-zinc-500 text-xs mt-1">
            Average expense per transaction
          </p>

        </div>

      </div>

      {/* =====================================================
          MONTHLY CHARTS
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* MONTHLY INCOME VS EXPENSE */}

        <div className="bg-[#242424] p-6 rounded-xl border border-zinc-700/50">

          <div className="flex items-center gap-2 mb-5">
            <BarChart3
              size={18}
              className="text-blue-400"
            />

            <h3 className="text-lg font-semibold">
              Monthly Income vs Expense
            </h3>
          </div>

          <div className="h-72">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={metrics.monthlyRows}
                margin={{
                  top: 5,
                  right: 5,
                  left: -10,
                  bottom: 5,
                }}
              >

                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#3f3f46"
                  vertical={false}
                  opacity={0.5}
                />

                <XAxis
                  dataKey="label"
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    `₹${Math.round(
                      value / 1000
                    )}k`
                  }
                />

                <Tooltip
                  formatter={(value) =>
                    formatINR(value)
                  }
                  contentStyle={{
                    backgroundColor:
                      '#18181b',
                    border:
                      '1px solid #3f3f46',
                    borderRadius: '10px',
                  }}
                />

                <Legend />

                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />

                <Bar
                  dataKey="expense"
                  name="Expense"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* MONTHLY NET CASH FLOW */}

        <div className="bg-[#242424] p-6 rounded-xl border border-zinc-700/50">

          <div className="flex items-center gap-2 mb-5">

            <TrendingUp
              size={18}
              className="text-purple-400"
            />

            <h3 className="text-lg font-semibold">
              Monthly Net Cash Flow
            </h3>

          </div>

          <div className="h-72">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={metrics.monthlyRows}
                margin={{
                  top: 5,
                  right: 5,
                  left: -10,
                  bottom: 5,
                }}
              >

                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#3f3f46"
                  vertical={false}
                  opacity={0.5}
                />

                <XAxis
                  dataKey="label"
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    `₹${Math.round(
                      value / 1000
                    )}k`
                  }
                />

                <Tooltip
                  formatter={(value) =>
                    formatINR(value)
                  }
                  contentStyle={{
                    backgroundColor:
                      '#18181b',
                    border:
                      '1px solid #3f3f46',
                    borderRadius: '10px',
                  }}
                />

                <Bar
                  dataKey="net"
                  name="Net Cash Flow"
                  radius={[4, 4, 0, 0]}
                >
                  {metrics.monthlyRows.map(
                    (entry) => (
                      <Cell
                        key={entry.month}
                        fill={
                          entry.net >= 0
                            ? '#22c55e'
                            : '#ef4444'
                        }
                      />
                    )
                  )}
                </Bar>

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>

      {/* =====================================================
          CATEGORY + MERCHANTS
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CATEGORY */}

        <div className="bg-[#242424] p-6 rounded-xl border border-zinc-700/50">

          <div className="flex items-center gap-2 mb-5">

            <ShoppingCart
              size={18}
              className="text-orange-400"
            />

            <h3 className="text-lg font-semibold">
              Category Contribution
            </h3>

          </div>

          <div className="h-64">

            {metrics.categoryRows.length ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={metrics.categoryRows}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={2}
                    stroke="none"
                  >

                    {metrics.categoryRows.map(
                      (entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            categoryColors[
                              index %
                                categoryColors.length
                            ]
                          }
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatINR(value)
                    }
                    contentStyle={{
                      backgroundColor:
                        '#18181b',
                      border:
                        '1px solid #3f3f46',
                      borderRadius: '10px',
                    }}
                  />

                </PieChart>

              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500">
                No expense data.
              </div>
            )}

          </div>

          <div className="mt-4 space-y-2 max-h-32 overflow-y-auto pr-1">

            {metrics.categoryRows.map(
              (item) => (
                <div
                  key={item.name}
                  className="flex justify-between text-sm"
                >

                  <span className="text-zinc-300">
                    {item.name}
                  </span>

                  <span className="text-zinc-400">
                    {formatINR(
                      item.value
                    )}{' '}
                    ·{' '}
                    {item.share.toFixed(1)}
                    %
                  </span>

                </div>
              )
            )}

          </div>

        </div>

        {/* MERCHANTS */}

        <div className="bg-[#242424] p-6 rounded-xl border border-zinc-700/50">

          <div className="flex items-center gap-2 mb-5">

            <ArrowDownRight
              size={18}
              className="text-red-400"
            />

            <div>

              <h3 className="text-lg font-semibold">
                Top 10 Merchants
              </h3>

              <p className="text-zinc-500 text-xs mt-1">
                Highest cumulative expense by merchant.
              </p>

            </div>

          </div>

          <div className="h-64">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={metrics.merchantRows
                  .slice(0, 10)
                  .reverse()}
                layout="vertical"
                margin={{
                  top: 2,
                  right: 10,
                  left: 55,
                  bottom: 2,
                }}
              >

                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#3f3f46"
                  horizontal={false}
                  opacity={0.5}
                />

                <XAxis
                  type="number"
                  stroke="#a1a1aa"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    `₹${Math.round(
                      value / 1000
                    )}k`
                  }
                />

                <YAxis
                  type="category"
                  dataKey="merchant"
                  stroke="#a1a1aa"
                  fontSize={10}
                  width={80}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  formatter={(value) =>
                    formatINR(value)
                  }
                  contentStyle={{
                    backgroundColor:
                      '#18181b',
                    border:
                      '1px solid #3f3f46',
                    borderRadius: '10px',
                  }}
                />

                <Bar
                  dataKey="value"
                  name="Spend"
                  fill="#a855f7"
                  radius={[0, 4, 4, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

          <div className="mt-4 p-3 rounded-lg bg-[#1e1e1e] border border-zinc-800">

            <p className="text-xs text-zinc-500">
              Highest-spend merchant
            </p>

            <div className="flex items-center justify-between mt-1">

              <span className="text-sm text-zinc-200">
                {metrics.topMerchant.merchant}
              </span>

              <span className="text-sm font-medium text-purple-400">
                {formatINR(
                  metrics.topMerchant.value
                )}
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          MONTHLY PERFORMANCE
      ====================================================== */}

      <div className="bg-[#242424] p-6 rounded-xl border border-zinc-700/50">

        <div className="flex items-center gap-2 mb-5">

          <TrendingUp
            size={18}
            className="text-blue-400"
          />

          <div>

            <h3 className="text-lg font-semibold">
              Monthly Performance Summary
            </h3>

            <p className="text-zinc-500 text-xs mt-1">
              Best and worst cash-flow months from the
              12-month dataset.
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* POSITIVE MONTHS */}

          <div className="p-4 rounded-lg bg-[#1e1e1e] border border-zinc-800">

            <p className="text-xs text-zinc-500">
              Positive Cash-flow Months
            </p>

            <p className="text-2xl font-bold mt-1 text-emerald-400">
              {metrics.positiveMonths.length}
            </p>

            <p className="text-xs text-zinc-500 mt-1">
              out of {metrics.monthlyRows.length}{' '}
              months
            </p>

          </div>

          {/* BEST MONTH */}

          <div className="p-4 rounded-lg bg-[#1e1e1e] border border-zinc-800">

            <p className="text-xs text-zinc-500">
              Best Month
            </p>

            <p className="text-lg font-bold mt-1 text-emerald-400">
              {metrics.bestMonth
                ? metrics.bestMonth.label
                : '—'}
            </p>

            <p className="text-xs text-zinc-400 mt-1">
              {metrics.bestMonth
                ? formatINR(
                    metrics.bestMonth.net
                  )
                : 'No data'}
            </p>

          </div>

          {/* WORST MONTH */}

          <div className="p-4 rounded-lg bg-[#1e1e1e] border border-zinc-800">

            <p className="text-xs text-zinc-500">
              Worst Month
            </p>

            <p className="text-lg font-bold mt-1 text-red-400">
              {metrics.worstMonth
                ? metrics.worstMonth.label
                : '—'}
            </p>

            <p className="text-xs text-zinc-400 mt-1">
              {metrics.worstMonth
                ? formatINR(
                    metrics.worstMonth.net
                  )
                : 'No data'}
            </p>

          </div>

        </div>

      </div>

      {/* =====================================================
          IQR OUTLIERS
      ====================================================== */}

      <div className="bg-[#242424] p-6 rounded-xl border border-zinc-700/50">

        <div className="flex items-center gap-2 mb-5">

          <ReceiptText
            size={18}
            className="text-yellow-400"
          />

          <div>

            <h3 className="text-lg font-semibold">
              IQR Outlier Transactions
            </h3>

            <p className="text-zinc-500 text-xs mt-1">
              Expense amounts above{' '}
              {formatINR(
                metrics.iqrUpperBound
              )}{' '}
              using the 1.5×IQR rule.
            </p>

            <p className="text-zinc-600 text-xs mt-1">
              Statistical outliers are not automatically
              data errors.
            </p>

          </div>

        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-800">

          <table className="w-full text-sm">

            <thead className="bg-[#1e1e1e] text-zinc-400">

              <tr>

                <th className="text-left px-4 py-3 font-medium">
                  Date
                </th>

                <th className="text-left px-4 py-3 font-medium">
                  Description
                </th>

                <th className="text-left px-4 py-3 font-medium">
                  Category
                </th>

                <th className="text-right px-4 py-3 font-medium">
                  Amount
                </th>

              </tr>

            </thead>

            <tbody>

              {metrics.outliers
                .slice(0, 12)
                .map((txn, index) => (

                  <tr
                    key={`${txn.id ?? 'outlier'}-${index}`}
                    className="border-t border-zinc-800 hover:bg-zinc-800/30"
                  >

                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                      {formatDisplayDate(
                        txn.date
                      )}
                    </td>

                    <td className="px-4 py-3 text-zinc-200">
                      {txn.description}
                    </td>

                    <td className="px-4 py-3 text-zinc-400">
                      {txn.category}
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-red-400 whitespace-nowrap">
                      {formatINR(
                        txn.amount
                      )}
                    </td>

                  </tr>

                ))}

              {!metrics.outliers.length && (
                <tr>

                  <td
                    colSpan="4"
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    No outlier expenses detected.
                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

        {metrics.outliers.length > 12 && (
          <p className="text-xs text-zinc-500 mt-3">
            Showing the 12 largest outliers out of{' '}
            {metrics.outliers.length} detected
            transactions.
          </p>
        )}

      </div>

      {/* =====================================================
          OBSERVATION + DATA QUALITY
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ANALYST OBSERVATION */}

        <div className="lg:col-span-2 bg-[#1e1e24] p-6 rounded-xl border border-blue-900/50">

          <div className="flex items-center gap-2 mb-2">

            <TrendingDown
              size={18}
              className={
                metrics.balance >= 0
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }
            />

            <h3 className="text-blue-400 font-medium">
              Analyst Observation
            </h3>

          </div>

          <p className="text-zinc-300 text-sm leading-relaxed">
            {observation}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">

            {/* TOP MERCHANT */}

            <div className="p-3 rounded-lg bg-[#18181b] border border-zinc-800">

              <p className="text-xs text-zinc-500">
                Top Merchant
              </p>

              <p className="text-sm font-semibold mt-1">
                {metrics.topMerchant.merchant}
              </p>

              <p className="text-xs text-zinc-400 mt-1">
                {formatINR(
                  metrics.topMerchant.value
                )}
              </p>

            </div>

            {/* IQR */}

            <div className="p-3 rounded-lg bg-[#18181b] border border-zinc-800">

              <p className="text-xs text-zinc-500">
                Outlier Threshold
              </p>

              <p className="text-sm font-semibold mt-1">
                {formatINR(
                  metrics.iqrUpperBound
                )}
              </p>

              <p className="text-xs text-zinc-400 mt-1">
                1.5×IQR upper bound
              </p>

            </div>

          </div>

        </div>

        {/* DATA QUALITY */}

        <div className="bg-[#242424] p-6 rounded-xl border border-zinc-700/50">

          <div className="flex items-center gap-2 mb-4">

            <Database
              size={18}
              className="text-emerald-400"
            />

            <h3 className="text-lg font-semibold">
              Data Quality
            </h3>

          </div>

          <div className="space-y-3 text-sm">

            <div className="flex justify-between">

              <span className="text-zinc-400">
                Rows
              </span>

              <span className="font-medium">
                {transactions.length}
              </span>

            </div>

            <div className="flex justify-between">

              <span className="text-zinc-400">
                Blank descriptions
              </span>

              <span className="text-emerald-400">
                {quality.blankDescriptions}
              </span>

            </div>

            <div className="flex justify-between">

              <span className="text-zinc-400">
                Invalid amounts
              </span>

              <span className="text-emerald-400">
                {quality.invalidAmounts}
              </span>

            </div>

            <div className="flex justify-between">

              <span className="text-zinc-400">
                Invalid types
              </span>

              <span className="text-emerald-400">
                {quality.invalidTypes}
              </span>

            </div>

            <div className="flex justify-between">

              <span className="text-zinc-400">
                Duplicate rows
              </span>

              <span className="text-emerald-400">
                {quality.duplicateRows}
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Insights;