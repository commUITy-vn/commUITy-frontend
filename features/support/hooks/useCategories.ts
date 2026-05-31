import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, CategorySummaryResponse } from '../api/get-categories';
import { createCategory, CreateCategoryRequest } from '../api/create-category';
import { updateCategory, UpdateCategoryRequest } from '../api/update-category';
import { updateCategoryStatus, UpdateCategoryStatusRequest } from '../api/update-category-status';

export const useCategories = (activeOnly?: boolean) => {
  return useQuery<CategorySummaryResponse[], Error>({
    queryKey: ['categories', activeOnly],
    queryFn: () => getCategories(activeOnly),
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateCategoryStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryStatusRequest }) =>
      updateCategoryStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
