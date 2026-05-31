import { api } from '@/lib/api-client';
import { ReviewReportRequest, ReportDetailResponse } from '../types/reports.types';

export const reviewReport = (id: string, data: ReviewReportRequest): Promise<ReportDetailResponse> => {
  return api.patch<ReportDetailResponse>(`/api/reports/${id}/review`, data);
};
