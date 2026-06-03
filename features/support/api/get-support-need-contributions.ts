import { api } from "@/lib/api-client";

export interface SupportNeedContributionResponse {
  id: string;
  supportNeedId: string;
  needName: string;
  contributorId: string;
  contributorName: string;
  quantity: number;
  note?: string;
  createdAt: string;
}

export const getSupportNeedContributions = (
  needId: string,
): Promise<SupportNeedContributionResponse[]> => {
  return api.get<SupportNeedContributionResponse[]>(
    `/api/v1/support-needs/${needId}/contributions`,
  );
};
