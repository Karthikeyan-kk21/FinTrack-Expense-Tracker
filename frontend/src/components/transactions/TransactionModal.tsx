import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Transaction, Category, CategoryType } from '../../types';
import { categoryApi } from '../../services/categoryApi';
import { transactionApi } from '../../services/transactionApi';
import { useToast } from '../../context/ToastContext';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const isEditing = !!initialData;
  const { success, error } = useToast();

  const [type, setType] = useState<CategoryType>('expense');
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or load initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type);
        setCategoryId(initialData.category_id);
        setAmount(String(initialData.amount));
        setTitle(initialData.title);
        setDescription(initialData.description || '');
        setTransactionDate(initialData.transaction_date);
      } else {
        setType('expense');
        setCategoryId('');
        setAmount('');
        setTitle('');
        setDescription('');
        setTransactionDate(new Date().toISOString().split('T')[0]);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Load categories matching current type
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoadingCategories(true);

    categoryApi
      .getAll(type)
      .then((cats) => {
        if (!isMounted) return;
        setCategories(cats);
        // If current categoryId is not in the list, set to first one
        if (cats.length > 0 && (!categoryId || !cats.some((c) => c.id === categoryId))) {
          if (!initialData || initialData.type !== type) {
            setCategoryId(cats[0].id);
          }
        }
      })
      .catch((err) => {
        if (isMounted) error(err.message || 'Failed to load categories');
      })
      .finally(() => {
        if (isMounted) setIsLoadingCategories(false);
      });

    return () => {
      isMounted = false;
    };
  }, [type, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (!amount || Number(amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!categoryId) newErrors.categoryId = 'Please select a category';
    if (!transactionDate) newErrors.transactionDate = 'Date is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        await transactionApi.update(initialData.id, {
          title: title.trim(),
          amount: Number(amount),
          type,
          category_id: categoryId,
          description: description.trim() || undefined,
          transaction_date: transactionDate,
        });
        success('Transaction updated successfully');
      } else {
        await transactionApi.create({
          title: title.trim(),
          amount: Number(amount),
          type,
          category_id: categoryId,
          description: description.trim() || undefined,
          transaction_date: transactionDate,
        });
        success('Transaction added successfully');
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
      title={isEditing ? 'Edit Transaction' : 'New Transaction'}
      subtitle={isEditing ? 'Update transaction details' : 'Record a new income or expense'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle Buttons */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 mb-1.5">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-2 bg-surface-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {/* Title */}
        <Input
          label="Title"
          placeholder="e.g. Grocery store, Freelance payment..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          required
        />

        {/* Amount & Date in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
            required
          />

          <Input
            label="Date"
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            error={errors.transactionDate}
            required
          />
        </div>

        {/* Category Selector */}
        <Select
          label="Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          error={errors.categoryId}
          disabled={isLoadingCategories}
          placeholder={isLoadingCategories ? 'Loading categories...' : 'Select Category'}
          required
        />

        {/* Description (Optional) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 mb-1.5">
            Description (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Add extra notes or details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full rounded-xl text-sm transition-all duration-200 bg-white border border-surface-200 text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 hover:border-surface-300 p-3"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
