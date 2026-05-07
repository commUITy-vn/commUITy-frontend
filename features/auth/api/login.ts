import { api } from '@/lib/api-client';
import type { LoginRequest, AuthResponse } from '../types';

export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  return api.post<AuthResponse>('/api/v1/auth/login', credentials);
};