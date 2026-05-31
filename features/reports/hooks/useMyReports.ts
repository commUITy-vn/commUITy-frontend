import { useQuery } from '@tanstack/react-query';
import { getMyReports } from '../api/get-my-reports';
import { ReportSummaryResponse } from '../types/reports.types';

export const useMyReports = () => {
  return useQuery<ReportSummaryResponse[], Error>({
    queryKey: ['myReports'],
    queryFn: getMyReports,
  });
};
