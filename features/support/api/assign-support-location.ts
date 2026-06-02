import { api } from "@/lib/api-client";
import type { SupportRequestDetailResponse } from "./get-support-request-by-id";

export interface AssignSupportLocationRequest {
  supportLocationId: string;
}

export const assignSupportLocation = (
  supportRequestId: string,
  data: AssignSupportLocationRequest,
): Promise<SupportRequestDetailResponse> => {
  return api.patch<SupportRequestDetailResponse>(
    `/api/v1/support-requests/${supportRequestId}/assign-support-location`,
    data,
  );
};
