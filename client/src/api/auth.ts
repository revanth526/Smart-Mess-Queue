import api from './axios';
import type { UserPublic, AuthResponse, ApiResponse } from '@shared/types';

export interface RegisterPayload {
  name: string;
  studentId?: string;
  email?: string;
  password: string;
  confirmPassword?: string;
  rollNo?: string;
}

export type LoginPayload =
  | { studentId: string; password: string; email?: never }
  | { email: string; password: string; studentId?: never }
  | { studentId?: string; email?: string; password: string };

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', payload);
    const { accessToken } = res.data.data!;
    localStorage.setItem('accessToken', accessToken);
    return res.data.data!;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', payload);
    const { accessToken } = res.data.data!;
    localStorage.setItem('accessToken', accessToken);
    return res.data.data!;
  },

  async refresh(): Promise<AuthResponse> {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/refresh');
    const { accessToken } = res.data.data!;
    localStorage.setItem('accessToken', accessToken);
    return res.data.data!;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
    }
  },

  async getMe(): Promise<{ user: UserPublic }> {
    const res = await api.get<ApiResponse<{ user: UserPublic }>>('/auth/me');
    return res.data.data!;
  },
};
