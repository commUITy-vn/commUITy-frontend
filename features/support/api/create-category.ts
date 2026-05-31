import { api } from '@/lib/api-client';

export interface CreateCategoryRequest {
  name: string;
  code: string;
  description?: string;
  iconUrl?: string;
}

export interface CategoryDetailResponse {
  id: string;
  name: string;
  code: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const createCategory = (
  data: CreateCategoryRequest
): Promise<CategoryDetailResponse> => {
  return api.post<CategoryDetailResponse>('/api/categories', data);
};
