import { api } from '@/lib/api-client';

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

export const getSupportRequestById = (
  id: string
): Promise<SupportRequestDetailResponse> => {
  return api.get<SupportRequestDetailResponse>(`/api/v1/support-requests/${id}`);
};