import api from './api';
import type { ApiResponseWrapper } from '../types/api';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export const authService = {
  /**
   * Log in user with credentials
   */
  async login(payload: Record<string, any>): Promise<ApiResponseWrapper<LoginResponse>> {
    const response = await api.post<ApiResponseWrapper<LoginResponse>>('/auth/login', payload);
    return response.data;
  },

  /**
   * Log out user
   */
  async logout(): Promise<ApiResponseWrapper<null>> {
    const response = await api.post<ApiResponseWrapper<null>>('/auth/logout');
    return response.data;
  },

  /**
   * Retrieve active user profile
   */
  async me(): Promise<ApiResponseWrapper<User>> {
    const response = await api.get<ApiResponseWrapper<User>>('/auth/me');
    return response.data;
  }
};

export default authService;
