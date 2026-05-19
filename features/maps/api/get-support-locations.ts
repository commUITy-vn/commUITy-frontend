import { api } from '@/lib/api-client';

export const getSupportLocations = () => {
  return api.get('/api/v1/support-locations');
};
