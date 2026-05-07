import { api } from '@/lib/api-client';
import type { RefreshTokenRequest, AuthResponse } from '../types';

export const refreshToken = async (
  data: RefreshTokenRequest,
): Promise<AuthResponse> => {
  return api.post<AuthResponse>('/api/v1/auth/refresh', data);
};
