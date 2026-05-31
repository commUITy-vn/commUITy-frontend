import { useQuery } from '@tanstack/react-query';
import { getAllReports } from '../api/get-all-reports';
import { ReportSummaryResponse } from '../types/reports.types';

export const useAllReports = () => {
  return useQuery<ReportSummaryResponse[], Error>({
    queryKey: ['allReports'],
    queryFn: getAllReports,
  });
};
