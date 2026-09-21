import { api } from './api';
import {
  ApiResponse,
  Category,
  CategoryType,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../types';

export const categoryApi = {
  getAll: async (type?: CategoryType): Promise<Category[]> => {
    const params = type ? { type } : {};
    const res = await api.get<ApiResponse<Category[]>>('/categories', { params });
    return res.data.data;
  },

  create: async (payload: CreateCategoryPayload): Promise<Category> => {
    const res = await api.post<ApiResponse<{ category: Category }>>('/categories', payload);
    return res.data.data.category;
  },

  update: async (id: string, payload: UpdateCategoryPayload): Promise<Category> => {
    const res = await api.put<ApiResponse<{ category: Category }>>(`/categories/${id}`, payload);
    return res.data.data.category;
  },

  delete: async (id: string): Promise<string> => {
    const res = await api.delete<ApiResponse<null>>(`/categories/${id}`);
    return res.data.message || 'Category deleted';
  },
};
