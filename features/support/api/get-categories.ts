import { api } from '@/lib/api-client';

export interface CategorySummaryResponse {
  id: string;
  name: string;
  code: string;
  description?: string;
  iconUrl?: string;
}

export const getCategories = (): Promise<CategorySummaryResponse[]> => {
  // The backend controller is mapped to /api/categories
  // Note: the backend api-client has a baseUrl. Let's make sure it hits the right path.
  // api-client prepends the baseUrl. Let's verify if api.get receives the full path.
  return api.get<CategorySummaryResponse[]>('/api/categories');
};
