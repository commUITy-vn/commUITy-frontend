import { api } from '@/lib/api-client';

export interface CommunityFundSummary {
  id: string;
  name: string;
  description?: string;
  totalBalance: number;
  availableTransferAmount?: number;
  isActive: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export const getMyFunds = (): Promise<CommunityFundSummary[]> => {
  return api.get('/api/v1/community-funds/my-funds');
};
