import { api } from '@/lib/api-client';
import { CategoryDetailResponse } from './create-category';

export interface UpdateCategoryStatusRequest {
  isActive: boolean;
}

export const updateCategoryStatus = (
  id: string,
  data: UpdateCategoryStatusRequest
): Promise<CategoryDetailResponse> => {
  return api.patch<CategoryDetailResponse>(`/api/categories/${id}/status`, data);
};
