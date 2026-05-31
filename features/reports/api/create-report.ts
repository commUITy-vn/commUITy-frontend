import { api } from '@/lib/api-client';
import { CreateReportRequest, ReportDetailResponse } from '../types/reports.types';

export const createReport = (data: CreateReportRequest): Promise<ReportDetailResponse> => {
  return api.post<ReportDetailResponse>('/api/reports', data);
};
