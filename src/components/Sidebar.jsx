import React, { useState } from 'react';
import { LayoutDashboard, List, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  // NEW: State to manage sidebar collapse
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'transactions', label: 'Transactions', icon: <List size={20} /> },
    { id: 'insights', label: 'Insights', icon: <TrendingUp size={20} /> },
  ];

  return (
    // Added relative positioning, dynamic width (w-64 vs w-20), and transition-all for smooth animation
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[#1a1a1a] h-screen border-r border-zinc-800 hidden md:flex flex-col transition-all duration-300 relative z-40`}>
      
      {/* Toggle Collapse Button - Floating on the right edge */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-zinc-700 hover:bg-blue-600 text-white rounded-full p-1 transition-colors shadow-lg border border-zinc-600 hover:border-blue-500 z-50 flex items-center justify-center"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="p-6 h-20 flex items-center whitespace-nowrap overflow-hidden">
        <h1 className="text-2xl font-bold flex items-center">
          {isCollapsed ? (
            <span className="text-blue-500 mx-auto w-full text-center">F</span>
          ) : (
            <>
              <span className="text-white">Fin</span>
              <span className="text-blue-500">Track</span>
            </>
          )}
        </h1>
      </div>
      
      <nav className="mt-4 flex-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={isCollapsed ? item.label : ""} // Shows label on hover when collapsed
            className={`w-full flex items-center py-3 transition-colors overflow-hidden whitespace-nowrap ${
              activeTab === item.id 
                ? 'bg-blue-600/10 text-blue-500 border-l-4 border-blue-500' 
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white border-l-4 border-transparent'
            } ${isCollapsed ? 'justify-center px-0' : 'px-6 gap-3'}`}
          >
            <div className={`${isCollapsed ? 'mx-auto' : ''}`}>
               {item.icon}
            </div>
            
            {/* Hide text when collapsed */}
            {!isCollapsed && (
              <span className="font-medium">{item.label}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;