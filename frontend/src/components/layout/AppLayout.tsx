import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TransactionModal } from '../transactions/TransactionModal';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/budgets': 'Monthly Budgets',
  '/savings': 'Savings & Wealth Goals',
  '/categories': 'Categories',
  '/reports': 'Financial Reports',
  '/profile': 'My Profile & Preferences',
};

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const location = useLocation();

  const title = PAGE_TITLES[location.pathname] || 'FinTrack';

  const handleTransactionAdded = () => {
    // Dispatch custom event so active pages can instantly refresh their data
    window.dispatchEvent(new CustomEvent('transaction-updated'));
  };

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          title={title}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenAddTransaction={() => setIsAddModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Global Add Transaction Modal */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleTransactionAdded}
      />
    </div>
  );
};
