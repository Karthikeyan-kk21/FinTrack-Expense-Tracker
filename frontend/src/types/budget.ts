export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  amount: number;
  month: number;
  year: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  is_exceeded: boolean;
  over_amount: number;
  created_at: string;
  updated_at?: string;
}

export interface BudgetSummary {
  total_budgeted: number;
  total_spent: number;
  total_remaining: number;
  overall_percentage_used: number;
  is_overall_exceeded: boolean;
}

export interface BudgetListResponse {
  month: number;
  year: number;
  summary: BudgetSummary;
  budgets: Budget[];
}

export interface SaveBudgetPayload {
  category_id: string;
  amount: number;
  month: number;
  year: number;
}
