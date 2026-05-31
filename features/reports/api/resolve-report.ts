import { api } from '@/lib/api-client';
import { ResolveReportRequest, ReportDetailResponse } from '../types/reports.types';

export const resolveReport = (id: string, data: ResolveReportRequest): Promise<ReportDetailResponse> => {
  return api.patch<ReportDetailResponse>(`/api/reports/${id}/resolve`, data);
};
