import React, { useMemo } from 'react';
// IMPORT CHANGED: LineChart -> AreaChart, Line -> Area
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';

const Overview = ({ transactions }) => {
  const { totalIncome, totalExpense } = useMemo(() => {
    return transactions.reduce(
      (acc, txn) => {
        if (txn.type === 'income') acc.totalIncome += txn.amount;
        if (txn.type === 'expense') acc.totalExpense += txn.amount;
        return acc;
      },
      { totalIncome: 0, totalExpense: 0 }
    );
  }, [transactions]);

  const totalBalance = totalIncome - totalExpense;
  
  // Decide graph line color based on deficit vs profit
  const lineColor = totalBalance >= 0 ? '#22c55e' : '#ef4444'; 

  const dynamicCategoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

    const colors = ['#f97316', '#eab308', '#a855f7', '#ec4899', '#84cc16', '#0ea5e9'];
    
    return Object.keys(categoryTotals).map((category, index) => ({
      name: category,
      value: categoryTotals[category],
      color: colors[index % colors.length]
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const dynamicTrendData = useMemo(() => {
    const sortedTxns = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    const groupedByDate = sortedTxns.reduce((acc, txn) => {
      if (!acc[txn.date]) acc[txn.date] = { net: 0, list: [] };
      acc[txn.date].net += (txn.type === 'income' ? txn.amount : -txn.amount);
      acc[txn.date].list.push(txn);
      return acc;
    }, {});

    let runningBalance = 0;
    const dataPoints = [];

    for (const [dateStr, data] of Object.entries(groupedByDate)) {
      runningBalance += data.net;
      const dateObj = new Date(dateStr);
      
      const shortDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const longDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      dataPoints.push({
        name: shortDate,
        fullDate: longDate,
        balance: runningBalance,
        transactionsThatDay: data.list 
      });
    }

    return dataPoints;
  }, [transactions]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const pointData = payload[0].payload;
      return (
        <div className="bg-[#18181b] p-4 border border-zinc-700/80 rounded-xl shadow-2xl text-sm min-w-50 backdrop-blur-sm">
          <p className="text-zinc-400 mb-2 font-medium border-b border-zinc-800 pb-2">{pointData.fullDate}</p>
          <p className="text-white font-bold mb-3 text-base" style={{ color: lineColor }}>
            Balance: ₹{pointData.balance.toLocaleString('en-IN')}
          </p>
          <div className="space-y-1.5">
            {pointData.transactionsThatDay.map((txn, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 truncate max-w-[100px]">{txn.category}</span>
                <span className={txn.type === 'income' ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                  {txn.type === 'income' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#242424] p-6 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-colors">
          <p className="text-zinc-400 text-sm mb-1">Total Balance</p>
          <h2 className={`text-3xl font-bold mb-2 ${totalBalance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
            ₹{totalBalance.toLocaleString('en-IN')}
          </h2>
          <p className="text-zinc-500 text-sm">Updated just now</p>
        </div>

        <div className="bg-[#242424] p-6 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-colors">
          <p className="text-zinc-400 text-sm mb-1">Total Income</p>
          <h2 className="text-3xl font-bold text-green-500 mb-2">₹{totalIncome.toLocaleString('en-IN')}</h2>
          <p className="text-zinc-500 text-sm">Based on records</p>
        </div>

        <div className="grid grid-rows-2 gap-6">
            <div className="bg-[#242424] p-4 rounded-xl border border-zinc-700/50 flex flex-col justify-center hover:border-zinc-600 transition-colors">
                <p className="text-zinc-400 text-sm mb-1">Total Expenses</p>
                <h2 className="text-xl font-bold text-red-500 mb-1">₹{totalExpense.toLocaleString('en-IN')}</h2>
            </div>
            <div className="bg-[#242424] p-4 rounded-xl border border-zinc-700/50 flex flex-col justify-center hover:border-zinc-600 transition-colors">
                <p className="text-zinc-400 text-sm mb-1">Total Transactions</p>
                <h2 className="text-xl font-bold text-white mb-1">{transactions.length}</h2>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PREMIUM AREA CHART */}
        <div className="bg-[#242424] p-6 rounded-xl border border-zinc-700/50">
          <h3 className="text-lg font-semibold mb-6">Balance Trend</h3>
          {dynamicTrendData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dynamicTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  
                  {/* Gradient Definition */}
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={lineColor} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={lineColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="5 5" stroke="#3f3f46" vertical={false} opacity={0.5} />
                  
                  <XAxis 
                    dataKey="name" 
                    stroke="#a1a1aa" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#a1a1aa" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => {
                      if (Math.abs(value) >= 1000) return `₹${(value/1000).toFixed(0)}k`;
                      return `₹${value}`;
                    }} 
                  />
                  
                  {/* Added a subtle cursor line when hovering */}
                  <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke={lineColor} 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorBalance)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: lineColor, style: { filter: `drop-shadow(0px 0px 4px ${lineColor})` } }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-64 flex items-center justify-center text-zinc-500">No transaction data available.</div>
          )}
        </div>

        {/* PIE CHART (Unchanged) */}
        <div className="bg-[#242424] p-6 rounded-xl border border-zinc-700/50">
          <h3 className="text-lg font-semibold mb-6">Spending by Category</h3>
          {dynamicCategoryData.length > 0 ? (
            <>
              <div className="h-48 flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dynamicCategoryData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                      {dynamicCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-4 mt-6 justify-center max-h-20 overflow-y-auto custom-scrollbar">
                {dynamicCategoryData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-zinc-300">{item.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-zinc-500">No expenses recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;