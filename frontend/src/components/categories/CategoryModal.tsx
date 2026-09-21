import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Category, CategoryType } from '../../types';
import { categoryApi } from '../../services/categoryApi';
import { AVAILABLE_ICONS, CATEGORY_COLORS, getCategoryIcon } from '../../utils/constants';
import { useToast } from '../../context/ToastContext';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: CategoryType;
  initialCategory?: Category | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'expense',
  initialCategory,
}) => {
  const isEditing = !!initialCategory;
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>(initialType);
  const [icon, setIcon] = useState<string>('Tag');
  const [color, setColor] = useState<string>('#6366F1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        setName(initialCategory.name);
        setType(initialCategory.type);
        setIcon(initialCategory.icon);
        setColor(initialCategory.color);
      } else {
        setName('');
        setType(initialType);
        setIcon('Tag');
        setColor('#6366F1');
      }
      setErrors({});
    }
  }, [isOpen, initialCategory, initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: 'Category name is required' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && initialCategory) {
        await categoryApi.update(initialCategory.id, {
          name: name.trim(),
          icon,
          color,
        });
        success('Category updated successfully');
      } else {
        await categoryApi.create({
          name: name.trim(),
          type,
          icon,
          color,
        });
        success('Custom category created successfully');
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
      title={isEditing ? 'Edit Category' : 'Create Category'}
      subtitle={isEditing ? 'Modify category properties' : 'Add a custom category with personalized icon and color'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEditing && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 mb-1.5">
              Category Type
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
                Expense Category
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
                Income Category
              </button>
            </div>
          </div>
        )}

        <Input
          label="Category Name"
          placeholder="e.g. Subscriptions, Side Hustle..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />

        {/* Color Palette Swatches */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 mb-1.5">
            Category Color
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

        {/* Icon Grid Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 mb-1.5">
            Choose Icon
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 max-h-36 overflow-y-auto p-2 bg-surface-50 border border-surface-200 rounded-xl">
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
            {isEditing ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
