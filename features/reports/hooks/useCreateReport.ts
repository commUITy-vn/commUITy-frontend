import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReport } from '../api/create-report';
import { CreateReportRequest, ReportDetailResponse } from '../types/reports.types';

export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation<ReportDetailResponse, Error, CreateReportRequest>({
    mutationFn: createReport,
    onSuccess: () => {
      // Invalidate related report queries
      queryClient.invalidateQueries({ queryKey: ['myReports'] });
      queryClient.invalidateQueries({ queryKey: ['allReports'] });
      queryClient.invalidateQueries({ queryKey: ['pendingReports'] });
    },
  });
};
