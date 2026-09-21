import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { SavingsGoal } from '../../types';
import { savingsApi } from '../../services/savingsApi';
import { formatCurrency } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal: SavingsGoal | null;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  goal,
}) => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const { success, error } = useToast();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setNote('');
      setDepositDate(new Date().toISOString().split('T')[0]);
      setErrors({});
    }
  }, [isOpen]);

  if (!goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErrors({ amount: 'Please enter a valid deposit amount greater than 0' });
      return;
    }

    setIsSubmitting(true);
    try {
      await savingsApi.recordDeposit(goal.id, {
        amount: Number(amount),
        note: note.trim() || undefined,
        deposit_date: depositDate,
      });
      success(`Deposited ${formatCurrency(amount, currency)} to ${goal.title}`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deposit failed';
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Deposit to ${goal.title}`}
      subtitle={`Current Progress: ${formatCurrency(goal.current_amount, currency)} / ${formatCurrency(goal.target_amount, currency)} (${goal.percentage_completed}%)`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Deposit Amount"
          type="number"
          step="0.01"
          min="1"
          placeholder="e.g. 5000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          required
        />

        <Input
          label="Deposit Date"
          type="date"
          value={depositDate}
          onChange={(e) => setDepositDate(e.target.value)}
          required
        />

        <Input
          label="Note (Optional)"
          placeholder="e.g. Monthly allocation, side gig earnings..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Confirm Deposit
          </Button>
        </div>
      </form>
    </Modal>
  );
};
