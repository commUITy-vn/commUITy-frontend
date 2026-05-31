import { api } from '@/lib/api-client';

export const deleteMedia = (id: string): Promise<any> => {
  return api.delete(`/api/v1/media/${id}`);
};
