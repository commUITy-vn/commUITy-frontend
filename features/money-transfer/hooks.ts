import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCommunityFundTransferTicket,
  createSupportNeedTransferTicket,
  getAdminMoneyTransferTickets,
  getMyMoneyTransferTickets,
  rejectMoneyTransferTicket,
  resolveMoneyTransferTicket,
} from './api';
import {
  CreateMoneyTransferTicketRequest,
  MoneyTransferTicketResponse,
  MoneyTransferTicketStatus,
} from './types';

export const useMyMoneyTransferTickets = () =>
  useQuery<MoneyTransferTicketResponse[], Error>({
    queryKey: ['moneyTransferTickets', 'my'],
    queryFn: getMyMoneyTransferTickets,
  });

export const useAdminMoneyTransferTickets = (status?: MoneyTransferTicketStatus) =>
  useQuery<MoneyTransferTicketResponse[], Error>({
    queryKey: ['moneyTransferTickets', 'admin', status || 'all'],
    queryFn: () => getAdminMoneyTransferTickets(status),
  });

export const useCreateCommunityFundTransferTicket = (fundId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMoneyTransferTicketRequest) =>
      createCommunityFundTransferTicket(fundId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moneyTransferTickets'] });
      queryClient.invalidateQueries({ queryKey: ['communityFund', fundId] });
    },
  });
};

export const useCreateSupportNeedTransferTicket = (supportNeedId?: string, requestId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMoneyTransferTicketRequest) =>
      createSupportNeedTransferTicket(supportNeedId || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moneyTransferTickets'] });
      if (requestId) {
        queryClient.invalidateQueries({ queryKey: ['supportNeeds', requestId] });
        queryClient.invalidateQueries({ queryKey: ['supportRequest', requestId] });
      }
    },
  });
};

export const useRejectMoneyTransferTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, rejectionReason }: { ticketId: string; rejectionReason: string }) =>
      rejectMoneyTransferTicket(ticketId, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moneyTransferTickets'] });
    },
  });
};

export const useResolveMoneyTransferTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      proofFile,
      adminNote,
    }: {
      ticketId: string;
      proofFile: { uri: string; name: string; type: string } | File;
      adminNote?: string;
    }) => resolveMoneyTransferTicket(ticketId, proofFile, adminNote),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['moneyTransferTickets'] });
      if (ticket.sourceType === 'COMMUNITY_FUND') {
        queryClient.invalidateQueries({ queryKey: ['communityFund', ticket.sourceId] });
        queryClient.invalidateQueries({ queryKey: ['fundExpenses', ticket.sourceId] });
        queryClient.invalidateQueries({ queryKey: ['communityFunds'] });
        queryClient.invalidateQueries({ queryKey: ['myFunds'] });
      }
    },
  });
};
