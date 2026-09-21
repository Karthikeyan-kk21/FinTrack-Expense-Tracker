import { CategoryType } from './category';

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  type: CategoryType;
  amount: number;
  title: string;
  description?: string | null;
  transaction_date: string;
  created_at: string;
  updated_at?: string;
}

export interface TransactionPagination {
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  pagination: TransactionPagination;
}

export interface TransactionFilters {
  type?: CategoryType | '';
  category_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  sort_by?: 'transaction_date' | 'amount' | 'title' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateTransactionPayload {
  category_id: string;
  type: CategoryType;
  amount: number;
  title: string;
  description?: string;
  transaction_date: string;
}

export interface UpdateTransactionPayload {
  category_id?: string;
  type?: CategoryType;
  amount?: number;
  title?: string;
  description?: string;
  transaction_date?: string;
}
