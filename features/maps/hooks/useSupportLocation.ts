import { useQuery } from '@tanstack/react-query';
import { getSupportLocation } from '../api/get-support-location';
import { SupportLocation } from '../api/get-support-locations';

export const useSupportLocation = (id: string) => {
  return useQuery({
    queryKey: ['supportLocation', id],
    queryFn: () => getSupportLocation(id),
    enabled: !!id,
  });
};
