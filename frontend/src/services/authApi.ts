import { api } from './api';
import {
  ApiResponse,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  User,
} from '../types';

export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', payload);
    return res.data.data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', payload);
    return res.data.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return res.data.data.user;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<User> => {
    const res = await api.put<ApiResponse<{ user: User }>>('/auth/profile', payload);
    return res.data.data.user;
  },

  resetPassword: async (payload: { email: string; new_password: string }): Promise<{ message: string }> => {
    const res = await api.post<ApiResponse<{ message: string }>>('/auth/reset-password', payload);
    return res.data.data;
  },
};

