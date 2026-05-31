import { api } from '@/lib/api-client';
import { CategoryDetailResponse } from './create-category';

export interface UpdateCategoryRequest {
  name: string;
  code: string;
  description?: string;
  iconUrl?: string;
}

export const updateCategory = (
  id: string,
  data: UpdateCategoryRequest
): Promise<CategoryDetailResponse> => {
  return api.put<CategoryDetailResponse>(`/api/categories/${id}`, data);
};
