export interface SavingsGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  remaining_amount: number;
  percentage_completed: number;
  is_completed: boolean;
  target_date?: string | null;
  color: string;
  icon: string;
  created_at: string;
  updated_at?: string;
}

export interface SavingsDeposit {
  id: string;
  user_id: string;
  goal_id: string;
  amount: number;
  note?: string | null;
  deposit_date: string;
  created_at: string;
}

export interface SavingsSummary {
  total_goals: number;
  total_target: number;
  total_saved: number;
  total_remaining: number;
  overall_percentage: number;
  completed_goals: number;
}

export interface SavingsListResponse {
  summary: SavingsSummary;
  goals: SavingsGoal[];
}

export interface CreateSavingsGoalPayload {
  title: string;
  target_amount: number;
  initial_amount?: number;
  target_date?: string;
  color?: string;
  icon?: string;
}

export interface UpdateSavingsGoalPayload {
  title?: string;
  target_amount?: number;
  target_date?: string;
  color?: string;
  icon?: string;
}

export interface RecordDepositPayload {
  amount: number;
  note?: string;
  deposit_date?: string;
}
