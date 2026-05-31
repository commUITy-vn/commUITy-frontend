import { api } from '@/lib/api-client';

export interface CategorySummaryResponse {
  id: string;
  name: string;
  code: string;
  description?: string;
  iconUrl?: string;
}

export const getCategories = (activeOnly?: boolean): Promise<CategorySummaryResponse[]> => {
  // The backend controller is mapped to /api/categories
  return api.get<CategorySummaryResponse[]>('/api/categories', {
    params: activeOnly !== undefined ? { activeOnly } : undefined,
  });
};

