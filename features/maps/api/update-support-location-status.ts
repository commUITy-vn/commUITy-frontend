import { api } from "@/lib/api-client";
import type { SupportLocation } from "./get-support-locations";

export const updateSupportLocationStatus = (
  id: string,
  isActive: boolean,
): Promise<SupportLocation> => {
  return api.patch<SupportLocation>(`/api/v1/support-locations/${id}/status`, {
    isActive,
  });
};
