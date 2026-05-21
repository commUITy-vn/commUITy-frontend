import { api } from '@/lib/api-client';

export interface VolunteerAssignment {
  id: string;
  supportRequestId: string;
  supportRequestTitle: string;
  supportRequestDescription: string;
  supportRequestLocation: string;
  supportRequestUrgency: number;
  volunteerId: string;
  volunteerName: string;
  status: string;
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export const getMyAssignments = (): Promise<VolunteerAssignment[]> => {
  return api.get('/api/v1/volunteer-assignments/my-assignments');
};

export const completeAssignment = (supportRequestId: string): Promise<any> => {
  return api.patch(`/api/v1/volunteer-assignments/support-requests/${supportRequestId}/complete`);
};

export const cancelAssignment = (supportRequestId: string): Promise<any> => {
  return api.patch(`/api/v1/volunteer-assignments/support-requests/${supportRequestId}/cancel`);
};
