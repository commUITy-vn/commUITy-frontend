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
  payosOrderCode?: number;
  payosPaymentLinkId?: string;
  checkoutUrl?: string;
  note?: string;
  paidAt?: string;
  createdAt: string;
}

export interface PayOsCheckoutResponse {
  id: string;
  paymentType: 'COMMUNITY_FUND_DONATION' | 'SUPPORT_NEED_CONTRIBUTION';
  amount: number;
  orderCode: number;
  paymentLinkId?: string;
  checkoutUrl: string;
  qrCode?: string;
}

export type CommunityFundMemberRole = 'MEMBER' | 'MANAGER';

export interface CommunityFundMemberResponse {
  fundId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: CommunityFundMemberRole;
  isActive: boolean;
  joinedAt: string;
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

export const getCommunityFundMembers = (fundId: string): Promise<CommunityFundMemberResponse[]> => {
  return api
    .get<CommunityFundMemberResponse[]>(`/api/v1/community-funds/${fundId}/members`)
    .then((members) => members.filter((member) => member.isActive !== false));
};

export const useCommunityFundMembers = (fundId: string) => {
  return useQuery<CommunityFundMemberResponse[], Error>({
    queryKey: ['communityFundMembers', fundId],
    queryFn: () => getCommunityFundMembers(fundId),
    enabled: !!fundId,
  });
};

export const addCommunityFundMember = (
  fundId: string,
  data: { userId: string; role: CommunityFundMemberRole },
): Promise<CommunityFundMemberResponse> => {
  return api.post(`/api/v1/community-funds/${fundId}/members`, data);
};

export const updateCommunityFundMemberRole = (
  fundId: string,
  userId: string,
  role: CommunityFundMemberRole,
): Promise<CommunityFundMemberResponse> => {
  return api.patch(`/api/v1/community-funds/${fundId}/members/${userId}/role`, { role });
};

export const removeCommunityFundMember = (fundId: string, userId: string): Promise<void> => {
  return api.delete(`/api/v1/community-funds/${fundId}/members/${userId}`);
};

export const useAddCommunityFundMember = (fundId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; role: CommunityFundMemberRole }) =>
      addCommunityFundMember(fundId, data),
    onSuccess: (createdMember) => {
      queryClient.setQueryData<CommunityFundMemberResponse[]>(['communityFundMembers', fundId], (old = []) => {
        const withoutDuplicate = old.filter((member) => member.userId !== createdMember.userId);
        return [...withoutDuplicate, createdMember];
      });
      queryClient.invalidateQueries({ queryKey: ['communityFundMembers', fundId] });
    },
  });
};

export const useUpdateCommunityFundMemberRole = (fundId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: CommunityFundMemberRole }) =>
      updateCommunityFundMemberRole(fundId, userId, role),
    onSuccess: (updatedMember, variables) => {
      queryClient.setQueryData<CommunityFundMemberResponse[]>(['communityFundMembers', fundId], (old = []) =>
        old.map((member) =>
          member.userId === variables.userId
            ? { ...member, ...updatedMember, role: variables.role }
            : member,
        ),
      );
      queryClient.invalidateQueries({ queryKey: ['communityFundMembers', fundId] });
    },
  });
};

export const useRemoveCommunityFundMember = (fundId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeCommunityFundMember(fundId, userId),
    onMutate: async (removedUserId) => {
      await queryClient.cancelQueries({ queryKey: ['communityFundMembers', fundId] });
      const previousMembers = queryClient.getQueryData<CommunityFundMemberResponse[]>(['communityFundMembers', fundId]);
      queryClient.setQueryData<CommunityFundMemberResponse[]>(['communityFundMembers', fundId], (old = []) =>
        old.filter((member) => member.userId !== removedUserId),
      );
      return { previousMembers };
    },
    onError: (_error, _removedUserId, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(['communityFundMembers', fundId], context.previousMembers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['communityFundMembers', fundId] });
    },
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

export const createPayOsDonation = (
  payload: Pick<CreateDonationPayload, 'fundId' | 'amount' | 'note'>,
): Promise<PayOsCheckoutResponse> => {
  return api.post('/api/v1/donations/payos', payload);
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

export const useCreatePayOsDonation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Pick<CreateDonationPayload, 'fundId' | 'amount' | 'note'>) =>
      createPayOsDonation(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fundDonations', variables.fundId] });
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
