import { api } from './axios';
import { AuthResponse } from '../types/auth';

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', {
      username,
      password,
    });
    return response.data;
  },
};