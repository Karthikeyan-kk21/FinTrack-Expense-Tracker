import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  Plus,
  Target,
  Sparkles,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/dashboardApi';
import { budgetApi } from '../services/budgetApi';
import { savingsApi } from '../services/savingsApi';
import { DashboardSummary, MonthlyTrend, CategoryBreakdownItem, Budget, SavingsGoal } from '../types';
import { formatCurrency, formatDate, getCategoryIcon } from '../utils';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton, TableSkeleton } from '../components/common/SkeletonLoader';
import { TransactionModal } from '../components/transactions/TransactionModal';

// Custom Callout Label for Classic Solid Pie Chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.06) return null; // Avoid overlapping labels for small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[11px] font-extrabold select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [activeBudgets, setActiveBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sumData, trendData, breakdownData, budgetData, savingsData] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getMonthlyTrends(6),
        dashboardApi.getCategoryBreakdown(),
        budgetApi.getBudgets(),
        savingsApi.getGoals(),
      ]);

      setSummary(sumData);
      setTrends(trendData);
      setCategoryBreakdown(breakdownData.categories);
      setActiveBudgets(budgetData.budgets);
      setSavingsGoals(savingsData.goals);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Listen to global transaction events
    const handleRefresh = () => fetchDashboardData();
    window.addEventListener('transaction-updated', handleRefresh);
    return () => window.removeEventListener('transaction-updated', handleRefresh);
  }, [fetchDashboardData]);

  if (isLoading && !summary) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  const lifetime = summary?.lifetime;
  const currentMonth = summary?.current_month;
  const recentTx = summary?.recent_transactions || [];
  const savingsSummary = summary?.savings_summary;

  return (
    <div className="space-y-6">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-surface-900 to-surface-800 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-emerald-300 border border-white/10 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Financial Health Overview
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hi {user?.name?.split(' ')[0] || 'there'}, here's your financial status
          </h2>
          <p className="text-surface-300 text-sm mt-1 max-w-xl">
            Monthly cash flow surplus:{' '}
            <span className="font-semibold text-emerald-400">
              {formatCurrency(currentMonth?.net_cashflow, currency)}
            </span>{' '}
            with {formatCurrency(savingsSummary?.total_saved, currency)} total saved in dedicated goals.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Record Transaction
          </Button>
        </div>

        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Net Balance"
          value={formatCurrency(lifetime?.total_balance, currency)}
          subtitle="All-time cumulative cash balance"
          icon={<Wallet className="w-6 h-6" />}
          iconBgColor="bg-emerald-50"
          iconTextColor="text-emerald-600"
        />

        <StatCard
          title="This Month Income"
          value={formatCurrency(currentMonth?.income, currency)}
          icon={<TrendingUp className="w-6 h-6" />}
          iconBgColor="bg-blue-50"
          iconTextColor="text-blue-600"
          trend={{
            value: currentMonth?.income_change_pct || 0,
            isGood: true,
          }}
        />

        <StatCard
          title="This Month Expense"
          value={formatCurrency(currentMonth?.expense, currency)}
          icon={<TrendingDown className="w-6 h-6" />}
          iconBgColor="bg-rose-50"
          iconTextColor="text-rose-600"
          trend={{
            value: currentMonth?.expense_change_pct || 0,
            isGood: false,
          }}
        />

        <StatCard
          title="Savings in Goals"
          value={formatCurrency(savingsSummary?.total_saved, currency)}
          subtitle={`Across ${savingsSummary?.active_goals_count || 0} active savings goals`}
          icon={<PiggyBank className="w-6 h-6" />}
          iconBgColor="bg-purple-50"
          iconTextColor="text-purple-600"
          badge={
            <Link to="/savings">
              <Badge variant="info">
                View Goals →
              </Badge>
            </Link>
          }
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Income vs Expense Area Chart */}
        <Card
          className="lg:col-span-2"
          header={
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-surface-900">Cash Flow Trends</h3>
                <p className="text-xs text-surface-500">Last 6 months income vs expenses</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-surface-600">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-surface-600">Expenses</span>
                </div>
              </div>
            </div>
          }
        >
          {trends.length === 0 ? (
            <EmptyState
              title="No trend data available"
              description="Add income and expense transactions to see your 6-month visual cash flow."
            />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="label"
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
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#incomeGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Expense"
                    stroke="#F43F5E"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#expenseGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Expense Category Breakdown — Classic Solid Pie Chart */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-surface-900">Expense Breakdown</h3>
                <p className="text-xs text-surface-500">By category this month</p>
              </div>
              <PieIcon className="w-4 h-4 text-surface-400" />
            </div>
          }
        >
          {categoryBreakdown.length === 0 ? (
            <EmptyState
              title="No expenses this month"
              description="Record your everyday expenses to see category distribution."
            />
          ) : (
            <div className="space-y-4">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      labelLine={false}
                      label={renderCustomizedLabel}
                      dataKey="amount"
                      nameKey="category_name"
                    >
                      {categoryBreakdown.map((item) => (
                        <Cell key={item.category_id} fill={item.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [
                        formatCurrency(val, currency),
                        '',
                      ]}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Legend List */}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {categoryBreakdown.slice(0, 5).map((cat) => (
                  <div key={cat.category_id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium text-surface-700 truncate max-w-[120px]">
                        {cat.category_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-surface-900">
                        {formatCurrency(cat.amount, currency)}
                      </span>
                      <span className="text-surface-400 text-[11px]">({cat.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Budgets & Savings Goals Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Budgets Widget */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-surface-900">Budget Limits</h3>
                <p className="text-xs text-surface-500">Monthly category spending</p>
              </div>
              <Link
                to="/budgets"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Manage <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          }
        >
          {activeBudgets.length === 0 ? (
            <EmptyState
              icon={<Target className="w-8 h-8 text-brand-500" />}
              title="No active budgets"
              description="Set monthly spending limits for Food, Shopping, etc., to control expenses."
              actionLabel="Set a Budget"
              onAction={() => (window.location.href = '/budgets')}
            />
          ) : (
            <div className="space-y-3">
              {activeBudgets.slice(0, 3).map((b) => {
                const IconComp = getCategoryIcon(b.category_icon);
                return (
                  <div key={b.id} className="space-y-1.5 p-3 rounded-xl bg-surface-50 border border-surface-100">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-1.5 rounded-lg text-white shrink-0"
                          style={{ backgroundColor: b.category_color }}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-surface-800">{b.category_name}</span>
                      </div>
                      <span className="font-bold text-surface-900">
                        {formatCurrency(b.spent_amount, currency)}{' '}
                        <span className="font-normal text-surface-500">
                          / {formatCurrency(b.amount, currency)}
                        </span>
                      </span>
                    </div>

                    <ProgressBar value={b.percentage_used} height="sm" />

                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={`font-semibold ${
                          b.is_exceeded ? 'text-rose-600' : 'text-surface-500'
                        }`}
                      >
                        {b.is_exceeded
                          ? `Exceeded by ${formatCurrency(b.over_amount, currency)}`
                          : `${formatCurrency(b.remaining_amount, currency)} remaining`}
                      </span>
                      <span className="font-bold text-surface-600">{b.percentage_used}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Savings Goals Widget */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-surface-900">Savings & Wealth Goals</h3>
                <p className="text-xs text-surface-500">Target funds & deposited wealth</p>
              </div>
              <Link
                to="/savings"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                View All Goals <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          }
        >
          {savingsGoals.length === 0 ? (
            <EmptyState
              icon={<PiggyBank className="w-8 h-8 text-brand-500" />}
              title="No active savings goals"
              description="Create separate savings goals like Emergency Fund or Vacation to track saved wealth."
              actionLabel="Create Savings Goal"
              onAction={() => (window.location.href = '/savings')}
            />
          ) : (
            <div className="space-y-3">
              {savingsGoals.slice(0, 3).map((g) => {
                const IconComp = getCategoryIcon(g.icon);
                return (
                  <div key={g.id} className="space-y-1.5 p-3 rounded-xl bg-surface-50 border border-surface-100">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-1.5 rounded-lg text-white shrink-0"
                          style={{ backgroundColor: g.color }}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-surface-800">{g.title}</span>
                      </div>
                      <span className="font-bold text-surface-900">
                        {formatCurrency(g.current_amount, currency)}{' '}
                        <span className="font-normal text-surface-500">
                          / {formatCurrency(g.target_amount, currency)}
                        </span>
                      </span>
                    </div>

                    <ProgressBar value={g.percentage_completed} height="sm" color={g.color} autoColor={false} />

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-surface-500">
                        {g.is_completed ? '🎉 Goal Achieved!' : `${formatCurrency(g.remaining_amount, currency)} to go`}
                      </span>
                      <span className="font-bold text-emerald-600">{g.percentage_completed}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Transactions Widget */}
      <Card
        header={
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-surface-900">Recent Transactions</h3>
              <p className="text-xs text-surface-500">Latest financial activities</p>
            </div>
            <Link
              to="/transactions"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        }
      >
        {recentTx.length === 0 ? (
          <EmptyState
            title="No recent transactions"
            description="Start recording your daily income and expenses to keep your finances organized."
            actionLabel="Add First Transaction"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-100 text-[11px] font-bold uppercase tracking-wider text-surface-400">
                  <th className="pb-3 pl-2">Transaction</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right pr-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-sm">
                {recentTx.map((tx) => {
                  const IconComp = getCategoryIcon(tx.category_icon);
                  return (
                    <tr key={tx.id} className="hover:bg-surface-50/80 transition-colors">
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: tx.category_color }}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-surface-900 line-clamp-1">{tx.title}</p>
                            {tx.description && (
                              <p className="text-xs text-surface-400 line-clamp-1">
                                {tx.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-xs font-medium text-surface-600 bg-surface-100 px-2 py-1 rounded-lg">
                          {tx.category_name}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-surface-500 whitespace-nowrap">
                        {formatDate(tx.transaction_date)}
                      </td>
                      <td className="py-3 text-right pr-2 whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount, currency)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Transaction Modal */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};
