import { api } from './api';
import { ApiResponse, ReportsAnalytics } from '../types';

export const reportApi = {
  getAnalytics: async (year?: number): Promise<ReportsAnalytics> => {
    const params: Record<string, number> = {};
    if (year) params.year = year;
    const res = await api.get<ApiResponse<ReportsAnalytics>>('/reports/analytics', { params });
    return res.data.data;
  },
};
