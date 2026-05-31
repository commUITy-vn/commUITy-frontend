import { useQuery } from '@tanstack/react-query';
import { getReportById } from '../api/get-report-by-id';
import { ReportDetailResponse } from '../types/reports.types';

export const useReportDetail = (id: string) => {
  return useQuery<ReportDetailResponse, Error>({
    queryKey: ['reportDetail', id],
    queryFn: () => getReportById(id),
    enabled: !!id,
  });
};
