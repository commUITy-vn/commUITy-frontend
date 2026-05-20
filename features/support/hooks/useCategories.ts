import { useQuery } from '@tanstack/react-query';
import { getCategories, CategorySummaryResponse } from '../api/get-categories';

export const useCategories = () => {
  return useQuery<CategorySummaryResponse[], Error>({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });
};
