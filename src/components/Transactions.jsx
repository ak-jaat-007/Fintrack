import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Filter, X, Download, AlertTriangle } from 'lucide-react';

const Transactions = ({ role, transactions, setTransactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [isExportOpen, setIsExportOpen] = useState(false);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(transactions.map(t => t.category))];
    return uniqueCategories.sort();
  }, [transactions]);

  const filteredAndSortedData = useMemo(() => {
    let result = transactions.filter((txn) => {
      const matchSearch = txn.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'all' || txn.type === filterType;
      const matchCategory = filterCategory === 'all' || txn.category === filterCategory;
      
      const txnDate = new Date(txn.date);
      const matchStartDate = !startDate || txnDate >= new Date(startDate);
      const matchEndDate = !endDate || txnDate <= new Date(endDate);

      return matchSearch && matchType && matchCategory && matchStartDate && matchEndDate;
    });

    result.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'amount-high') return b.amount - a.amount;
      if (sortBy === 'amount-low') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [transactions, searchTerm, filterType, filterCategory, startDate, endDate, sortBy]);

  const handleExport = (format) => {
    let fileContent = "";
    let fileName = `fintrack_export_${new Date().toISOString().split('T')[0]}`;
    let mimeType = "";

    if (format === 'json') {
      fileContent = JSON.stringify(filteredAndSortedData, null, 2);
      fileName += ".json";
      mimeType = "application/json";
    } else {
      const headers = ["Date", "Description", "Category", "Type", "Amount"];
      const rows = filteredAndSortedData.map(t => [
        t.date,
        `"${t.description}"`, 
        t.category,
        t.type,
        t.amount
      ]);
      fileContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      fileName += ".csv";
      mimeType = "text/csv";
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExportOpen(false);
  };

  const handleDelete = (id) => {
    if (role !== 'Admin') return;
    setTransactions(transactions.filter(t => t.id !== id));
  };

  // NEW: Handle Clear All Functionality
  const handleClearAll = () => {
    if (role !== 'Admin') return;
    
    // Safety check confirmation
    const confirmDelete = window.confirm("⚠️ Are you sure you want to delete ALL transactions? This action cannot be undone.");
    
    if (confirmDelete) {
      setTransactions([]); // Empties the array
    }
  };

  const handleAddTransaction = () => {
    if (role !== 'Admin') return;
    const desc = window.prompt("Enter transaction description:");
    if (!desc) return; 
    const amountStr = window.prompt("Enter amount in ₹:");
    if (!amountStr || isNaN(amountStr)) return; 
    const typePrompt = window.prompt("Type 'income' or 'expense':");
    if (!typePrompt) return;
    const typeStr = typePrompt.toLowerCase().trim();
    if (typeStr !== 'income' && typeStr !== 'expense') {
      alert("Error: You must type either 'income' or 'expense'. Transaction cancelled.");
      return;
    }
    const categoryStr = window.prompt("Enter category:") || 'General';

    const newTxn = {
      id: Date.now(), 
      date: new Date().toISOString().split('T')[0], 
      description: desc,
      amount: Number(amountStr),
      category: categoryStr, 
      type: typeStr 
    };
    setTransactions([newTxn, ...transactions]);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterCategory('all');
    setStartDate('');
    setEndDate('');
    setSortBy('date-desc');
  };

  return (
    <div className="max-w-6xl mx-auto pb-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Recent Transactions</h2>
        
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          
          <div className="relative">
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              className={`bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors border ${isExportOpen ? 'border-zinc-500' : 'border-zinc-700'}`}
            >
              <Download size={18} />
              Export
            </button>
            
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-[#242424] border border-zinc-700 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 rounded-t-lg transition-colors">As CSV</button>
                <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 rounded-b-lg transition-colors border-t border-zinc-700/50">As JSON</button>
              </div>
            )}
          </div>

          {role === 'Admin' && (
            <>
              {/* NEW: Clear All Button */}
              <button 
                onClick={handleClearAll}
                disabled={transactions.length === 0}
                className="bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 hover:border-red-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete all transactions"
              >
                <AlertTriangle size={18} />
                <span className="hidden sm:inline">Clear All</span>
              </button>

              <button 
                onClick={handleAddTransaction} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors justify-center"
              >
                <Plus size={18} />
                Add New
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-[#242424] rounded-xl border border-zinc-700/50 overflow-hidden mb-6">
        <div className="p-4 border-b border-zinc-700/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-zinc-700 text-white rounded-lg pl-10 pr-4 py-2 outline-none focus:border-blue-500 text-sm"
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#1a1a1a] border border-zinc-700 text-white text-sm rounded-lg p-2 outline-none cursor-pointer flex-1 md:flex-none"
            >
              <option value="all">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expense Only</option>
            </select>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${showFilters ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#1a1a1a] border-zinc-700 text-zinc-300 hover:text-white'}`}
            >
              <Filter size={16} />
              <span className="hidden sm:block">Filters</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-[#1e1e1e] border-b border-zinc-700/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-medium">Category</label>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-[#1a1a1a] border border-zinc-700 text-white text-sm rounded-lg p-2 outline-none">
                <option value="all">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-medium">Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-[#1a1a1a] border border-zinc-700 text-white text-sm rounded-lg p-2 outline-none">
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-high">Highest Amount</option>
                <option value="amount-low">Lowest Amount</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-medium">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-[#1a1a1a] border border-zinc-700 text-white text-sm rounded-lg p-2 outline-none [color-scheme:dark]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <label className="text-xs text-zinc-400 font-medium">End Date</label>
                <button onClick={resetFilters} className="text-[10px] text-zinc-500 hover:text-red-400 uppercase tracking-wider transition-colors">Reset</button>
              </div>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-[#1a1a1a] border border-zinc-700 text-white text-sm rounded-lg p-2 outline-none [color-scheme:dark]" />
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1a1a1a] text-zinc-400 border-b border-zinc-700/50">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                {role === 'Admin' && <th className="px-6 py-4 font-medium text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/50">
              {filteredAndSortedData.map((txn) => (
                <tr key={txn.id} className="hover:bg-[#2a2a2a] transition-colors group">
                  <td className="px-6 py-4 text-zinc-400">{txn.date}</td>
                  <td className="px-6 py-4 font-medium text-white">{txn.description}</td>
                  <td className="px-6 py-4">
                    <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs border border-zinc-700">{txn.category}</span>
                  </td>
                  <td className={`px-6 py-4 text-right font-medium ${txn.type === 'income' ? 'text-green-500' : 'text-zinc-200'}`}>
                    {txn.type === 'income' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                  </td>
                  {role === 'Admin' && (
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleDelete(txn.id)} className="text-zinc-500 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredAndSortedData.length === 0 && transactions.length > 0 && (
                <tr>
                  <td colSpan={role === 'Admin' ? 5 : 4} className="px-6 py-12 text-center text-zinc-500">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              )}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={role === 'Admin' ? 5 : 4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-500 gap-3">
                       <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center">
                         <Filter size={24} className="text-zinc-600" />
                       </div>
                       <p className="text-zinc-400">Your transaction history is empty.</p>
                       {role === 'Admin' && (
                         <button onClick={handleAddTransaction} className="text-blue-500 hover:text-blue-400 text-sm font-medium mt-1">
                           + Add your first transaction
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;