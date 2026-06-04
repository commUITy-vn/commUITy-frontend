import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useQueries } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { RequestCard } from '@/features/support/components/RequestCard';
import { SupportCategory, SupportRequest, SupportStatus, UrgencyLevel } from '@/features/support/types/support.types';
import type { VolunteerAssignment } from '@/features/support/api/volunteer-assignments';
import { useVolunteerAssignments } from '@/features/support/hooks/useVolunteerAssignments';
import { ConfirmModal } from '@/components/ui';
import { getSupportRequestById, type SupportRequestDetailResponse } from '@/features/support/api/get-support-request-by-id';
import { getSupportNeeds } from '@/features/support/api/get-support-needs';
import { getSupportNeedContributions } from '@/features/support/api/get-support-need-contributions';

const StatCard = ({ label, value }: { label: string; value: string }) => {
  const theme = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: theme.highlightBG }]}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSupporting }]}>{label}</Text>
    </View>
  );
};

export default function VolunteerDashboardScreen() {
  const theme = useTheme();
  const stylesGlobal = useThemeStyles();
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<{
    type: 'complete' | 'withdraw';
    supportRequestId: string;
    title: string;
  } | null>(null);

  const {
    assignments,
    isLoading,
    isError,
    complete,
    cancel,
  } = useVolunteerAssignments();

  const requestDetailQueries = useQueries({
    queries: assignments.map((assignment) => ({
      queryKey: ['supportRequest', assignment.supportRequestId],
      queryFn: () => getSupportRequestById(assignment.supportRequestId),
      enabled: !!assignment.supportRequestId,
    })),
  });

  const requestDetailById = new Map<string, SupportRequestDetailResponse>();
  assignments.forEach((assignment, index) => {
    const detail = requestDetailQueries[index]?.data;
    if (detail) {
      requestDetailById.set(assignment.supportRequestId, detail);
    }
  });

  const supportNeedQueries = useQueries({
    queries: assignments.map((assignment) => ({
      queryKey: ['supportNeeds', assignment.supportRequestId],
      queryFn: () => getSupportNeeds(assignment.supportRequestId),
      enabled: !!assignment.supportRequestId,
    })),
  });

  const needRefs = useMemo(() => {
    const refs: { supportRequestId: string; needId: string }[] = [];
    assignments.forEach((assignment, assignmentIndex) => {
      const needs = supportNeedQueries[assignmentIndex]?.data || [];
      needs.forEach((need) => {
        refs.push({
          supportRequestId: assignment.supportRequestId,
          needId: need.id,
        });
      });
    });
    return refs;
  }, [assignments, supportNeedQueries]);

  const contributionQueries = useQueries({
    queries: needRefs.map((ref) => ({
      queryKey: ['supportNeedContributions', ref.needId],
      queryFn: () => getSupportNeedContributions(ref.needId),
      enabled: !!ref.needId,
    })),
  });

  const volunteerContributionByRequest = useMemo(() => {
    const result = new Map<string, number>();
    needRefs.forEach((ref, index) => {
      const contributions = contributionQueries[index]?.data || [];
      const quantity = contributions.reduce((sum, contribution) => {
        const assignment = assignments.find(
          (item) =>
            item.supportRequestId === ref.supportRequestId &&
            item.volunteerId === contribution.contributorId,
        );
        if (!assignment) return sum;
        return sum + Number(contribution.quantity || 0);
      }, 0);
      result.set(ref.supportRequestId, (result.get(ref.supportRequestId) || 0) + quantity);
    });
    return result;
  }, [assignments, contributionQueries, needRefs]);

  const handleMarkComplete = async (supportRequestId: string) => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await complete(supportRequestId);
    } catch (err) {
      console.error('Failed to complete assignment:', err);
    }
  };

  const handleWithdraw = async (supportRequestId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await cancel(supportRequestId);
    } catch (err) {
      console.error('Failed to cancel assignment:', err);
    }
  };

  const handleConfirmPendingAction = async () => {
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    if (action.type === 'complete') {
      await handleMarkComplete(action.supportRequestId);
      return;
    }
    await handleWithdraw(action.supportRequestId);
  };

  const urgencyMap: Record<number | string, UrgencyLevel> = {
    0: UrgencyLevel.LOW,
    1: UrgencyLevel.MEDIUM,
    2: UrgencyLevel.HIGH,
    'LOW': UrgencyLevel.LOW,
    'MEDIUM': UrgencyLevel.MEDIUM,
    'HIGH': UrgencyLevel.HIGH,
  };

  const statusMap: Record<string, SupportStatus> = {
    'PENDING': SupportStatus.PENDING,
    'APPROVED': SupportStatus.APPROVED,
    'IN_PROGRESS': SupportStatus.IN_PROGRESS,
    'COMPLETED': SupportStatus.COMPLETED,
    'REJECTED': SupportStatus.REJECTED,
    'CANCELLED': SupportStatus.CANCELLED,
  };

  const assignmentStatusColors: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: '#E2E8F0', text: '#475569' },
    ACCEPTED: { bg: '#E0F2FE', text: '#0369A1' },
    COMPLETED: { bg: '#DCFCE7', text: '#166534' },
    CANCELLED: { bg: '#F0F0F0', text: '#666666' },
    REJECTED: { bg: '#FFE5E5', text: '#CC0000' },
  };

  const getAssignmentKey = (item: VolunteerAssignment, index: number) =>
    item.id ||
    `${item.supportRequestId}-${item.volunteerId}-${item.assignedAt || item.updatedAt || index}`;

  const renderVolunteerItem = ({ item }: { item: VolunteerAssignment }) => {
    const detail = requestDetailById.get(item.supportRequestId);
    const requestTimestamp = item.assignedAt || item.updatedAt || new Date().toISOString();
    const requestUrgency = detail?.urgency ?? item.supportRequestUrgency ?? 'MEDIUM';
    const requestStatus =
      statusMap[detail?.status || item.supportRequestStatus || ''] ||
      (item.status === 'ACCEPTED'
        ? SupportStatus.IN_PROGRESS
        : item.status === 'COMPLETED'
          ? SupportStatus.COMPLETED
          : SupportStatus.APPROVED);
    const assignmentColors =
      assignmentStatusColors[item.status] || assignmentStatusColors.PENDING;

    // Map VolunteerAssignment to SupportRequest type
    const mappedRequest: SupportRequest = {
      id: item.supportRequestId,
      title: detail?.title || item.supportRequestTitle || 'Support request',
      description: detail?.description || item.supportRequestDescription || 'No description supplied.',
      location: detail?.address || item.supportRequestLocation || 'No location supplied',
      urgency: urgencyMap[requestUrgency] || UrgencyLevel.MEDIUM,
      status: requestStatus,
      category: SupportCategory.EMERGENCY,
      createdAt: detail?.createdAt || requestTimestamp,
      updatedAt: detail?.updatedAt || item.updatedAt || requestTimestamp,
    };

    const requestIsCompleted = requestStatus === SupportStatus.COMPLETED;
    const volunteerContributionQuantity =
      volunteerContributionByRequest.get(item.supportRequestId) || 0;
    const hasRecordedContribution = volunteerContributionQuantity > 0;
    const canComplete = item.status === 'ACCEPTED' && !requestIsCompleted;
    const canWithdraw =
      (item.status === 'PENDING' || item.status === 'ACCEPTED') &&
      !requestIsCompleted;

    return (
      <View style={{ marginBottom: 16 }}>
        <RequestCard
          request={mappedRequest}
          onPress={() => router.push(`/request/${mappedRequest.id}`)}
          containerStyle={{ marginHorizontal: 0 }}
        />
        <View style={[styles.assignmentMeta, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
          <View style={[styles.assignmentBadge, { backgroundColor: assignmentColors.bg }]}>
            <Text style={[styles.assignmentBadgeText, { color: assignmentColors.text }]}>
              VA {item.status}
            </Text>
          </View>
          <Text style={[styles.assignmentHint, { color: theme.textSupporting }]} numberOfLines={1}>
            {requestIsCompleted && item.status === 'ACCEPTED'
              ? 'This support request is already completed. No further VA action is needed.'
              : item.status === 'ACCEPTED'
              ? hasRecordedContribution
                ? `Recorded contribution: ${volunteerContributionQuantity}. Progress is counted once your assignment is accepted.`
                : 'You can contribute support needs while this assignment is accepted.'
              : item.status === 'COMPLETED'
                ? 'Assignment marked complete. Recorded accepted contributions remain counted.'
                : item.status === 'CANCELLED'
                  ? 'You withdrew from this assignment. Recorded accepted contributions remain counted.'
                  : item.status === 'PENDING'
                    ? 'Waiting for requester/admin/collaborator review.'
                    : item.rejectionReason || 'Assignment is no longer active.'}
          </Text>
        </View>
        {(item.status === 'ACCEPTED' || canWithdraw) && !requestIsCompleted && (
          <View style={[styles.row, { paddingHorizontal: 0, marginTop: -4 }]}>
            {item.status === 'ACCEPTED' && (
              <TouchableOpacity
                style={[
                  styles.buttonPrimary,
                  {
                    backgroundColor: canComplete
                      ? theme.primary
                      : theme.textSupporting,
                    marginRight: 8,
                    opacity: canComplete ? 1 : 0.65,
                  },
                ]}
                disabled={!canComplete}
                onPress={() =>
                  setPendingAction({
                    type: 'complete',
                    supportRequestId: item.supportRequestId,
                    title: mappedRequest.title,
                  })
                }
              >
                <Text style={[styles.buttonText, { color: theme.textLight }]}>Mark Complete</Text>
              </TouchableOpacity>
            )}
            {canWithdraw && (
              <TouchableOpacity
                style={[styles.buttonSecondary, { backgroundColor: theme.danger }]}
                onPress={() =>
                  setPendingAction({
                    type: 'withdraw',
                    supportRequestId: item.supportRequestId,
                    title: mappedRequest.title,
                  })
                }
              >
                <Text style={[styles.buttonText, { color: theme.textLight }]}>Withdraw</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // Compute live stats based on real assignments
  const completedCount = assignments.filter((a) => a.status === 'COMPLETED').length;
  const inProgressCount = assignments.filter((a) => a.status === 'PENDING' || a.status === 'ACCEPTED').length;
  const completionRate = assignments.length > 0 
    ? Math.round((completedCount / assignments.length) * 100) 
    : 100;

  return (
    <View
      style={[
        stylesGlobal.container,
        {
          backgroundColor: theme.appBG,
          height: (Platform.OS === 'web' ? '100vh' : '100%') as any,
          maxHeight: (Platform.OS === 'web' ? '100vh' : undefined) as any,
        },
      ]}
    >
      {/* Header (Back chevron + title) */}
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.border },
        ]}
      >
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Assignments</Text>
        <View style={{ width: 52 }} />
      </View>

      <View style={{ padding: 16, flex: 1 }}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard label="Completed" value={String(completedCount)} />
          <StatCard label="In Progress" value={String(inProgressCount)} />
          <StatCard label="Completion Rate" value={`${completionRate}%`} />
        </View>

        {/* Role upgrade note */}
        <View
          style={[
            styles.banner,
            { backgroundColor: theme.componentBG, borderColor: theme.border, marginTop: 16 },
          ]}
        >
          <MaterialIcons name="admin-panel-settings" size={20} color={theme.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerText, { color: theme.text }]}>Collaborator upgrade</Text>
            <Text style={[styles.bannerSubtext, { color: theme.textSupporting }]}>
              Backend currently supports role promotion from Admin User Management.
            </Text>
          </View>
        </View>

        {/* Volunteer Feed */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : isError ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: theme.textSupporting }}>Failed to load assignments.</Text>
          </View>
        ) : (
          <FlatList
            data={assignments}
            renderItem={renderVolunteerItem}
            keyExtractor={getAssignmentKey}
            contentContainerStyle={{ paddingTop: 24, paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Text style={{ color: theme.textSupporting, fontSize: 16 }}>No assignments yet.</Text>
              </View>
            }
          />
        )}
      </View>

      <ConfirmModal
        visible={!!pendingAction}
        title={
          pendingAction?.type === 'complete'
            ? 'Mark assignment complete?'
            : 'Withdraw assignment?'
        }
        message={
          pendingAction?.type === 'complete'
            ? `Mark this assignment complete for "${pendingAction?.title}". Contributions recorded while accepted already count toward request progress.`
            : `Withdraw from "${pendingAction?.title}". Contributions recorded while accepted already count toward request progress.`
        }
        confirmText={pendingAction?.type === 'complete' ? 'Mark Complete' : 'Withdraw'}
        cancelText="Cancel"
        isDestructive={pendingAction?.type === 'withdraw'}
        onConfirm={handleConfirmPendingAction}
        onCancel={() => setPendingAction(null)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  banner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerText: {
    fontSize: 15,
    fontWeight: '700',
  },
  bannerSubtext: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  assignmentMeta: {
    marginTop: -6,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assignmentBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  assignmentBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  assignmentHint: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  buttonPrimary: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
