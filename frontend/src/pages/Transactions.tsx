import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RotateCcw,
  Receipt,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { transactionApi } from '../services/transactionApi';
import { categoryApi } from '../services/categoryApi';
import { Transaction, Category, CategoryType, TransactionFilters } from '../types';
import { formatCurrency, formatDate, getCategoryIcon } from '../utils';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/SkeletonLoader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { TransactionModal } from '../components/transactions/TransactionModal';

export const Transactions: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const currency = user?.currency || 'INR';

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CategoryType | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'transaction_date' | 'amount' | 'title'>('transaction_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load categories
  useEffect(() => {
    categoryApi
      .getAll()
      .then(setCategories)
      .catch((err) => error(err.message || 'Failed to load categories'));
  }, []);

  // Fetch transactions based on filter state
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: TransactionFilters = {
        page,
        limit: 10,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (search.trim()) filters.search = search.trim();
      if (typeFilter) filters.type = typeFilter;
      if (categoryId) filters.category_id = categoryId;
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;

      const res = await transactionApi.getAll(filters);
      setTransactions(res.transactions);
      setPagination(res.pagination);
    } catch (err) {
      error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, typeFilter, categoryId, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setCategoryId('');
    setStartDate('');
    setEndDate('');
    setSortBy('transaction_date');
    setSortOrder('desc');
    setPage(1);
  };

  const handleOpenAdd = () => {
    setSelectedTx(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await transactionApi.delete(deleteId);
      success('Transaction deleted successfully');
      setDeleteId(null);
      fetchTransactions();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 tracking-tight">Transactions</h2>
          <p className="text-xs sm:text-sm text-surface-500 mt-0.5">
            Manage, filter, and inspect your complete transaction history.
          </p>
        </div>

        <Button onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
          Add Transaction
        </Button>
      </div>

      {/* Advanced Filter Toolbar Card */}
      <Card className="p-4 sm:p-5">
        <div className="space-y-4">
          {/* Top Filter Row: Search & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 lg:col-span-5">
              <Input
                placeholder="Search description or title..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="sm:col-span-3 lg:col-span-3">
              <Select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as CategoryType | '');
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All Transaction Types' },
                  { value: 'expense', label: 'Expenses Only' },
                  { value: 'income', label: 'Income Only' },
                ]}
              />
            </div>

            <div className="sm:col-span-3 lg:col-span-4">
              <Select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All Categories' },
                  ...categories.map((c) => ({ value: c.id, label: `${c.name} (${c.type})` })),
                ]}
              />
            </div>
          </div>

          {/* Bottom Filter Row: Date Range, Sort & Reset */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-3 lg:col-span-3">
              <Input
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="sm:col-span-3 lg:col-span-3">
              <Input
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="sm:col-span-3 lg:col-span-3">
              <Select
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'transaction_date' | 'amount' | 'title')}
                options={[
                  { value: 'transaction_date', label: 'Transaction Date' },
                  { value: 'amount', label: 'Amount' },
                  { value: 'title', label: 'Title' },
                ]}
              />
            </div>

            <div className="sm:col-span-3 lg:col-span-3 flex items-end gap-2 pt-5">
              <Button
                variant="secondary"
                size="md"
                className="w-1/2"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                leftIcon={<ArrowUpDown className="w-3.5 h-3.5" />}
              >
                {sortOrder === 'asc' ? 'Asc' : 'Desc'}
              </Button>

              <Button
                variant="outline"
                size="md"
                className="w-1/2"
                onClick={handleResetFilters}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Transaction Table Card */}
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-8 h-8 text-brand-500" />}
            title="No transactions found"
            description={
              search || typeFilter || categoryId || startDate || endDate
                ? 'No transactions matched your search or filter criteria.'
                : 'You have not added any transactions yet.'
            }
            actionLabel={
              search || typeFilter || categoryId || startDate || endDate
                ? 'Clear Filters'
                : 'Add Transaction'
            }
            onAction={
              search || typeFilter || categoryId || startDate || endDate
                ? handleResetFilters
                : handleOpenAdd
            }
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-50/80 border-b border-surface-200/80 text-[11px] font-bold uppercase tracking-wider text-surface-500">
                    <th className="py-3.5 pl-6">Transaction Details</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 text-sm">
                  {transactions.map((tx) => {
                    const IconComp = getCategoryIcon(tx.category_icon);
                    return (
                      <tr key={tx.id} className="hover:bg-surface-50/60 transition-colors group">
                        <td className="py-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                              style={{ backgroundColor: tx.category_color }}
                            >
                              <IconComp className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-surface-900 line-clamp-1">{tx.title}</p>
                              {tx.description && (
                                <p className="text-xs text-surface-400 line-clamp-1 mt-0.5">
                                  {tx.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-surface-700 bg-surface-100 px-2.5 py-1 rounded-lg">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: tx.category_color }}
                            />
                            {tx.category_name}
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <Badge variant={tx.type === 'income' ? 'income' : 'expense'}>
                            {tx.type === 'income' ? 'Income' : 'Expense'}
                          </Badge>
                        </td>

                        <td className="py-4 px-4 text-xs text-surface-500 whitespace-nowrap">
                          {formatDate(tx.transaction_date)}
                        </td>

                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <span
                            className={`font-bold text-base ${
                              tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'}
                            {formatCurrency(tx.amount, currency)}
                          </span>
                        </td>

                        <td className="py-4 pr-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100">
                            <button
                              onClick={() => handleOpenEdit(tx)}
                              className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                              title="Edit transaction"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(tx.id)}
                              className="p-1.5 text-surface-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete transaction"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="border-t border-surface-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-50/50">
              <p className="text-xs text-surface-500">
                Showing{' '}
                <span className="font-semibold text-surface-800">
                  {transactions.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-surface-800">
                  {Math.min(pagination.page * pagination.limit, pagination.total_count)}
                </span>{' '}
                of <span className="font-semibold text-surface-800">{pagination.total_count}</span>{' '}
                transactions
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.has_prev}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>

                <span className="text-xs font-semibold px-2 text-surface-600">
                  Page {pagination.page} of {pagination.total_pages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.has_next}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTransactions}
        initialData={selectedTx}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action will immediately adjust your monthly budget and balance calculations."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
