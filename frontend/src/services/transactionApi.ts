import { api } from './api';
import {
  ApiResponse,
  CreateTransactionPayload,
  Transaction,
  TransactionFilters,
  TransactionListResponse,
  UpdateTransactionPayload,
} from '../types';

export const transactionApi = {
  getAll: async (filters: TransactionFilters = {}): Promise<TransactionListResponse> => {
    const res = await api.get<ApiResponse<TransactionListResponse>>('/transactions', {
      params: filters,
    });
    return res.data.data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const res = await api.get<ApiResponse<{ transaction: Transaction }>>(`/transactions/${id}`);
    return res.data.data.transaction;
  },

  create: async (payload: CreateTransactionPayload): Promise<Transaction> => {
    const res = await api.post<ApiResponse<{ transaction: Transaction }>>('/transactions', payload);
    return res.data.data.transaction;
  },

  update: async (id: string, payload: UpdateTransactionPayload): Promise<Transaction> => {
    const res = await api.put<ApiResponse<{ transaction: Transaction }>>(`/transactions/${id}`, payload);
    return res.data.data.transaction;
  },

  delete: async (id: string): Promise<string> => {
    const res = await api.delete<ApiResponse<null>>(`/transactions/${id}`);
    return res.data.message || 'Transaction deleted';
  },
};
