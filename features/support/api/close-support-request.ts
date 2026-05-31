import { api } from "@/lib/api-client";

export const closeSupportRequest = (id: string): Promise<void> => {
  return api.patch(`/api/v1/support-requests/${id}/close`);
};
