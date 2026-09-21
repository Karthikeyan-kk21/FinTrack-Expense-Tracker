import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Budget, Category } from '../../types';
import { budgetApi } from '../../services/budgetApi';
import { useToast } from '../../context/ToastContext';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  initialMonth: number;
  initialYear: number;
  initialBudget?: Budget | null;
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
  initialMonth,
  initialYear,
  initialBudget,
}) => {
  const { success, error } = useToast();
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [month, setMonth] = useState<number>(initialMonth);
  const [year, setYear] = useState<number>(initialYear);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  useEffect(() => {
    if (isOpen) {
      if (initialBudget) {
        setCategoryId(initialBudget.category_id);
        setAmount(String(initialBudget.amount));
        setMonth(initialBudget.month);
        setYear(initialBudget.year);
      } else {
        setCategoryId(expenseCategories.length > 0 ? expenseCategories[0].id : '');
        setAmount('');
        setMonth(initialMonth);
        setYear(initialYear);
      }
      setErrors({});
    }
  }, [isOpen, initialBudget, initialMonth, initialYear, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!categoryId) newErrors.categoryId = 'Please select an expense category';
    if (!amount || Number(amount) <= 0) newErrors.amount = 'Budget limit must be greater than 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await budgetApi.saveBudget({
        category_id: categoryId,
        amount: Number(amount),
        month: Number(month),
        year: Number(year),
      });
      success('Budget limit saved successfully');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save budget';
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialBudget ? 'Update Budget' : 'Set Category Budget'}
      subtitle="Establish monthly spending limits to stay on financial track"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Expense Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={expenseCategories.map((c) => ({ value: c.id, label: c.name }))}
          error={errors.categoryId}
          placeholder="Select an expense category"
          required
        />

        <Input
          label="Budget Limit Amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="e.g. 10000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            options={MONTHS}
            required
          />

          <Input
            label="Year"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={2020}
            max={2035}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {initialBudget ? 'Save Changes' : 'Create Budget'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
