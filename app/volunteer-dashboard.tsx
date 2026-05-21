import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { RequestCard } from '@/features/support/components/RequestCard';
import ApplyCollaboratorModal from '@/features/support/components/ApplyCollaboratorModal';
import { SupportRequest, SupportStatus, UrgencyLevel } from '@/features/support/types/support.types';
import { useVolunteerAssignments } from '@/features/support/hooks/useVolunteerAssignments';
import { ConfirmModal } from '@/components/ui';

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
    'COMPLETED': SupportStatus.FULFILLED,
    'REJECTED': SupportStatus.REJECTED,
    'CANCELLED': SupportStatus.CANCELLED,
  };

  const renderVolunteerItem = ({ item }: { item: any }) => {
    // Map VolunteerAssignment to SupportRequest type
    const mappedRequest: SupportRequest = {
      id: item.supportRequestId,
      title: item.supportRequestTitle,
      description: item.supportRequestDescription,
      location: item.supportRequestLocation,
      urgency: urgencyMap[item.supportRequestUrgency] || UrgencyLevel.MEDIUM,
      status: statusMap[item.status] || SupportStatus.IN_PROGRESS,
      category: item.category || 'OTHER',
      createdAt: item.createdAt,
      updatedAt: item.createdAt,
    };

    const isFinished = item.status === 'COMPLETED' || item.status === 'CANCELLED' || item.status === 'REJECTED';

    return (
      <View style={{ marginBottom: 16 }}>
        <RequestCard request={mappedRequest} />
        {!isFinished && (
          <View style={[styles.row, { paddingHorizontal: 16, marginTop: -4 }]}>
            <TouchableOpacity
              style={[
                styles.buttonPrimary,
                { backgroundColor: theme.primary, marginRight: 8 },
              ]}
              onPress={() => handleMarkComplete(item.supportRequestId)}
            >
              <Text style={[styles.buttonText, { color: theme.textLight }]}>Mark Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttonSecondary, { backgroundColor: theme.danger }]}
              onPress={() => handleWithdraw(item.supportRequestId)}
            >
              <Text style={[styles.buttonText, { color: theme.textLight }]}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Compute live stats based on real assignments
  const completedCount = assignments.filter((a) => a.status === 'COMPLETED').length;
  const inProgressCount = assignments.filter((a) => a.status === 'APPROVED' || a.status === 'IN_PROGRESS').length;
  const completionRate = assignments.length > 0 
    ? Math.round((completedCount / assignments.length) * 100) 
    : 100;

  return (
    <View style={[
      stylesGlobal.container,
      { backgroundColor: theme.appBG },
    ]}>
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
            keyExtractor={(item) => item.id}
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