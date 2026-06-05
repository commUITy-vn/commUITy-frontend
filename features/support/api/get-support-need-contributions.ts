import { api } from "@/lib/api-client";

export interface SupportNeedContributionResponse {
  id: string;
  supportNeedId: string;
  needName: string;
  contributorId: string;
  contributorName: string;
  quantity: number;
  paymentMethod?: string;
  status?: 'PENDING' | 'SUCCESS' | 'CANCELLED' | 'FAILED';
  transactionCode?: string;
  payosOrderCode?: number;
  payosPaymentLinkId?: string;
  checkoutUrl?: string;
  note?: string;
  paidAt?: string;
  createdAt: string;
}

export const getSupportNeedContributions = (
  needId: string,
): Promise<SupportNeedContributionResponse[]> => {
  return api.get<SupportNeedContributionResponse[]>(
    `/api/v1/support-needs/${needId}/contributions`,
  );
};

export const getMySupportNeedContributions = (): Promise<SupportNeedContributionResponse[]> => {
  return api.get<SupportNeedContributionResponse[]>(
    "/api/v1/support-need-contributions/my-contributions",
  );
};
