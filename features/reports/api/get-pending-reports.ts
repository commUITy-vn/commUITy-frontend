import { api } from '@/lib/api-client';
import { ReportSummaryResponse } from '../types/reports.types';

export const getPendingReports = (): Promise<ReportSummaryResponse[]> => {
  return api.get<ReportSummaryResponse[]>('/api/reports/pending');
};
