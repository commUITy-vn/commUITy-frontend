import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { CommunityFundSummary } from '../api/get-my-funds';

export interface CreateCommunityFundData {
  name: string;
  description: string;
}

export interface CommunityFundDetail {
  id: string;
  name: string;
  description: string;
  totalBalance: number;
  isActive: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseResponse {
  id: string;
  fundId: string;
  fundName?: string;
  supportRequestId?: string;
  supportRequestTitle?: string;
  amount: number;
  description: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface DonationResponse {
  id: string;
  fundId: string;
  fundName?: string;
  donorId: string;
  donorName: string;
  createdBy?: string;
  createdByName?: string;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionCode?: string;
  note?: string;
  createdAt: string;
}

export const getCommunityFunds = (activeOnly?: boolean): Promise<CommunityFundSummary[]> => {
  return api.get('/api/v1/community-funds', {
    params: { activeOnly: activeOnly !== undefined ? activeOnly : false },
  });
};

export const useCommunityFunds = (activeOnly?: boolean) => {
  return useQuery<CommunityFundSummary[], Error>({
    queryKey: ['communityFunds', activeOnly],
    queryFn: () => getCommunityFunds(activeOnly),
  });
};

export const createCommunityFund = (data: CreateCommunityFundData): Promise<any> => {
  return api.post('/api/v1/community-funds', data);
};

export const useCreateCommunityFund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommunityFundData) => createCommunityFund(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityFunds'] });
    },
  });
};

export const getCommunityFundById = (id: string): Promise<CommunityFundDetail> => {
  return api.get(`/api/v1/community-funds/${id}`);
};

export const useCommunityFund = (id: string) => {
  return useQuery<CommunityFundDetail, Error>({
    queryKey: ['communityFund', id],
    queryFn: () => getCommunityFundById(id),
    enabled: !!id,
  });
};

export const getExpensesByFund = (fundId: string): Promise<ExpenseResponse[]> => {
  return api.get(`/api/v1/community-funds/${fundId}/expenses`);
};

export const useFundExpenses = (fundId: string) => {
  return useQuery<ExpenseResponse[], Error>({
    queryKey: ['fundExpenses', fundId],
    queryFn: () => getExpensesByFund(fundId),
    enabled: !!fundId,
  });
};

export const getDonationsByFund = (fundId: string): Promise<DonationResponse[]> => {
  return api.get(`/api/v1/community-funds/${fundId}/donations`);
};

export const useFundDonations = (fundId: string) => {
  return useQuery<DonationResponse[], Error>({
    queryKey: ['fundDonations', fundId],
    queryFn: () => getDonationsByFund(fundId),
    enabled: !!fundId,
  });
};

export interface CreateExpensePayload {
  fundId: string;
  supportRequestId?: string;
  amount: number;
  description: string;
}

export const createExpense = (payload: CreateExpensePayload): Promise<ExpenseResponse> => {
  return api.post('/api/v1/expenses', payload);
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => createExpense(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['communityFund', variables.fundId] });
      queryClient.invalidateQueries({ queryKey: ['fundExpenses', variables.fundId] });
      queryClient.invalidateQueries({ queryKey: ['myFunds'] });
      queryClient.invalidateQueries({ queryKey: ['communityFunds'] });
    },
  });
};

export interface CreateDonationPayload {
  fundId: string;
  amount: number;
  paymentMethod: string;
  note?: string;
  transactionCode?: string;
}

export const createDonation = (payload: CreateDonationPayload): Promise<DonationResponse> => {
  return api.post('/api/v1/donations', payload);
};

export const useCreateDonation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDonationPayload) => createDonation(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['communityFund', variables.fundId] });
      queryClient.invalidateQueries({ queryKey: ['fundDonations', variables.fundId] });
      queryClient.invalidateQueries({ queryKey: ['myFunds'] });
      queryClient.invalidateQueries({ queryKey: ['communityFunds'] });
      queryClient.invalidateQueries({ queryKey: ['myDonations'] });
    },
  });
};

export const getMyDonations = (): Promise<DonationResponse[]> => {
  return api.get('/api/v1/donations/my-donations');
};

export const useMyDonations = () => {
  return useQuery<DonationResponse[], Error>({
    queryKey: ['myDonations'],
    queryFn: getMyDonations,
  });
};
