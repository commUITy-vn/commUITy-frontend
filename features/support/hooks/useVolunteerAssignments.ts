import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyAssignments, completeAssignment, cancelAssignment, VolunteerAssignment } from '../api/volunteer-assignments';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { UserRole } from '@/features/auth/types';

export const useVolunteerAssignments = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const assignmentsQuery = useQuery<VolunteerAssignment[], Error>({
    queryKey: ['volunteerAssignments'],
    queryFn: () => {
      if (user?.role !== UserRole.VOLUNTEER) {
        return Promise.resolve([]);
      }
      return getMyAssignments();
    },
    enabled: user?.role === UserRole.VOLUNTEER,
  });

  const completeMutation = useMutation<any, Error, string>({
    mutationFn: (supportRequestId) => completeAssignment(supportRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteerAssignments'] });
    },
  });

  const cancelMutation = useMutation<any, Error, string>({
    mutationFn: (supportRequestId) => cancelAssignment(supportRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteerAssignments'] });
    },
  });

  return {
    assignments: assignmentsQuery.data || [],
    isLoading: assignmentsQuery.isLoading,
    isError: assignmentsQuery.isError,
    error: assignmentsQuery.error,
    complete: completeMutation.mutateAsync,
    isCompleting: completeMutation.isPending,
    cancel: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
  };
};
