import { api } from '@/lib/api-client';
import { ReportSummaryResponse } from '../types/reports.types';

export const getMyReports = (): Promise<ReportSummaryResponse[]> => {
  return api.get<ReportSummaryResponse[]>('/api/reports/my-reports');
};
