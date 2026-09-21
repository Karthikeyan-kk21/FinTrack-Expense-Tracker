export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  currency?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  currency?: string;
  new_password?: string;
  current_password?: string;
}
