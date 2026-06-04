import { api } from '@/lib/api-client';
import {
  CreateMoneyTransferTicketRequest,
  MoneyTransferTicketResponse,
  MoneyTransferTicketStatus,
} from './types';

export const createCommunityFundTransferTicket = (
  fundId: string,
  data: CreateMoneyTransferTicketRequest,
): Promise<MoneyTransferTicketResponse> =>
  api.post(`/api/v1/money-transfer-tickets/community-funds/${fundId}`, data);

export const createSupportNeedTransferTicket = (
  supportNeedId: string,
  data: CreateMoneyTransferTicketRequest,
): Promise<MoneyTransferTicketResponse> =>
  api.post(`/api/v1/money-transfer-tickets/support-needs/${supportNeedId}`, data);

export const getMyMoneyTransferTickets = (): Promise<MoneyTransferTicketResponse[]> =>
  api.get('/api/v1/money-transfer-tickets/my');

export const getAdminMoneyTransferTickets = (
  status?: MoneyTransferTicketStatus,
): Promise<MoneyTransferTicketResponse[]> =>
  api.get('/api/v1/money-transfer-tickets/admin', {
    params: status ? { status } : undefined,
  });

export const rejectMoneyTransferTicket = (
  ticketId: string,
  rejectionReason: string,
): Promise<MoneyTransferTicketResponse> =>
  api.patch(`/api/v1/money-transfer-tickets/admin/${ticketId}/reject`, {
    rejectionReason,
  });

export const resolveMoneyTransferTicket = (
  ticketId: string,
  proofFile: { uri: string; name: string; type: string } | File,
  adminNote?: string,
): Promise<MoneyTransferTicketResponse> => {
  const formData = new FormData();
  formData.append('proofFile', proofFile as any);
  if (adminNote?.trim()) {
    formData.append('adminNote', adminNote.trim());
  }

  return api.patchForm(`/api/v1/money-transfer-tickets/admin/${ticketId}/resolve`, formData);
};
