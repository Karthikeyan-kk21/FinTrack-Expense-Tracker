import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { budgetApi } from '../services/budgetApi';
import { categoryApi } from '../services/categoryApi';
import { Budget, Category, BudgetSummary } from '../types';
import { formatCurrency, formatMonthYear, getCategoryIcon } from '../utils';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/SkeletonLoader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { BudgetModal } from '../components/budgets/BudgetModal';

export const Budgets: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const currency = user?.currency || 'INR';

  const today = new Date();
  const [month, setMonth] = useState<number>(today.getMonth() + 1);
  const [year, setYear] = useState<number>(today.getFullYear());

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load categories
  useEffect(() => {
    categoryApi
      .getAll('expense')
      .then(setCategories)
      .catch((err) => error(err.message || 'Failed to load categories'));
  }, []);

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await budgetApi.getBudgets(month, year);
      setBudgets(res.budgets);
      setSummary(res.summary);
    } catch (err) {
      error('Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleOpenAdd = () => {
    setSelectedBudget(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Budget) => {
    setSelectedBudget(b);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await budgetApi.deleteBudget(deleteId);
      success('Budget removed successfully');
      setDeleteId(null);
      fetchBudgets();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to delete budget');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation and Add Budget CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 tracking-tight">Monthly Budgets</h2>
          <p className="text-xs sm:text-sm text-surface-500 mt-0.5">
            Set and monitor monthly spending limits for each category.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Navigator */}
          <div className="flex items-center bg-white border border-surface-200 rounded-2xl shadow-subtle p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl text-surface-500 hover:bg-surface-100 hover:text-surface-900 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-bold text-surface-800 flex items-center gap-1.5 min-w-[140px] justify-center">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              {formatMonthYear(month, year)}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl text-surface-500 hover:bg-surface-100 hover:text-surface-900 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
            Set Budget
          </Button>
        </div>
      </div>

      {/* Overall Monthly Budget Summary Banner */}
      {summary && (
        <Card className="bg-gradient-to-r from-surface-900 to-surface-800 text-white p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">
                Total Budgeted
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {formatCurrency(summary.total_budgeted, currency)}
              </h3>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">
                Total Spent
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {formatCurrency(summary.total_spent, currency)}
              </h3>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">
                Remaining Limit
              </p>
              <h3
                className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
                  summary.is_overall_exceeded ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {formatCurrency(summary.total_remaining, currency)}
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Total Utilization</span>
                <span
                  className={summary.is_overall_exceeded ? 'text-rose-400' : 'text-emerald-400'}
                >
                  {summary.overall_percentage_used}%
                </span>
              </div>
              <ProgressBar value={summary.overall_percentage_used} height="md" />
            </div>
          </div>
        </Card>
      )}

      {/* Category Budgets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={<Target className="w-8 h-8 text-brand-500" />}
          title={`No budgets set for ${formatMonthYear(month, year)}`}
          description="Create spending limits for categories like Food, Transport, and Entertainment to stay disciplined."
          actionLabel="Set Category Budget"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((b) => {
            const IconComp = getCategoryIcon(b.category_icon);
            return (
              <Card key={b.id} hoverEffect className="flex flex-col justify-between">
                <div>
                  {/* Card Header: Category & Actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                        style={{ backgroundColor: b.category_color }}
                      >
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-surface-900 text-base">{b.category_name}</h4>
                        <span className="text-xs text-surface-500">
                          Limit: {formatCurrency(b.amount, currency)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Edit limit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(b.id)}
                        className="p-1.5 text-surface-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete budget"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts Row */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-2xl font-extrabold text-surface-900 tracking-tight">
                      {formatCurrency(b.spent_amount, currency)}
                    </span>
                    <span className="text-xs font-semibold text-surface-500">
                      of {formatCurrency(b.amount, currency)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <ProgressBar value={b.percentage_used} height="md" />
                </div>

                {/* Card Footer: Status Alert */}
                <div className="mt-4 pt-3 border-t border-surface-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {b.is_exceeded ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="font-bold text-rose-600">
                          Exceeded by {formatCurrency(b.over_amount, currency)}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-medium text-surface-600">
                          <strong className="text-emerald-700 font-bold">
                            {formatCurrency(b.remaining_amount, currency)}
                          </strong>{' '}
                          remaining
                        </span>
                      </>
                    )}
                  </div>

                  <span
                    className={`font-bold px-2 py-0.5 rounded-full ${
                      b.is_exceeded
                        ? 'bg-rose-50 text-rose-700'
                        : b.percentage_used >= 80
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {b.percentage_used}%
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBudgets}
        categories={categories}
        initialMonth={month}
        initialYear={year}
        initialBudget={selectedBudget}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Budget"
        message="Are you sure you want to delete this budget limit? Your existing transactions will not be deleted."
        confirmLabel="Remove Budget"
        isLoading={isDeleting}
      />
    </div>
  );
};
