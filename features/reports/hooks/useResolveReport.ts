import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resolveReport } from '../api/resolve-report';
import { ResolveReportRequest, ReportDetailResponse } from '../types/reports.types';

export const useResolveReport = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<ReportDetailResponse, Error, ResolveReportRequest>({
    mutationFn: (data) => resolveReport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportDetail', id] });
      queryClient.invalidateQueries({ queryKey: ['pendingReports'] });
      queryClient.invalidateQueries({ queryKey: ['allReports'] });
    },
  });
};
