import { api } from '@/lib/api-client';
import { ReportDetailResponse } from '../types/reports.types';

export const getReportById = (id: string): Promise<ReportDetailResponse> => {
  return api.get<ReportDetailResponse>(`/api/reports/${id}`);
};
