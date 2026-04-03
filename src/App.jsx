import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import Transactions from './components/Transactions';
import Insights from './components/Insights';
import { LayoutDashboard, List, TrendingUp } from 'lucide-react';
import { mockTransactions } from './data';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [role, setRole] = useState('Admin');
  
  // 1. Initialize from Local Storage OR fall back to mock data
  const [transactions, setTransactions] = useState(() => {
    const savedData = localStorage.getItem('fintrack_transactions');
    if (savedData) {
      return JSON.parse(savedData);
    }
    return mockTransactions;
  });

  // 2. Save to Local Storage every time 'transactions' changes
  useEffect(() => {
    localStorage.setItem('fintrack_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const navItems = [
    { id: 'overview', icon: <LayoutDashboard size={20} />, label: 'Overview' },
    { id: 'transactions', icon: <List size={20} />, label: 'Transactions' },
    { id: 'insights', icon: <TrendingUp size={20} />, label: 'Insights' },
  ];

  return (
    <div className="flex h-screen bg-[#121212] overflow-hidden text-white font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0 relative">
        <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-zinc-800 bg-[#1a1a1a]">
          <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
          
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 text-sm hidden sm:block">Simulate Role:</span>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-[#2d2d2d] border border-zinc-600 text-white text-sm rounded-lg focus:ring-blue-500 outline-none p-2 cursor-pointer"
            >
              <option value="Admin">Admin</option>
              <option value="Viewer">Viewer</option>
            </select>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-sm font-medium">{role.charAt(0)}</span>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {activeTab === 'overview' && <Overview transactions={transactions} />}
          {activeTab === 'transactions' && (
            <Transactions 
              role={role} 
              transactions={transactions} 
              setTransactions={setTransactions} 
            />
          )}
          {activeTab === 'insights' && <Insights transactions={transactions} />}
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-zinc-800 flex justify-around items-center h-16 z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              activeTab === item.id ? 'text-blue-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;