import React, { useState, useEffect, useCallback } from 'react';
import {
  PiggyBank,
  Plus,
  Target,
  TrendingUp,
  CheckCircle2,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { savingsApi } from '../services/savingsApi';
import { SavingsGoal, SavingsSummary } from '../types';
import { formatCurrency, formatDate, getCategoryIcon } from '../utils';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ProgressBar } from '../components/common/ProgressBar';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/SkeletonLoader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { SavingsGoalModal } from '../components/savings/SavingsGoalModal';
import { DepositModal } from '../components/savings/DepositModal';

export const Savings: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const currency = user?.currency || 'INR';

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [summary, setSummary] = useState<SavingsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await savingsApi.getGoals();
      setGoals(res.goals);
      setSummary(res.summary);
    } catch (err) {
      error('Failed to load savings goals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleOpenAdd = () => {
    setSelectedGoal(null);
    setIsGoalModalOpen(true);
  };

  const handleOpenEdit = (g: SavingsGoal) => {
    setSelectedGoal(g);
    setIsGoalModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await savingsApi.deleteGoal(deleteId);
      success('Savings goal deleted successfully');
      setDeleteId(null);
      fetchGoals();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to delete goal');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 tracking-tight">Savings & Wealth Goals</h2>
          <p className="text-xs sm:text-sm text-surface-500 mt-0.5">
            Track dedicated savings targets separately from everyday income and expenses.
          </p>
        </div>

        <Button onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
          New Savings Goal
        </Button>
      </div>

      {/* Top Summary Banner */}
      {summary && (
        <Card className="bg-gradient-to-r from-surface-900 via-surface-800 to-surface-900 text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center relative z-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">
                Total Saved in Goals
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
                {formatCurrency(summary.total_saved, currency)}
              </h3>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">
                Total Target Goal
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {formatCurrency(summary.total_target, currency)}
              </h3>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">
                Remaining to Target
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-surface-200 mt-1">
                {formatCurrency(summary.total_remaining, currency)}
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Overall Goal Progress</span>
                <span className="text-emerald-400">{summary.overall_percentage}%</span>
              </div>
              <ProgressBar value={summary.overall_percentage} height="md" color="#10B981" />
              <p className="text-[11px] text-surface-400 text-right">
                {summary.completed_goals} of {summary.total_goals} goals reached
              </p>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        </Card>
      )}

      {/* Goals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={<PiggyBank className="w-8 h-8 text-brand-500" />}
          title="No savings goals yet"
          description="Create specific savings funds like Emergency Fund, Vacation, or Down Payment and record deposits."
          actionLabel="Create First Goal"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((g) => {
            const IconComp = getCategoryIcon(g.icon);
            return (
              <Card key={g.id} hoverEffect className="flex flex-col justify-between group">
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                        style={{ backgroundColor: g.color }}
                      >
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-surface-900 text-base flex items-center gap-1.5">
                          {g.title}
                          {g.is_completed && (
                            <span title="Goal Achieved!">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </span>
                          )}
                        </h4>
                        <span className="text-xs text-surface-500">
                          Target: {formatCurrency(g.target_amount, currency)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(g)}
                        className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Edit goal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(g.id)}
                        className="p-1.5 text-surface-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-2xl font-extrabold text-surface-900 tracking-tight">
                      {formatCurrency(g.current_amount, currency)}
                    </span>
                    <span className="text-xs font-semibold text-surface-500">
                      {g.percentage_completed}% reached
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <ProgressBar
                    value={g.percentage_completed}
                    height="md"
                    color={g.color}
                    autoColor={false}
                  />

                  {/* Target Date or Remaining */}
                  <div className="mt-3 flex items-center justify-between text-xs text-surface-500">
                    <span>
                      {g.is_completed
                        ? '🎉 Goal Reached!'
                        : `${formatCurrency(g.remaining_amount, currency)} to go`}
                    </span>
                    {g.target_date && (
                      <span className="flex items-center gap-1 text-[11px] text-surface-400">
                        <Calendar className="w-3 h-3" /> By {formatDate(g.target_date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Button: Add Deposit */}
                <div className="mt-5 pt-3 border-t border-surface-100 flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setDepositGoal(g)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Deposit
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Goal Modal */}
      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSuccess={fetchGoals}
        initialGoal={selectedGoal}
      />

      {/* Deposit Modal */}
      <DepositModal
        isOpen={!!depositGoal}
        onClose={() => setDepositGoal(null)}
        onSuccess={fetchGoals}
        goal={depositGoal}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Savings Goal"
        message="Are you sure you want to delete this savings goal and its deposit history?"
        confirmLabel="Delete Goal"
        isLoading={isDeleting}
      />
    </div>
  );
};
