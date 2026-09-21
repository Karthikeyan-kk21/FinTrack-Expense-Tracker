import { api } from './api';
import {
  ApiResponse,
  SavingsListResponse,
  SavingsGoal,
  CreateSavingsGoalPayload,
  UpdateSavingsGoalPayload,
  RecordDepositPayload,
  SavingsDeposit,
} from '../types';

export const savingsApi = {
  getGoals: async (): Promise<SavingsListResponse> => {
    const res = await api.get<ApiResponse<SavingsListResponse>>('/savings/goals');
    return res.data.data;
  },

  createGoal: async (payload: CreateSavingsGoalPayload): Promise<SavingsGoal> => {
    const res = await api.post<ApiResponse<{ goal: SavingsGoal }>>('/savings/goals', payload);
    return res.data.data.goal;
  },

  updateGoal: async (id: string, payload: UpdateSavingsGoalPayload): Promise<SavingsGoal> => {
    const res = await api.put<ApiResponse<{ goal: SavingsGoal }>>(`/savings/goals/${id}`, payload);
    return res.data.data.goal;
  },

  deleteGoal: async (id: string): Promise<string> => {
    const res = await api.delete<ApiResponse<null>>(`/savings/goals/${id}`);
    return res.data.message || 'Savings goal deleted';
  },

  recordDeposit: async (
    goalId: string,
    payload: RecordDepositPayload
  ): Promise<{ deposit: SavingsDeposit; goal: SavingsGoal }> => {
    const res = await api.post<ApiResponse<{ deposit: SavingsDeposit; goal: SavingsGoal }>>(
      `/savings/goals/${goalId}/deposit`,
      payload
    );
    return res.data.data;
  },

  getDeposits: async (goalId: string): Promise<SavingsDeposit[]> => {
    const res = await api.get<ApiResponse<{ deposits: SavingsDeposit[] }>>(
      `/savings/goals/${goalId}/deposits`
    );
    return res.data.data.deposits;
  },
};
