import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import Transactions from './components/Transactions';
import Insights from './components/Insights';
import {
  LayoutDashboard,
  List,
  TrendingUp,
  Database,
  WifiOff,
} from 'lucide-react';
import { mockTransactions } from './data';
import { api } from './api';

/*
 * Normalize transaction dates before they enter React state.
 *
 * PostgreSQL DATE should represent only the calendar date:
 * YYYY-MM-DD
 *
 * Depending on the backend/driver, the API can sometimes return:
 * 2026-05-02
 * or
 * 2026-05-02T18:30:00.000Z
 *
 * We intentionally take the first 10 characters instead of
 * converting the value through JavaScript Date/timezone logic.
 * This prevents a calendar date from shifting into another
 * day or month.
 */
const normalizeDate = (value) => {
  if (!value) return '';

  const stringValue = String(value).trim();

  if (stringValue.length >= 10) {
    const firstTen = stringValue.slice(0, 10);

    if (/^\d{4}-\d{2}-\d{2}$/.test(firstTen)) {
      return firstTen;
    }
  }

  return stringValue;
};

/*
 * Keep every transaction in one consistent frontend format.
 */
const normalizeTransaction = (transaction) => ({
  ...transaction,
  date: normalizeDate(transaction.date),
  amount: Number(transaction.amount),
});

/*
 * Normalize an entire transaction collection safely.
 */
const normalizeTransactions = (transactionList) => {
  if (!Array.isArray(transactionList)) {
    return [];
  }

  return transactionList.map(normalizeTransaction);
};

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [role, setRole] = useState('Admin');

  const [transactions, setTransactions] = useState(
    normalizeTransactions(mockTransactions)
  );

  const [analytics, setAnalytics] = useState(null);
  const [dataSource, setDataSource] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  /*
   * Load PostgreSQL data.
   */
  const loadData = async () => {
    setErrorMessage('');

    try {
      const [transactionData, overviewData] =
        await Promise.all([
          api.getTransactions(),
          api.getOverview(),
        ]);

      /*
       * Normalize API records BEFORE putting them into React state.
       */
      const normalizedTransactions =
        normalizeTransactions(transactionData);

      setTransactions(normalizedTransactions);
      setAnalytics(overviewData);
      setDataSource('postgresql');

      /*
       * Save normalized data instead of raw API response.
       */
      localStorage.setItem(
        'fintrack_transactions',
        JSON.stringify(normalizedTransactions)
      );
    } catch (error) {
      console.error(
        'PostgreSQL API unavailable:',
        error
      );

      /*
       * Fall back to the last normalized local copy.
       */
      const savedData = localStorage.getItem(
        'fintrack_transactions'
      );

      let fallback = normalizeTransactions(
        mockTransactions
      );

      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);

          if (Array.isArray(parsedData)) {
            fallback =
              normalizeTransactions(parsedData);
          }
        } catch (storageError) {
          console.error(
            'Could not parse saved transactions:',
            storageError
          );
        }
      }

      setTransactions(fallback);
      setAnalytics(null);
      setDataSource('local');

      setErrorMessage(
        'PostgreSQL API unavailable. Using local demo data.'
      );
    }
  };

  /*
   * Load data once when the application starts.
   */
  useEffect(() => {
    loadData();
  }, []);

  /*
   * Add a new transaction.
   */
  const handleAddTransaction = async (
    transaction
  ) => {
    try {
      if (dataSource === 'postgresql') {
        /*
         * Normalize the transaction returned by PostgreSQL API.
         */
        const createdTransaction =
          await api.addTransaction(transaction);

        const normalizedCreated =
          normalizeTransaction(
            createdTransaction
          );

        const next = [
          normalizedCreated,
          ...transactions,
        ];

        setTransactions(next);

        localStorage.setItem(
          'fintrack_transactions',
          JSON.stringify(next)
        );

        const overviewData =
          await api.getOverview();

        setAnalytics(overviewData);

        return;
      }

      /*
       * Local fallback transaction.
       */
      const fallbackTransaction =
        normalizeTransaction({
          ...transaction,
          id: Date.now(),
        });

      const next = [
        fallbackTransaction,
        ...transactions,
      ];

      setTransactions(next);

      localStorage.setItem(
        'fintrack_transactions',
        JSON.stringify(next)
      );
    } catch (error) {
      console.error(
        'Failed to add transaction:',
        error
      );

      setErrorMessage(
        'Could not add the transaction. Please try again.'
      );
    }
  };

  /*
   * Delete a transaction.
   */
  const handleDeleteTransaction = async (
    id
  ) => {
    try {
      if (dataSource === 'postgresql') {
        await api.deleteTransaction(id);

        const next = transactions.filter(
          (transaction) =>
            transaction.id !== id
        );

        setTransactions(next);

        localStorage.setItem(
          'fintrack_transactions',
          JSON.stringify(next)
        );

        const overviewData =
          await api.getOverview();

        setAnalytics(overviewData);

        return;
      }

      const next = transactions.filter(
        (transaction) =>
          transaction.id !== id
      );

      setTransactions(next);

      localStorage.setItem(
        'fintrack_transactions',
        JSON.stringify(next)
      );
    } catch (error) {
      console.error(
        'Failed to delete transaction:',
        error
      );

      setErrorMessage(
        'Could not delete the transaction. Please try again.'
      );
    }
  };

  /*
   * Clear all transactions.
   */
  const handleClearTransactions = async () => {
    try {
      if (dataSource === 'postgresql') {
        await api.clearTransactions();

        setTransactions([]);
        setAnalytics(null);

        localStorage.setItem(
          'fintrack_transactions',
          JSON.stringify([])
        );

        return;
      }

      setTransactions([]);
      setAnalytics(null);

      localStorage.setItem(
        'fintrack_transactions',
        JSON.stringify([])
      );
    } catch (error) {
      console.error(
        'Failed to clear transactions:',
        error
      );

      setErrorMessage(
        'Could not clear transactions. Please try again.'
      );
    }
  };

  /*
   * Sidebar navigation.
   */
  const navItems = [
    {
      id: 'overview',
      icon: <LayoutDashboard size={20} />,
      label: 'Overview',
    },
    {
      id: 'transactions',
      icon: <List size={20} />,
      label: 'Transactions',
    },
    {
      id: 'insights',
      icon: <TrendingUp size={20} />,
      label: 'Insights',
    },
  ];

  return (
    <div className="flex h-screen bg-[#121212] overflow-hidden text-white font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 overflow-y-auto pb-16 md:pb-0 relative">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-8 py-4 border-b border-zinc-800 bg-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold capitalize">
              {activeTab}
            </h2>

            {/* DATA SOURCE BADGE */}

            <span
              className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1.5 ${
                dataSource === 'postgresql'
                  ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                  : 'text-amber-400 border-amber-500/20 bg-amber-500/10'
              }`}
            >
              {dataSource === 'postgresql' ? (
                <Database size={12} />
              ) : (
                <WifiOff size={12} />
              )}

              {dataSource === 'postgresql'
                ? 'PostgreSQL'
                : dataSource === 'local'
                ? 'Local Demo'
                : 'Connecting'}
            </span>
          </div>

          {/* ROLE */}

          <div className="flex items-center gap-3">
            <span className="text-zinc-400 text-sm hidden sm:block">
              Simulate Role:
            </span>

            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value)
              }
              className="bg-[#2d2d2d] border border-zinc-600 text-white text-sm rounded-lg focus:ring-blue-500 outline-none p-2 cursor-pointer"
            >
              <option value="Admin">
                Admin
              </option>

              <option value="Viewer">
                Viewer
              </option>
            </select>

            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-medium">
                {role.charAt(0)}
              </span>
            </div>
          </div>
        </header>

        {/* =====================================================
            ERROR MESSAGE
        ====================================================== */}

        {errorMessage && (
          <div className="mx-4 mt-4 md:mx-6 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm rounded-lg px-4 py-3">
            {errorMessage}
          </div>
        )}

        {/* =====================================================
            PAGE CONTENT
        ====================================================== */}

        <div className="p-4 md:p-6">
          {activeTab === 'overview' && (
            <Overview
              transactions={transactions}
              analytics={analytics}
            />
          )}

          {activeTab === 'transactions' && (
            <Transactions
              role={role}
              transactions={transactions}
              onAddTransaction={
                handleAddTransaction
              }
              onDeleteTransaction={
                handleDeleteTransaction
              }
              onClearTransactions={
                handleClearTransactions
              }
            />
          )}

          {activeTab === 'insights' && (
            <Insights
              transactions={transactions}
            />
          )}
        </div>
      </main>

      {/* =====================================================
          MOBILE NAVIGATION
      ====================================================== */}

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-zinc-800 flex justify-around items-center h-16 z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() =>
              setActiveTab(item.id)
            }
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              activeTab === item.id
                ? 'text-blue-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {item.icon}

            <span className="text-[10px] font-medium">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;