import { useQuery } from '@tanstack/react-query';
import { getPendingReports } from '../api/get-pending-reports';
import { ReportSummaryResponse } from '../types/reports.types';

export const usePendingReports = () => {
  return useQuery<ReportSummaryResponse[], Error>({
    queryKey: ['pendingReports'],
    queryFn: getPendingReports,
  });
};
