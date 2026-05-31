import { api } from "@/lib/api-client";

export const deleteSupportRequest = (id: string): Promise<void> => {
  return api.delete(`/api/v1/support-requests/${id}`);
};
