import React, { useState, useEffect, useCallback } from 'react';
import { Tags, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { categoryApi } from '../services/categoryApi';
import { Category, CategoryType } from '../types';
import { getCategoryIcon } from '../utils';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/SkeletonLoader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { CategoryModal } from '../components/categories/CategoryModal';

export const Categories: React.FC = () => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<CategoryType>('expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteCategoryItem, setDeleteCategoryItem] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await categoryApi.getAll(activeTab);
      setCategories(data);
    } catch (err) {
      error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenAdd = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setSelectedCategory(c);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCategoryItem) return;
    setIsDeleting(true);
    try {
      const msg = await categoryApi.delete(deleteCategoryItem.id);
      success(msg);
      setDeleteCategoryItem(null);
      fetchCategories();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 tracking-tight">Categories</h2>
          <p className="text-xs sm:text-sm text-surface-500 mt-0.5">
            Organize and classify your income and expense transactions.
          </p>
        </div>

        <Button onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
          New Category
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-200 pb-2">
        <button
          onClick={() => setActiveTab('expense')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'expense'
              ? 'bg-rose-50 text-rose-700 border border-rose-200/80 shadow-subtle'
              : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
          }`}
        >
          Expense Categories
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'income'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-subtle'
              : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
          }`}
        >
          Income Categories
        </button>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<Tags className="w-8 h-8 text-brand-500" />}
          title={`No ${activeTab} categories`}
          description="Create your first custom category to start organizing your transactions."
          actionLabel="Add Category"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((c) => {
            const IconComp = getCategoryIcon(c.icon);
            return (
              <Card
                key={c.id}
                hoverEffect
                className="p-4 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                    style={{ backgroundColor: c.color }}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-surface-900 text-sm truncate">{c.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] uppercase font-semibold text-surface-400">
                        {c.type}
                      </span>
                      {c.is_default && (
                        <span className="text-[10px] font-semibold bg-surface-100 text-surface-500 px-1.5 py-0.2 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    title="Edit category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteCategoryItem(c)}
                    className="p-1.5 text-surface-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCategories}
        initialType={activeTab}
        initialCategory={selectedCategory}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteCategoryItem}
        onClose={() => setDeleteCategoryItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete category "${deleteCategoryItem?.name}"? You can only delete categories that are not currently linked to any transactions.`}
        confirmLabel="Delete Category"
        isLoading={isDeleting}
      />
    </div>
  );
};
