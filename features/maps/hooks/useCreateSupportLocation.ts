import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSupportLocation } from '../api/create-support-location';

export interface CreateSupportLocationData {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  contactPhone?: string;
  bankName?: string;
  bankAccountNumber?: string;
}

export const useCreateSupportLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupportLocationData) => createSupportLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportLocations'] });
    },
  });
};
