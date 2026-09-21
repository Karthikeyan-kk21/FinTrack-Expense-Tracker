import { api } from './api';
import {
  ApiResponse,
  CategoryBreakdownResponse,
  DashboardSummary,
  MonthlyTrend,
} from '../types';

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return res.data.data;
  },

  getMonthlyTrends: async (months: number = 6): Promise<MonthlyTrend[]> => {
    const res = await api.get<ApiResponse<{ trends: MonthlyTrend[] }>>('/dashboard/monthly-trends', {
      params: { months },
    });
    return res.data.data.trends;
  },

  getCategoryBreakdown: async (
    month?: number,
    year?: number,
    type: 'income' | 'expense' = 'expense'
  ): Promise<CategoryBreakdownResponse> => {
    const params: Record<string, string | number> = { type };
    if (month) params.month = month;
    if (year) params.year = year;
    const res = await api.get<ApiResponse<CategoryBreakdownResponse>>(
      '/dashboard/category-breakdown',
      { params }
    );
    return res.data.data;
  },
};
