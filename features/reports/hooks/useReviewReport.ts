import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewReport } from '../api/review-report';
import { ReviewReportRequest, ReportDetailResponse } from '../types/reports.types';

export const useReviewReport = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<ReportDetailResponse, Error, ReviewReportRequest>({
    mutationFn: (data) => reviewReport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportDetail', id] });
      queryClient.invalidateQueries({ queryKey: ['pendingReports'] });
      queryClient.invalidateQueries({ queryKey: ['allReports'] });
    },
  });
};
