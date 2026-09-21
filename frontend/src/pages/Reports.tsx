import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Calculator,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { reportApi } from '../services/reportApi';
import { ReportsAnalytics } from '../types';
import { formatCurrency, getCategoryIcon } from '../utils';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/SkeletonLoader';
import { ProgressBar } from '../components/common/ProgressBar';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const { error } = useToast();
  const currency = user?.currency || 'INR';

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [data, setData] = useState<ReportsAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await reportApi.getAnalytics(year);
      setData(res);
    } catch (err) {
      error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const summary = data?.summary;
  const cashflow = data?.monthly_cashflow || [];
  const categoryDist = data?.category_distribution || [];

  return (
    <div className="space-y-6">
      {/* Header with Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 tracking-tight">Financial Reports</h2>
          <p className="text-xs sm:text-sm text-surface-500 mt-0.5">
            Annual cash flow analysis, expense breakdowns, and savings ratios.
          </p>
        </div>

        {/* Year Navigator */}
        <div className="flex items-center bg-white border border-surface-200 rounded-2xl shadow-subtle p-1">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="p-1.5 rounded-xl text-surface-500 hover:bg-surface-100 hover:text-surface-900 transition-colors"
            title="Previous Year"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-4 text-sm font-bold text-surface-800 flex items-center gap-1.5 min-w-[100px] justify-center">
            <Calendar className="w-3.5 h-3.5 text-brand-600" />
            {year}
          </span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="p-1.5 rounded-xl text-surface-500 hover:bg-surface-100 hover:text-surface-900 transition-colors"
            title="Next Year"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Annual KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title={`Annual Income (${year})`}
            value={formatCurrency(summary?.total_income, currency)}
            subtitle={`Avg ${formatCurrency(summary?.average_monthly_income, currency)} / month`}
            icon={<TrendingUp className="w-6 h-6" />}
            iconBgColor="bg-emerald-50"
            iconTextColor="text-emerald-600"
          />

          <StatCard
            title={`Annual Expenses (${year})`}
            value={formatCurrency(summary?.total_expense, currency)}
            subtitle={`Avg ${formatCurrency(summary?.average_monthly_expense, currency)} / month`}
            icon={<TrendingDown className="w-6 h-6" />}
            iconBgColor="bg-rose-50"
            iconTextColor="text-rose-600"
          />

          <StatCard
            title="Net Annual Savings"
            value={formatCurrency(summary?.net_savings, currency)}
            subtitle={`${summary?.savings_rate || 0}% overall savings rate`}
            icon={<PiggyBank className="w-6 h-6" />}
            iconBgColor="bg-purple-50"
            iconTextColor="text-purple-600"
          />

          <StatCard
            title="Average Monthly Burn"
            value={formatCurrency(summary?.average_monthly_expense, currency)}
            subtitle="Estimated monthly operating cost"
            icon={<Calculator className="w-6 h-6" />}
            iconBgColor="bg-amber-50"
            iconTextColor="text-amber-600"
          />
        </div>
      )}

      {/* Monthly Cashflow Bar Chart */}
      <Card
        header={
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-surface-900">
                Monthly Cash Flow Comparison ({year})
              </h3>
              <p className="text-xs text-surface-500">Income vs Expenses across all 12 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-md bg-emerald-500" />
                <span className="text-surface-600">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-md bg-rose-500" />
                <span className="text-surface-600">Expense</span>
              </div>
            </div>
          </div>
        }
      >
        {cashflow.every((m) => m.income === 0 && m.expense === 0) ? (
          <EmptyState
            icon={<BarChart3 className="w-8 h-8 text-brand-500" />}
            title={`No cashflow records for ${year}`}
            description="Add income and expense transactions in this calendar year to generate reporting data."
          />
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflow} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="month_name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  }}
                  formatter={(val: any) => [
                    formatCurrency(val, currency),
                    '',
                  ]}
                />
                <Bar dataKey="income" name="Income" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#F43F5E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Category Expense Distribution Table */}
      <Card
        header={
          <div>
            <h3 className="text-base font-bold text-surface-900">
              Annual Expense Breakdown by Category
            </h3>
            <p className="text-xs text-surface-500">Distribution of total yearly expenditures</p>
          </div>
        }
      >
        {categoryDist.length === 0 ? (
          <EmptyState
            title="No expense data"
            description="Record your expenses to see annual spending distribution across categories."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-100 text-[11px] font-bold uppercase tracking-wider text-surface-400">
                  <th className="pb-3 pl-2">Category</th>
                  <th className="pb-3 w-1/3">Share of Spending</th>
                  <th className="pb-3 text-right pr-2">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-sm">
                {categoryDist.map((item) => {
                  const IconComp = getCategoryIcon(item.icon);
                  return (
                    <tr key={item.category_id} className="hover:bg-surface-50/80 transition-colors">
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: item.color }}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-surface-900">{item.category_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <ProgressBar
                            value={item.percentage}
                            color={item.color}
                            autoColor={false}
                            height="sm"
                          />
                          <span className="text-xs font-bold text-surface-600 min-w-[40px]">
                            {item.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-right pr-2 font-bold text-surface-900">
                        {formatCurrency(item.amount, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
