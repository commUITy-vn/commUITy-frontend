import { api } from '@/lib/api-client';
import type { RegisterRequest, AuthResponse } from '../types';

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  return api.post<AuthResponse>('/api/v1/auth/register', data);
};
