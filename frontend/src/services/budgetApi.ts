import { api } from './api';
import { ApiResponse, BudgetListResponse, SaveBudgetPayload, Budget } from '../types';

export const budgetApi = {
  getBudgets: async (month?: number, year?: number): Promise<BudgetListResponse> => {
    const params: Record<string, number> = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const res = await api.get<ApiResponse<BudgetListResponse>>('/budgets', { params });
    return res.data.data;
  },

  saveBudget: async (payload: SaveBudgetPayload): Promise<Budget> => {
    const res = await api.post<ApiResponse<{ budget: Budget }>>('/budgets', payload);
    return res.data.data.budget;
  },

  deleteBudget: async (id: string): Promise<string> => {
    const res = await api.delete<ApiResponse<null>>(`/budgets/${id}`);
    return res.data.message || 'Budget deleted';
  },
};
