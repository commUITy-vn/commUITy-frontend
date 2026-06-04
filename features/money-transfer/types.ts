export type MoneyTransferTicketStatus = 'PENDING' | 'REJECTED' | 'RESOLVED';
export type MoneyTransferTicketSourceType = 'COMMUNITY_FUND' | 'SUPPORT_NEED';

export interface MoneyTransferTicketResponse {
  id: string;
  requesterId: string;
  requesterName: string;
  sourceType: MoneyTransferTicketSourceType;
  sourceId: string;
  sourceName: string;
  amount: number;
  reason: string;
  status: MoneyTransferTicketStatus;
  adminNote?: string;
  proofImageUrl?: string;
  resolvedBy?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMoneyTransferTicketRequest {
  amount: number;
  reason: string;
}
