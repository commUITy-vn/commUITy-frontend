import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useQueries } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { RequestCard } from '@/features/support/components/RequestCard';
import ApplyCollaboratorModal from '@/features/support/components/ApplyCollaboratorModal';
import { SupportCategory, SupportRequest, SupportStatus, UrgencyLevel } from '@/features/support/types/support.types';
import type { VolunteerAssignment } from '@/features/support/api/volunteer-assignments';
import { useVolunteerAssignments } from '@/features/support/hooks/useVolunteerAssignments';
import { ConfirmModal } from '@/components/ui';
import { getSupportRequestById, type SupportRequestDetailResponse } from '@/features/support/api/get-support-request-by-id';

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
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'complete' | 'withdraw';
    supportRequestId: string;
    title: string;
  } | null>(null);

  const handleApplyCollaborator = async (reason: string) => {
    setIsSubmitting(true);
    setApplyModalVisible(false);
    
    setTimeout(async () => {
      setIsSubmitting(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccessModal(true);
    }, 1200);
  };

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

    const canComplete = item.status === 'ACCEPTED';
    const canWithdraw = item.status === 'PENDING' || item.status === 'ACCEPTED';

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
            {item.status === 'ACCEPTED'
              ? 'Accepted volunteers can contribute support needs.'
              : item.status === 'COMPLETED'
                ? 'You marked this assignment complete. SR status is managed separately.'
                : item.status === 'CANCELLED'
                  ? 'You withdrew from this assignment.'
                  : item.status === 'PENDING'
                    ? 'Waiting for requester/admin/collaborator review.'
                    : item.rejectionReason || 'Assignment is no longer active.'}
          </Text>
        </View>
        {(canComplete || canWithdraw) && (
          <View style={[styles.row, { paddingHorizontal: 0, marginTop: -4 }]}>
            {canComplete && (
              <TouchableOpacity
                style={[
                  styles.buttonPrimary,
                  { backgroundColor: theme.primary, marginRight: 8 },
                ]}
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

        {/* Role Banner */}
        <TouchableOpacity
          style={[
            styles.banner,
            { backgroundColor: theme.componentBG, borderColor: theme.border, marginTop: 16 },
          ]}
          onPress={() => setApplyModalVisible(true)}
        >
          <Text style={[styles.bannerText, { color: theme.text }]}>Apply to be a Collaborator</Text>
        </TouchableOpacity>

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

      {/* Apply Collaborator Modal */}
      <ApplyCollaboratorModal
        isOpen={applyModalVisible}
        onClose={() => setApplyModalVisible(false)}
        onSubmit={handleApplyCollaborator}
      />

      {/* Success Confirmation Modal */}
      <ConfirmModal
        visible={showSuccessModal}
        title="Application Submitted!"
        message="Application submitted successfully! Our team will review your application to become a collaborator."
        confirmText="Awesome"
        cancelText="" // Hide cancel button
        onConfirm={() => setShowSuccessModal(false)}
        onCancel={() => setShowSuccessModal(false)}
      />

      <ConfirmModal
        visible={!!pendingAction}
        title={
          pendingAction?.type === 'complete'
            ? 'Mark assignment complete?'
            : 'Withdraw assignment?'
        }
        message={
          pendingAction?.type === 'complete'
            ? `This will set your volunteer assignment for "${pendingAction?.title}" to COMPLETED. The support request status will not change.`
            : `This will cancel your volunteer assignment for "${pendingAction?.title}". If this is the last accepted volunteer, the support request may return to APPROVED.`
        }
        confirmText={pendingAction?.type === 'complete' ? 'Mark Complete' : 'Withdraw'}
        cancelText="Cancel"
        isDestructive={pendingAction?.type === 'withdraw'}
        onConfirm={handleConfirmPendingAction}
        onCancel={() => setPendingAction(null)}
      />

      {isSubmitting && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }]}>
          <View style={{ backgroundColor: theme.componentBG, padding: 24, borderRadius: 16, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: theme.border }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ color: theme.text, fontWeight: '600' }}>Submitting Application...</Text>
          </View>
        </View>
      )}
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
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 16,
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
