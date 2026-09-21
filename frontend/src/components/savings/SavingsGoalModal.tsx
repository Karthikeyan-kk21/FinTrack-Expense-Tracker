import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { SavingsGoal } from '../../types';
import { savingsApi } from '../../services/savingsApi';
import { AVAILABLE_ICONS, CATEGORY_COLORS, getCategoryIcon } from '../../utils/constants';
import { useToast } from '../../context/ToastContext';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialGoal?: SavingsGoal | null;
}

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialGoal,
}) => {
  const isEditing = !!initialGoal;
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState('#10B981');
  const [icon, setIcon] = useState('PiggyBank');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (initialGoal) {
        setTitle(initialGoal.title);
        setTargetAmount(String(initialGoal.target_amount));
        setInitialAmount(String(initialGoal.current_amount));
        setTargetDate(initialGoal.target_date || '');
        setColor(initialGoal.color);
        setIcon(initialGoal.icon);
      } else {
        setTitle('');
        setTargetAmount('');
        setInitialAmount('');
        setTargetDate('');
        setColor('#10B981');
        setIcon('PiggyBank');
      }
      setErrors({});
    }
  }, [isOpen, initialGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (!targetAmount || Number(targetAmount) <= 0) newErrors.targetAmount = 'Target amount must be greater than 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && initialGoal) {
        await savingsApi.updateGoal(initialGoal.id, {
          title: title.trim(),
          target_amount: Number(targetAmount),
          target_date: targetDate || undefined,
          color,
          icon,
        });
        success('Savings goal updated successfully');
      } else {
        await savingsApi.createGoal({
          title: title.trim(),
          target_amount: Number(targetAmount),
          initial_amount: initialAmount ? Number(initialAmount) : 0,
          target_date: targetDate || undefined,
          color,
          icon,
        });
        success('Savings goal created successfully');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Savings Goal' : 'Create New Savings Goal'}
      subtitle="Set target amount and deadlines for specific financial goals"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Goal Name / Purpose"
          placeholder="e.g. Emergency Fund, New Laptop, Vacation..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Target Amount"
            type="number"
            step="0.01"
            min="1"
            placeholder="e.g. 50000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            error={errors.targetAmount}
            required
          />

          {!isEditing && (
            <Input
              label="Initial Deposit (Optional)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
            />
          )}

          {isEditing && (
            <Input
              label="Target Deadline"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          )}
        </div>

        {!isEditing && (
          <Input
            label="Target Deadline (Optional)"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        )}

        {/* Color Palette */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 mb-1.5">
            Badge Color
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-offset-2 ring-surface-800' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Icon Grid */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 mb-1.5">
            Choose Icon
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 max-h-32 overflow-y-auto p-2 bg-surface-50 border border-surface-200 rounded-xl">
            {AVAILABLE_ICONS.map((iconName) => {
              const IconComp = getCategoryIcon(iconName);
              const isSelected = icon === iconName;
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-surface-900 text-white shadow-sm scale-105'
                      : 'text-surface-600 hover:bg-surface-200 hover:text-surface-900'
                  }`}
                  title={iconName}
                >
                  <IconComp className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
