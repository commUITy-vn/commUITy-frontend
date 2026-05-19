import { useQuery } from '@tanstack/react-query';
import { getSupportLocations } from '@/features/maps/api/get-support-locations';

export const useSupportLocations = () => {
  return useQuery({
    queryKey: ['supportLocations'],
    queryFn: () => getSupportLocations(),
  });
};
