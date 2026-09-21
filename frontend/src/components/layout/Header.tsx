import React from 'react';
import { Menu, Plus, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenAddTransaction?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onOpenAddTransaction,
  title,
}) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-surface-200/80 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-surface-600 hover:bg-surface-100 hover:text-surface-900 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title ? (
          <h1 className="text-xl font-bold text-surface-900 tracking-tight">{title}</h1>
        ) : (
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Welcome back</p>
            <h2 className="text-sm font-bold text-surface-800">{user?.name || 'User'}</h2>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Currency Pill */}
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-100 text-surface-600 border border-surface-200">
          Currency: {user?.currency || 'INR'}
        </span>

        {/* Quick Add Transaction CTA */}
        {onOpenAddTransaction && (
          <Button
            size="sm"
            onClick={onOpenAddTransaction}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}

        {/* User Profile Avatar Link */}
        <Link
          to="/profile"
          className="p-1.5 rounded-full hover:bg-surface-100 text-surface-600 hover:text-surface-900 transition-colors"
          title="Account Settings"
        >
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs border border-brand-200">
            <UserIcon className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </header>
  );
};
