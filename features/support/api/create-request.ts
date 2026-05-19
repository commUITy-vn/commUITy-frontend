import { api } from '@/lib/api-client';

export interface CreateSupportRequestRequest {
  title: string;
  description: string;
  categoryId: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface SupportRequestDetailResponse {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  requesterId: string;
  requesterName: string;
  assignedSupportLocationId?: string;
  assignedSupportLocationName?: string;
  status: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export const createSupportRequest = (
  data: CreateSupportRequestRequest
): Promise<SupportRequestDetailResponse> => {
  return api.post<SupportRequestDetailResponse>('/api/v1/support-requests', data);
};