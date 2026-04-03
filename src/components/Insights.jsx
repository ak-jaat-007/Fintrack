import React, { useMemo } from 'react';
import { AlertCircle, TrendingDown, ArrowUpRight } from 'lucide-react';

const Insights = ({ transactions }) => {
  const highestCategory = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) return { name: 'None', value: 0 };

    const categoryTotals = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

    let highest = { name: '', value: 0 };
    for (const [name, value] of Object.entries(categoryTotals)) {
      if (value > highest.value) highest = { name, value };
    }
    return highest;
  }, [transactions]);

  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const percentage = totalExpense > 0 ? Math.round((highestCategory.value / totalExpense) * 100) : 0;

  // NEW: Dynamic message logic that handles the empty state!
  let systemMessage = "";
  if (transactions.length === 0) {
    systemMessage = "You haven't recorded any transactions yet. Start adding your daily income and expenses to unlock personalized financial insights and budgeting recommendations.";
  } else if (totalIncome >= totalExpense) {
    systemMessage = `Your income-to-expense ratio is very healthy. You have a positive cash flow of ₹${(totalIncome - totalExpense).toLocaleString('en-IN')} based on current records. Consider setting up an auto-transfer to move a portion of these savings into an investment account.`;
  } else {
    systemMessage = `Warning: You are currently running a deficit of ₹${(totalExpense - totalIncome).toLocaleString('en-IN')}. Your highest spending category is "${highestCategory.name}". Consider setting a hard budget limit on this category to bring your balance back into the positive.`;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <h2 className="text-2xl font-bold mb-6">Financial Insights</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#242424] p-6 rounded-xl border border-zinc-700/50 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-zinc-400 text-sm mb-1">Highest Spending Category</h3>
            <p className="text-xl font-bold text-white">
              {highestCategory.name} {highestCategory.value > 0 ? `(₹${highestCategory.value.toLocaleString('en-IN')})` : ''}
            </p>
            <p className="text-zinc-500 text-xs mt-2">
              Accounts for {percentage}% of your total recorded expenses.
            </p>
          </div>
        </div>

        <div className="bg-[#242424] p-6 rounded-xl border border-zinc-700/50 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
            <TrendingDown size={20} />
          </div>
          <div>
            <h3 className="text-zinc-400 text-sm mb-1">Monthly Comparison</h3>
            <p className="text-xl font-bold text-white">
              {transactions.length === 0 ? 'No data to compare' : 'Expenses look steady'}
            </p>
            <p className="text-zinc-500 text-xs mt-2">Keep tracking to see month-over-month trends.</p>
          </div>
        </div>

        <div className="bg-[#242424] p-6 rounded-xl border border-zinc-700/50 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
            <ArrowUpRight size={20} />
          </div>
          <div>
            <h3 className="text-zinc-400 text-sm mb-1">Financial Health</h3>
            <p className="text-xl font-bold text-white">
              {transactions.length === 0 ? 'Getting Started' : 'Active Tracking'}
            </p>
            <p className="text-zinc-500 text-xs mt-2">You currently have {transactions.length} records logged.</p>
          </div>
        </div>
      </div>

      {/* Renders the newly calculated safe message */}
      <div className="mt-8 bg-[#1e1e24] p-6 rounded-xl border border-blue-900/50">
        <h3 className="text-blue-400 font-medium mb-2">System Observation</h3>
        <p className="text-zinc-300 text-sm leading-relaxed">
          {systemMessage}
        </p>
      </div>
    </div>
  );
};

export default Insights;