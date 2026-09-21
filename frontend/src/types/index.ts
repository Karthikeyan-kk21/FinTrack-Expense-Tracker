export * from './auth';
export * from './category';
export * from './transaction';
export * from './budget';
export * from './savings';
export * from './analytics';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
