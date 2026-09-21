import { Transaction } from './transaction';
import { SavingsGoal } from './savings';

export interface LifetimeSummary {
  total_balance: number;
  total_income: number;
  total_expense: number;
}

export interface CurrentMonthSummary {
  month: number;
  year: number;
  income: number;
  expense: number;
  net_cashflow: number;
  savings_rate: number;
  income_change_pct: number;
  expense_change_pct: number;
}

export interface DashboardSummary {
  lifetime: LifetimeSummary;
  current_month: CurrentMonthSummary;
  budget_summary: {
    total_budgeted: number;
    total_spent: number;
  };
  savings_summary?: {
    total_saved: number;
    total_target: number;
    active_goals_count: number;
    goals: SavingsGoal[];
  };
  recent_transactions: Transaction[];
}

export interface MonthlyTrend {
  label: string;
  month: number;
  year: number;
  income: number;
  expense: number;
  savings: number;
  savings_rate: number;
}

export interface CategoryBreakdownItem {
  category_id: string;
  category_name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface CategoryBreakdownResponse {
  month: number;
  year: number;
  type: string;
  total_amount: number;
  categories: CategoryBreakdownItem[];
}

export interface MonthlyCashflowItem {
  month_num: number;
  month_name: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryDistributionItem {
  category_id: string;
  category_name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

export interface ReportsAnalytics {
  year: number;
  summary: {
    total_income: number;
    total_expense: number;
    net_savings: number;
    savings_rate: number;
    average_monthly_expense: number;
    average_monthly_income: number;
  };
  monthly_cashflow: MonthlyCashflowItem[];
  category_distribution: CategoryDistributionItem[];
}
