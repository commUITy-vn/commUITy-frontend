import { api } from '@/lib/api-client';

export interface SupportLocation {
  id: string;
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
}

export const getSupportLocations = (): Promise<SupportLocation[]> => {
  return api.get('/api/v1/support-locations');
};
