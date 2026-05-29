import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Modal, TextInput as RNTextInput, Image, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { ConfirmModal } from '@/components/ui';
import TextInput from '@/components/ui/TextInput';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';
import { SupportItemProgress } from '@/features/support/components/SupportItemProgress';
import { ContributeItemModal } from '@/features/support/components/ContributeItemModal';
import { useSupportRequestById } from '@/features/support/hooks/useSupportRequestById';
import { useSupportNeeds } from '@/features/support/hooks/useSupportNeeds';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api-client';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { UserRole } from '@/features/auth/types';
import {
  VolunteerAssignment,
  applyToSupportRequest,
  approveVolunteer,
  cancelAssignment,
  completeAssignment,
  getAssignmentsBySupportRequest,
  rejectVolunteer,
} from "@/features/support/api/volunteer-assignments";
import { ContributeItemModal } from "@/features/support/components/ContributeItemModal";
import { SupportItemProgress } from "@/features/support/components/SupportItemProgress";
import { useSupportNeeds } from "@/features/support/hooks/useSupportNeeds";
import { useSupportRequestById } from "@/features/support/hooks/useSupportRequestById";
import { useTheme } from "@/hooks/useTheme";
import { api } from "@/lib/api-client";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  SupportStatus,
  UrgencyLevel,
  SupportCategory,
  STATUS_LABELS,
  URGENCY_LABELS,
  CATEGORY_LABELS,
  SupportItem,
  ItemCategory,
} from '@/features/support/types/support.types';

export default function SupportRequestDetailScreen() {
  // Fix lỗi TypeScript cho Params bằng cách định nghĩa type rõ ràng
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = id || ""; // Đảm bảo luôn là string

  const router = useRouter();

  const getUrgencyBg = (urgency: UrgencyLevel): string => {
    switch (urgency) {
      case UrgencyLevel.HIGH:
        return '#FFE5E5';
      case UrgencyLevel.MEDIUM:
        return '#FFF4E5';
      case UrgencyLevel.LOW:
        return '#E5F6EE';
      default:
        return theme.border;
    }
  };

  const getUrgencyText = (urgency: UrgencyLevel): string => {
    switch (urgency) {
      case UrgencyLevel.HIGH:
        return '#CC0000';
      case UrgencyLevel.MEDIUM:
        return '#B35900';
      case UrgencyLevel.LOW:
        return '#008040';
      default:
        return theme.text;
    }
  };

  const getStatusBg = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return '#E2E8F0';
      case 'APPROVED':
        return '#E5F6EE';
      case 'IN_PROGRESS':
        return '#E0F2FE';
      case 'FULFILLED':
        return '#E5F6EE';
      case 'REJECTED':
        return '#FFE5E5';
      case 'CANCELLED':
        return '#F0F0F0';
      default:
        return theme.border;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return '#475569';
      case 'APPROVED':
        return '#008040';
      case 'IN_PROGRESS':
        return '#0369A1';
      case 'FULFILLED':
        return '#008040';
      case 'REJECTED':
        return '#CC0000';
      case 'CANCELLED':
        return '#666666';
      default:
        return theme.text;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const { data: request, isLoading: isRequestLoading, isError: isRequestError } = useSupportRequestById(id);
  const { needs, isLoading: isNeedsLoading, contribute, isContributing } = useSupportNeeds(id);

  const { user } = useAuthStore();
  const [myAssignments, setMyAssignments] = useState<VolunteerAssignment[]>([]);
  const [requestAssignments, setRequestAssignments] = useState<VolunteerAssignment[]>([]);
  const [isVolunteerLoading, setIsVolunteerLoading] = useState(false);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<VolunteerAssignment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');

  const loadAssignments = async () => {
    if (!user) return;
    setIsVolunteerLoading(true);
    try {
      if (user.role === UserRole.VOLUNTEER) {
        const data = await getMyAssignments();
        setMyAssignments(data);
      } else if (
        user.role === UserRole.ADMIN ||
        user.role === UserRole.COLLABORATOR ||
        request?.requesterId === user.id
      ) {
        const data = await getAssignmentsBySupportRequest(id);
        setRequestAssignments(data);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setIsVolunteerLoading(false);
    }
  };

  useEffect(() => {
    if (request && user) {
      loadAssignments();
    } catch (error) {
      Alert.alert("Lỗi", "Đăng ký tham gia thất bại.");
    }
  };

  const handleCancelVolunteer = () => {
    Alert.alert("Xác nhận hủy", "Bạn muốn hủy tham gia hỗ trợ?", [
      { text: "Đóng", style: "cancel" },
      {
        text: "Xác nhận hủy",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelAssignment(requestId);
            Alert.alert("Thành công", "Đã hủy tư cách tham gia.");
            refetchRequest();
            loadAssignments();
          } catch (error) {
            Alert.alert("Lỗi", "Không thể thực hiện yêu cầu.");
          }
        },
      },
    ]);
  };

  const handleCompleteVolunteer = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const res = await approveVolunteer(id, volunteerId);
      showAlert('Success', 'Volunteer approved successfully!');
      
      if (res.conversationId) {
        requestAnimationFrame(() => {
          router.push(`/messages/${res.conversationId}`);
        });
      } else {
        loadAssignments();
      }
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to approve volunteer.');
    }
  };

  const handleOpenRejectModal = (assignment: VolunteerAssignment) => {
    setSelectedApplicant(assignment);
    setRejectionReason('');
    setRejectionError('');
    setRejectionModalVisible(true);
  };

  const handleApproveVolunteer = async (volunteerId: string) => {
    try {
      await approveVolunteer(requestId, volunteerId);
      Alert.alert("Thành công", "Đã phê duyệt tình nguyện viên.");
      loadAssignments();
    } catch (err: any) {
      setRejectionError(err?.message || 'Failed to reject volunteer.');
    }
  };

  const [selectedItem, setSelectedItem] = useState<SupportItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertModal, setAlertModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: "",
    message: "",
  });

  const showAlert = (title: string, message: string) => {
    setAlertModal({ visible: true, title, message });
  };

  const mappedItems: SupportItem[] = (needs || []).map((need) => ({
    id: need.id,
    category: ItemCategory.FOOD,
    name: need.needName || (need as any).itemName || 'Item',
    neededQuantity: need.requiredQuantity,
    receivedQuantity: need.receivedQuantity,
  }));

  const isOwner = user && request && request.requesterId === user.id;
  const isStaff = user && (user.role === UserRole.ADMIN || user.role === UserRole.COLLABORATOR);
  const myAssignment = myAssignments.find((a) => a.supportRequestId === id) || requestAssignments.find(a => a.volunteerId === user?.id);
  const showApplicantsSection = (isOwner || isStaff) && requestAssignments.length > 0;
  const showApplyToVolunteerButton = user?.role === UserRole.VOLUNTEER && !myAssignment && request && request.status === 'APPROVED';
  const showHelpButton = !isOwner && mappedItems.length > 0 && request && (request.status === 'APPROVED' || request.status === 'IN_PROGRESS');

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleHelpPress = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (mappedItems.length > 0) {
      setSelectedItem(mappedItems[0]);
      setModalVisible(true);
    } else {
      showAlert('No Items Needed', 'There are no items requested for this support request.');
    }
  };

  const handleConfirmContribution = async (
    itemId: string,
    quantity: number,
    notes: string
  ) => {
    try {
      await rejectVolunteer(
        requestId,
        selectedVolunteerId,
        rejectionReason.trim(),
      );
      setRejectModalVisible(false);
      setRejectionReason("");
      setSelectedVolunteerId(null);
      Alert.alert("Thành công", "Đã từ chối tình nguyện viên.");
      loadAssignments();
    } catch (error) {
      Alert.alert("Lỗi", "Thao tác thất bại.");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        localStyles.scrollContent,
        { backgroundColor: theme.appBG },
      ]}
    >
      <View
        style={[
          localStyles.card,
          { backgroundColor: theme.cardBG, borderColor: theme.border },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Text style={[localStyles.title, { color: theme.text, flex: 1 }]}>
            {request.title}
          </Text>
        </View>

        <View style={localStyles.badgeContainer}>
          <View
            style={[
              localStyles.badge,
              { backgroundColor: theme.primary + "15" },
            ]}
          >
            <Text style={[localStyles.badgeText, { color: theme.primary }]}>
              {request.categoryName || "Khác"}
            </Text>
          </View>
        </View>

        <Text
          style={[localStyles.description, { color: theme.textSupporting }]}
        >
          {request.description}
        </Text>

        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            {
              padding: 8,
              borderRadius: 8,
            },
            pressed && { backgroundColor: theme.highlightBG },
          ]}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text
          numberOfLines={1}
          style={{
            color: theme.text,
            fontSize: 17,
            fontWeight: '600',
            flex: 1,
            textAlign: 'center',
            marginHorizontal: 8,
          }}
        >
          {request?.title ?? 'Request Details'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={localStyles.scrollContent}>
        <View style={[localStyles.card, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
          <Text style={[localStyles.title, { color: theme.text }]}>{request.title}</Text>

          <View style={localStyles.badgeContainer}>
            <View style={[localStyles.badge, { backgroundColor: getUrgencyBg(urgencyValue) }]}>
              <Text style={[localStyles.badgeText, { color: getUrgencyText(urgencyValue) }]}>
                {URGENCY_LABELS[urgencyValue]} Urgency
              </Text>
            </View>
            <View style={[localStyles.badge, { backgroundColor: getStatusBg(request.status) }]}>
              <Text style={[localStyles.badgeText, { color: getStatusText(request.status) }]}>
                {request.status}
              </Text>
            </View>
          </View>

          <View style={[localStyles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[localStyles.detailLabel, { color: theme.textSupporting }]}>Category</Text>
            <Text style={[localStyles.detailValue, { color: theme.text }]}>
              {request.categoryName}
            </Text>
          </View>

          <View style={[localStyles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[localStyles.detailLabel, { color: theme.textSupporting }]}>Location</Text>
            <Text style={[localStyles.detailValue, { color: theme.text }]}>{request.address || 'Location not available'}</Text>
          </View>

          <View style={[localStyles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[localStyles.detailLabel, { color: theme.textSupporting }]}>Created</Text>
            <Text style={[localStyles.detailValue, { color: theme.text }]}>
              {formatDate(request.createdAt)}
            </Text>
          </View>

          <Text style={[localStyles.sectionTitle, { color: theme.text }]}>Description</Text>
          <Text style={[localStyles.description, { color: theme.textSupporting }]}>
            {request.description}
          </Text>

          {/* Needed Items Section */}
          <Text style={[localStyles.sectionTitle, { color: theme.text }]}>Needed Items</Text>
          <View style={localStyles.itemsContainer}>
            {mappedItems.length > 0 ? (
              mappedItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setSelectedItem(item);
                    setModalVisible(true);
                  }}
                  style={({ pressed }) => [
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <SupportItemProgress item={item} />
                </Pressable>
              ))
            ) : (
              <Text style={{ color: theme.textSupporting, fontStyle: 'italic' }}>No items requested.</Text>
            )}
          </View>
        </View>

        {/* Volunteer status card (For Volunteers) */}
        {user?.role === UserRole.VOLUNTEER && (() => {
          if (!myAssignment) return null;
          return (
            <View style={[localStyles.card, { backgroundColor: theme.componentBG, borderColor: theme.border, marginTop: 16 }]}>
              <Text style={[localStyles.sectionTitle, { color: theme.text, marginTop: 0 }]}>
                Your Volunteer Application
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                <Text style={{ fontSize: 15, color: theme.textSupporting, marginRight: 8 }}>
                  Status:
                </Text>
                <View style={[localStyles.badge, { backgroundColor: getStatusBg(myAssignment.status) }]}>
                  <Text style={[localStyles.badgeText, { color: getStatusText(myAssignment.status) }]}>
                    {myAssignment.status}
                  </Text>
                </View>
              </View>
              {myAssignment.rejectionReason ? (
                <Text style={{ fontSize: 14, color: theme.danger || '#CC0000', fontStyle: 'italic', marginTop: 8 }}>
                  Reason: {myAssignment.rejectionReason}
                </Text>
              ) : null}
            </View>
          );
        })()}

        {/* Volunteer Applicants Section (For Owner / Staff) */}
        {showApplicantsSection && (
          <View style={[localStyles.card, { backgroundColor: theme.componentBG, borderColor: theme.border, marginTop: 16 }]}>
            <Text style={[localStyles.sectionTitle, { color: theme.text, marginTop: 0 }]}>
              Volunteer Applicants ({requestAssignments.length})
            </Text>
            
            {requestAssignments.length > 0 ? (
              <View style={{ gap: 12, marginTop: 12 }}>
                {requestAssignments.map((assignment) => (
                  <View
                    key={assignment.id}
                    style={{
                      padding: 14,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: theme.border,
                      backgroundColor: theme.appBG,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                        {assignment.volunteerName}
                      </Text>
                      <View style={[localStyles.badge, { backgroundColor: getStatusBg(assignment.status) }]}>
                        <Text style={[localStyles.badgeText, { color: getStatusText(assignment.status) }]}>
                          {assignment.status}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={{ marginTop: 8, gap: 4 }}>
                      {assignment.volunteerEmail ? (
                        <Text style={{ fontSize: 13, color: theme.textSupporting }}>
                          Email: {assignment.volunteerEmail}
                        </Text>
                      ) : null}
                      {assignment.volunteerPhone ? (
                        <Text style={{ fontSize: 13, color: theme.textSupporting }}>
                          Phone: {assignment.volunteerPhone}
                        </Text>
                      ) : null}
                      {assignment.rejectionReason ? (
                        <Text style={{ fontSize: 13, color: theme.danger || '#CC0000', fontStyle: 'italic', marginTop: 4 }}>
                          Reason: {assignment.rejectionReason}
                        </Text>
                      ) : null}
                    </View>

                    {assignment.status === 'PENDING' && (
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                        <Pressable
                          style={({ pressed }) => [
                            {
                              flex: 1,
                              paddingVertical: 10,
                              borderRadius: 6,
                              backgroundColor: '#E5F6EE',
                              borderWidth: 1,
                              borderColor: '#008040',
                              alignItems: 'center',
                              opacity: pressed ? 0.8 : 1,
                            }
                          ]}
                          onPress={() => handleApproveVolunteer(assignment.volunteerId)}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#008040' }}>Approve</Text>
                        </Pressable>
                        
                        <Pressable
                          style={({ pressed }) => [
                            {
                              flex: 1,
                              paddingVertical: 10,
                              borderRadius: 6,
                              backgroundColor: '#FFE5E5',
                              borderWidth: 1,
                              borderColor: '#CC0000',
                              alignItems: 'center',
                              opacity: pressed ? 0.8 : 1,
                            }
                          ]}
                          onPress={() => handleOpenRejectModal(assignment)}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#CC0000' }}>Reject</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ color: theme.textSupporting, fontStyle: 'italic', marginTop: 8 }}>
                No volunteers have applied yet.
              </Text>
            )}
          </View>
        )}
        
      </ScrollView>

      {/* Contribution Modal */}
      <ContributeItemModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        item={selectedItem}
        onConfirm={handleConfirmContribution}
      />

      {/* Rejection Reason Modal */}
      <Modal
        visible={rejectionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectionModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: theme.componentBG,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>
              Reject Volunteer Application
            </Text>
            
            <Text style={{ fontSize: 14, color: theme.textSupporting, marginBottom: 16 }}>
              {"Please provide a reason for rejecting " + selectedApplicant?.volunteerName + "'s application."}
            </Text>
            
            <TextInput
              label="Rejection Reason"
              value={rejectionReason}
              onChangeText={(text) => {
                setRejectionReason(text);
                if (text.trim()) setRejectionError('');
              }}
              errorText={rejectionError}
              multiline
              numberOfLines={3}
              placeholder="e.g. Volunteer slots are already filled."
              height={100}
            />
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Pressable
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.border,
                    alignItems: 'center',
                    backgroundColor: theme.highlightBG,
                    opacity: pressed ? 0.8 : 1,
                  }
                ]}
                onPress={() => {
                  setRejectionModalVisible(false);
                  setSelectedApplicant(null);
                  setRejectionReason('');
                  setRejectionError('');
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textSupporting }}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 8,
                    backgroundColor: theme.danger || '#CC0000',
                    alignItems: 'center',
                    opacity: pressed ? 0.8 : 1,
                  }
                ]}
                onPress={handleConfirmReject}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Submit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {showApplyToVolunteerButton && (
        <View style={localStyles.footer}>
          <Pressable
            style={({ pressed }) => [
              localStyles.helpButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed || isVolunteerLoading ? 0.9 : 1,
                shadowColor: theme.inverse,
              },
            ]}
            onPress={handleApplyToVolunteer}
            disabled={isVolunteerLoading}
          >
            {isVolunteerLoading ? (
              <ActivityIndicator color={theme.textLight} />
            ) : (
              <Text style={[localStyles.helpButtonText, { color: theme.textLight }]}>
                Apply to Volunteer
              </Text>
            )}
          </Pressable>
        </View>
      )}

      {showHelpButton && (
        <View style={localStyles.footer}>
          <Pressable
            style={({ pressed }) => [
              localStyles.helpButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed || isContributing ? 0.9 : 1,
                shadowColor: theme.inverse,
              },
            ]}
            onPress={handleHelpPress}
            disabled={isContributing}
          >
            {isContributing ? (
              <ActivityIndicator color={theme.textLight} />
            ) : (
              <Text style={[localStyles.helpButtonText, { color: theme.textLight }]}>
                I Want to Help
              </Text>
            )}
          </Pressable>
        </View>
      )}

      <ConfirmModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        confirmText="OK"
        cancelText=""
        onConfirm={() => setAlertModal(prev => ({ ...prev, visible: false }))}
        onCancel={() => setAlertModal(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 32,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  // Các class bổ sung cho UI mở rộng
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },
  buttonGroup: { marginTop: 12, width: "100%", gap: 10 },
  statusBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    marginBottom: 8,
  },
  volunteerCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  volunteerName: { fontSize: 15, fontWeight: "600" },
  volunteerActions: { flexDirection: "row", gap: 8 },
  iconBtnApprove: { backgroundColor: "#10b981", padding: 8, borderRadius: 20 },
  iconBtnReject: { backgroundColor: "#ef4444", padding: 8, borderRadius: 20 },
});

// import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Modal, TextInput as RNTextInput, Image, Platform } from 'react-native';
// import { useTheme } from '@/hooks/useTheme';
// import { useThemeStyles } from '@/hooks/useThemeStyles';
// import { ConfirmModal } from '@/components/ui';
// import TextInput from '@/components/ui/TextInput';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import * as Haptics from 'expo-haptics';
// import { Pressable } from 'react-native';
// import { SupportItemProgress } from '@/features/support/components/SupportItemProgress';
// import { ContributeItemModal } from '@/features/support/components/ContributeItemModal';
// import { useSupportRequestById } from '@/features/support/hooks/useSupportRequestById';
// import { useSupportNeeds } from '@/features/support/hooks/useSupportNeeds';
// import { useState, useEffect, useRef } from 'react';
// import { api } from '@/lib/api-client';
// import { MaterialIcons } from '@expo/vector-icons';
// import { useAuthStore } from '@/features/auth/stores/useAuthStore';
// import { UserRole } from '@/features/auth/types';
// import {
//   VolunteerAssignment,
//   getMyAssignments,
//   applyToSupportRequest,
//   approveVolunteer,
//   rejectVolunteer,
//   getAssignmentsBySupportRequest,
// } from '@/features/support/api/volunteer-assignments';
// import {
//   SupportStatus,
//   UrgencyLevel,
//   SupportCategory,
//   STATUS_LABELS,
//   URGENCY_LABELS,
//   CATEGORY_LABELS,
//   SupportItem,
//   ItemCategory,
// } from '@/features/support/types/support.types';

// export default function RequestDetailScreen() {
//   const theme = useTheme();
//   const styles = useThemeStyles();
//   const { id } = useLocalSearchParams<{ id: string }>();
//   const router = useRouter();

//   const getUrgencyBg = (urgency: UrgencyLevel): string => {
//     switch (urgency) {
//       case UrgencyLevel.HIGH:
//         return '#FFE5E5';
//       case UrgencyLevel.MEDIUM:
//         return '#FFF4E5';
//       case UrgencyLevel.LOW:
//         return '#E5F6EE';
//       default:
//         return theme.border;
//     }
//   };

//   const getUrgencyText = (urgency: UrgencyLevel): string => {
//     switch (urgency) {
//       case UrgencyLevel.HIGH:
//         return '#CC0000';
//       case UrgencyLevel.MEDIUM:
//         return '#B35900';
//       case UrgencyLevel.LOW:
//         return '#008040';
//       default:
//         return theme.text;
//     }
//   };

//   const getStatusBg = (status: string): string => {
//     switch (status) {
//       case 'PENDING':
//         return '#E2E8F0';
//       case 'APPROVED':
//         return '#E5F6EE';
//       case 'IN_PROGRESS':
//         return '#E0F2FE';
//       case 'FULFILLED':
//         return '#E5F6EE';
//       case 'REJECTED':
//         return '#FFE5E5';
//       case 'CANCELLED':
//         return '#F0F0F0';
//       default:
//         return theme.border;
//     }
//   };

//   const getStatusText = (status: string): string => {
//     switch (status) {
//       case 'PENDING':
//         return '#475569';
//       case 'APPROVED':
//         return '#008040';
//       case 'IN_PROGRESS':
//         return '#0369A1';
//       case 'FULFILLED':
//         return '#008040';
//       case 'REJECTED':
//         return '#CC0000';
//       case 'CANCELLED':
//         return '#666666';
//       default:
//         return theme.text;
//     }
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });
//   };

//   const { data: request, isLoading: isRequestLoading, isError: isRequestError } = useSupportRequestById(id);
//   const { needs, isLoading: isNeedsLoading, contribute, isContributing } = useSupportNeeds(id);

//   const { user } = useAuthStore();
//   const [myAssignments, setMyAssignments] = useState<VolunteerAssignment[]>([]);
//   const [requestAssignments, setRequestAssignments] = useState<VolunteerAssignment[]>([]);
//   const [isVolunteerLoading, setIsVolunteerLoading] = useState(false);
//   const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
//   const [selectedApplicant, setSelectedApplicant] = useState<VolunteerAssignment | null>(null);
//   const [rejectionReason, setRejectionReason] = useState('');
//   const [rejectionError, setRejectionError] = useState('');

//   const loadAssignments = async () => {
//     if (!user) return;
//     setIsVolunteerLoading(true);
//     try {
//       if (user.role === UserRole.VOLUNTEER) {
//         const data = await getMyAssignments();
//         setMyAssignments(data);
//       } else if (
//         user.role === UserRole.ADMIN ||
//         user.role === UserRole.COLLABORATOR ||
//         request?.requesterId === user.id
//       ) {
//         const data = await getAssignmentsBySupportRequest(id);
//         setRequestAssignments(data);
//       }
//     } catch (err) {
//       console.error('Failed to load assignments:', err);
//     } finally {
//       setIsVolunteerLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (request && user) {
//       loadAssignments();
//     }
//   }, [request, user]);

//   const handleApplyToVolunteer = async () => {
//     setIsVolunteerLoading(true);
//     try {
//       await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       await applyToSupportRequest(id);
//       showAlert('Applied to Volunteer', 'Your application to volunteer has been submitted successfully.');
//       loadAssignments();
//     } catch (err: any) {
//       showAlert('Error', err?.message || 'Failed to submit application to volunteer.');
//     } finally {
//       setIsVolunteerLoading(false);
//     }
//   };

//   const handleApproveVolunteer = async (volunteerId: string) => {
//     try {
//       await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       const res = await approveVolunteer(id, volunteerId);
//       showAlert('Success', 'Volunteer approved successfully!');

//       if (res.conversationId) {
//         requestAnimationFrame(() => {
//           router.push(`/messages/${res.conversationId}`);
//         });
//       } else {
//         loadAssignments();
//       }
//     } catch (err: any) {
//       showAlert('Error', err?.message || 'Failed to approve volunteer.');
//     }
//   };

//   const handleOpenRejectModal = (assignment: VolunteerAssignment) => {
//     setSelectedApplicant(assignment);
//     setRejectionReason('');
//     setRejectionError('');
//     setRejectionModalVisible(true);
//   };

//   const handleConfirmReject = async () => {
//     if (!selectedApplicant) return;
//     if (!rejectionReason.trim()) {
//       setRejectionError('Rejection reason is required');
//       return;
//     }
//     if (rejectionReason.trim().length > 200) {
//       setRejectionError('Rejection reason must not exceed 200 characters');
//       return;
//     }
//     try {
//       await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
//       await rejectVolunteer(id, selectedApplicant.volunteerId, rejectionReason.trim());
//       setRejectionModalVisible(false);
//       setSelectedApplicant(null);
//       setRejectionReason('');
//       showAlert('Success', 'Volunteer application has been rejected.');
//       loadAssignments();
//     } catch (err: any) {
//       setRejectionError(err?.message || 'Failed to reject volunteer.');
//     }
//   };

//   const [selectedItem, setSelectedItem] = useState<SupportItem | null>(null);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [alertModal, setAlertModal] = useState<{ visible: boolean; title: string; message: string }>({
//     visible: false,
//     title: "",
//     message: "",
//   });

//   const showAlert = (title: string, message: string) => {
//     setAlertModal({ visible: true, title, message });
//   };

//   const mappedItems: SupportItem[] = (needs || []).map((need) => ({
//     id: need.id,
//     category: ItemCategory.FOOD,
//     name: need.needName || (need as any).itemName || 'Item',
//     neededQuantity: need.requiredQuantity,
//     receivedQuantity: need.receivedQuantity,
//   }));

//   const isOwner = user && request && request.requesterId === user.id;
//   const isStaff = user && (user.role === UserRole.ADMIN || user.role === UserRole.COLLABORATOR);
//   const myAssignment = myAssignments.find((a) => a.supportRequestId === id) || requestAssignments.find(a => a.volunteerId === user?.id);
//   const showApplicantsSection = (isOwner || isStaff) && requestAssignments.length > 0;
//   const showApplyToVolunteerButton = user?.role === UserRole.VOLUNTEER && !myAssignment && request && request.status === 'APPROVED';
//   const showHelpButton = !isOwner && mappedItems.length > 0 && request && (request.status === 'APPROVED' || request.status === 'IN_PROGRESS');

//   const handleBack = async () => {
//     await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     router.back();
//   };

//   const handleHelpPress = async () => {
//     await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//     if (mappedItems.length > 0) {
//       setSelectedItem(mappedItems[0]);
//       setModalVisible(true);
//     } else {
//       showAlert('No Items Needed', 'There are no items requested for this support request.');
//     }
//   };

//   const handleConfirmContribution = async (
//     itemId: string,
//     quantity: number,
//     notes: string
//   ) => {
//     try {
//       await contribute({
//         needId: itemId,
//         data: {
//           quantity,
//           note: notes,
//         },
//       });
//       setModalVisible(false);
//       setSelectedItem(null);
//       showAlert('Thank You', 'Your contribution has been recorded successfully!');
//     } catch (err: any) {
//       showAlert('Error', err?.message || 'Failed to submit contribution.');
//     }
//   };

//   if (isRequestLoading || isNeedsLoading) {
//     return (
//       <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
//         <ActivityIndicator size="large" color={theme.primary} />
//       </View>
//     );
//   }

//   if (isRequestError) {
//     return (
//       <View style={[styles.container, { backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }]}>
//         <Text style={{ color: theme.text, fontSize: 18 }}>Failed to load request details</Text>
//       </View>
//     );
//   }

//   if (!request) {
//     return (
//       <View style={[styles.container, { backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }]}>
//         <Text style={{ color: theme.text, fontSize: 18 }}>Request not found</Text>
//       </View>
//     );
//   }

//   const urgencyValue: UrgencyLevel = request.urgency === 1 || request.urgency === 'HIGH' ? UrgencyLevel.HIGH :
//                        request.urgency === 3 || request.urgency === 'LOW' ? UrgencyLevel.LOW :
//                        UrgencyLevel.MEDIUM;

//   return (
//     <View style={[styles.container, { backgroundColor: theme.appBG }]}>
//       {/* Header back button + title */}
//       <View
//         style={{
//           flexDirection: 'row',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           paddingHorizontal: 8,
//           paddingVertical: 12,
//           borderBottomWidth: 1,
//           borderBottomColor: theme.border,
//           backgroundColor: theme.appBG,
//         }}
//       >
//         <Pressable
//           onPress={handleBack}
//           style={({ pressed }) => [
//             {
//               padding: 8,
//               borderRadius: 8,
//             },
//             pressed && { backgroundColor: theme.highlightBG },
//           ]}
//         >
//           <MaterialIcons name="arrow-back" size={24} color={theme.text} />
//         </Pressable>
//         <Text
//           numberOfLines={1}
//           style={{
//             color: theme.text,
//             fontSize: 17,
//             fontWeight: '600',
//             flex: 1,
//             textAlign: 'center',
//             marginHorizontal: 8,
//           }}
//         >
//           {request?.title ?? 'Request Details'}
//         </Text>
//         <View style={{ width: 40 }} />
//       </View>

//       <ScrollView contentContainerStyle={localStyles.scrollContent}>
//         <View style={[localStyles.card, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
//           <Text style={[localStyles.title, { color: theme.text }]}>{request.title}</Text>

//           <View style={localStyles.badgeContainer}>
//             <View style={[localStyles.badge, { backgroundColor: getUrgencyBg(urgencyValue) }]}>
//               <Text style={[localStyles.badgeText, { color: getUrgencyText(urgencyValue) }]}>
//                 {URGENCY_LABELS[urgencyValue]} Urgency
//               </Text>
//             </View>
//             <View style={[localStyles.badge, { backgroundColor: getStatusBg(request.status) }]}>
//               <Text style={[localStyles.badgeText, { color: getStatusText(request.status) }]}>
//                 {request.status}
//               </Text>
//             </View>
//           </View>

//           <View style={[localStyles.detailRow, { borderBottomColor: theme.border }]}>
//             <Text style={[localStyles.detailLabel, { color: theme.textSupporting }]}>Category</Text>
//             <Text style={[localStyles.detailValue, { color: theme.text }]}>
//               {request.categoryName}
//             </Text>
//           </View>

//           <View style={[localStyles.detailRow, { borderBottomColor: theme.border }]}>
//             <Text style={[localStyles.detailLabel, { color: theme.textSupporting }]}>Location</Text>
//             <Text style={[localStyles.detailValue, { color: theme.text }]}>{request.address || 'Location not available'}</Text>
//           </View>

//           <View style={[localStyles.detailRow, { borderBottomColor: theme.border }]}>
//             <Text style={[localStyles.detailLabel, { color: theme.textSupporting }]}>Created</Text>
//             <Text style={[localStyles.detailValue, { color: theme.text }]}>
//               {formatDate(request.createdAt)}
//             </Text>
//           </View>

//           <Text style={[localStyles.sectionTitle, { color: theme.text }]}>Description</Text>
//           <Text style={[localStyles.description, { color: theme.textSupporting }]}>
//             {request.description}
//           </Text>

//           {/* Needed Items Section */}
//           <Text style={[localStyles.sectionTitle, { color: theme.text }]}>Needed Items</Text>
//           <View style={localStyles.itemsContainer}>
//             {mappedItems.length > 0 ? (
//               mappedItems.map((item) => (
//                 <Pressable
//                   key={item.id}
//                   onPress={() => {
//                     setSelectedItem(item);
//                     setModalVisible(true);
//                   }}
//                   style={({ pressed }) => [
//                     pressed && { opacity: 0.7 }
//                   ]}
//                 >
//                   <SupportItemProgress item={item} />
//                 </Pressable>
//               ))
//             ) : (
//               <Text style={{ color: theme.textSupporting, fontStyle: 'italic' }}>No items requested.</Text>
//             )}
//           </View>
//         </View>

//         {/* Volunteer status card (For Volunteers) */}
//         {user?.role === UserRole.VOLUNTEER && (() => {
//           if (!myAssignment) return null;
//           return (
//             <View style={[localStyles.card, { backgroundColor: theme.componentBG, borderColor: theme.border, marginTop: 16 }]}>
//               <Text style={[localStyles.sectionTitle, { color: theme.text, marginTop: 0 }]}>
//                 Your Volunteer Application
//               </Text>
//               <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
//                 <Text style={{ fontSize: 15, color: theme.textSupporting, marginRight: 8 }}>
//                   Status:
//                 </Text>
//                 <View style={[localStyles.badge, { backgroundColor: getStatusBg(myAssignment.status) }]}>
//                   <Text style={[localStyles.badgeText, { color: getStatusText(myAssignment.status) }]}>
//                     {myAssignment.status}
//                   </Text>
//                 </View>
//               </View>
//               {myAssignment.rejectionReason ? (
//                 <Text style={{ fontSize: 14, color: theme.danger || '#CC0000', fontStyle: 'italic', marginTop: 8 }}>
//                   Reason: {myAssignment.rejectionReason}
//                 </Text>
//               ) : null}
//             </View>
//           );
//         })()}

//         {/* Volunteer Applicants Section (For Owner / Staff) */}
//         {showApplicantsSection && (
//           <View style={[localStyles.card, { backgroundColor: theme.componentBG, borderColor: theme.border, marginTop: 16 }]}>
//             <Text style={[localStyles.sectionTitle, { color: theme.text, marginTop: 0 }]}>
//               Volunteer Applicants ({requestAssignments.length})
//             </Text>

//             {requestAssignments.length > 0 ? (
//               <View style={{ gap: 12, marginTop: 12 }}>
//                 {requestAssignments.map((assignment) => (
//                   <View
//                     key={assignment.id}
//                     style={{
//                       padding: 14,
//                       borderRadius: 8,
//                       borderWidth: 1,
//                       borderColor: theme.border,
//                       backgroundColor: theme.appBG,
//                     }}
//                   >
//                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
//                       <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
//                         {assignment.volunteerName}
//                       </Text>
//                       <View style={[localStyles.badge, { backgroundColor: getStatusBg(assignment.status) }]}>
//                         <Text style={[localStyles.badgeText, { color: getStatusText(assignment.status) }]}>
//                           {assignment.status}
//                         </Text>
//                       </View>
//                     </View>

//                     <View style={{ marginTop: 8, gap: 4 }}>
//                       {assignment.volunteerEmail ? (
//                         <Text style={{ fontSize: 13, color: theme.textSupporting }}>
//                           Email: {assignment.volunteerEmail}
//                         </Text>
//                       ) : null}
//                       {assignment.volunteerPhone ? (
//                         <Text style={{ fontSize: 13, color: theme.textSupporting }}>
//                           Phone: {assignment.volunteerPhone}
//                         </Text>
//                       ) : null}
//                       {assignment.rejectionReason ? (
//                         <Text style={{ fontSize: 13, color: theme.danger || '#CC0000', fontStyle: 'italic', marginTop: 4 }}>
//                           Reason: {assignment.rejectionReason}
//                         </Text>
//                       ) : null}
//                     </View>

//                     {assignment.status === 'PENDING' && (
//                       <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
//                         <Pressable
//                           style={({ pressed }) => [
//                             {
//                               flex: 1,
//                               paddingVertical: 10,
//                               borderRadius: 6,
//                               backgroundColor: '#E5F6EE',
//                               borderWidth: 1,
//                               borderColor: '#008040',
//                               alignItems: 'center',
//                               opacity: pressed ? 0.8 : 1,
//                             }
//                           ]}
//                           onPress={() => handleApproveVolunteer(assignment.volunteerId)}
//                         >
//                           <Text style={{ fontSize: 14, fontWeight: '600', color: '#008040' }}>Approve</Text>
//                         </Pressable>

//                         <Pressable
//                           style={({ pressed }) => [
//                             {
//                               flex: 1,
//                               paddingVertical: 10,
//                               borderRadius: 6,
//                               backgroundColor: '#FFE5E5',
//                               borderWidth: 1,
//                               borderColor: '#CC0000',
//                               alignItems: 'center',
//                               opacity: pressed ? 0.8 : 1,
//                             }
//                           ]}
//                           onPress={() => handleOpenRejectModal(assignment)}
//                         >
//                           <Text style={{ fontSize: 14, fontWeight: '600', color: '#CC0000' }}>Reject</Text>
//                         </Pressable>
//                       </View>
//                     )}
//                   </View>
//                 ))}
//               </View>
//             ) : (
//               <Text style={{ color: theme.textSupporting, fontStyle: 'italic', marginTop: 8 }}>
//                 No volunteers have applied yet.
//               </Text>
//             )}
//           </View>
//         )}

//       </ScrollView>

//       {/* Contribution Modal */}
//       <ContributeItemModal
//         visible={modalVisible}
//         onClose={() => setModalVisible(false)}
//         item={selectedItem}
//         onConfirm={handleConfirmContribution}
//       />

//       {/* Rejection Reason Modal */}
//       <Modal
//         visible={rejectionModalVisible}
//         transparent
//         animationType="fade"
//         onRequestClose={() => setRejectionModalVisible(false)}
//       >
//         <View
//           style={{
//             flex: 1,
//             justifyContent: 'center',
//             alignItems: 'center',
//             backgroundColor: 'rgba(0,0,0,0.5)',
//             padding: 20,
//           }}
//         >
//           <View
//             style={{
//               width: '100%',
//               maxWidth: 400,
//               backgroundColor: theme.componentBG,
//               borderRadius: 12,
//               borderWidth: 1,
//               borderColor: theme.border,
//               padding: 20,
//               shadowColor: '#000',
//               shadowOffset: { width: 0, height: 4 },
//               shadowOpacity: 0.3,
//               shadowRadius: 8,
//               elevation: 8,
//             }}
//           >
//             <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>
//               Reject Volunteer Application
//             </Text>

//             <Text style={{ fontSize: 14, color: theme.textSupporting, marginBottom: 16 }}>
//               {"Please provide a reason for rejecting " + selectedApplicant?.volunteerName + "'s application."}
//             </Text>

//             <TextInput
//               label="Rejection Reason"
//               value={rejectionReason}
//               onChangeText={(text) => {
//                 setRejectionReason(text);
//                 if (text.trim()) setRejectionError('');
//               }}
//               errorText={rejectionError}
//               multiline
//               numberOfLines={3}
//               placeholder="e.g. Volunteer slots are already filled."
//               height={100}
//             />

//             <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
//               <Pressable
//                 style={({ pressed }) => [
//                   {
//                     flex: 1,
//                     paddingVertical: 12,
//                     borderRadius: 8,
//                     borderWidth: 1,
//                     borderColor: theme.border,
//                     alignItems: 'center',
//                     backgroundColor: theme.highlightBG,
//                     opacity: pressed ? 0.8 : 1,
//                   }
//                 ]}
//                 onPress={() => {
//                   setRejectionModalVisible(false);
//                   setSelectedApplicant(null);
//                   setRejectionReason('');
//                   setRejectionError('');
//                 }}
//               >
//                 <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textSupporting }}>Cancel</Text>
//               </Pressable>

//               <Pressable
//                 style={({ pressed }) => [
//                   {
//                     flex: 1,
//                     paddingVertical: 12,
//                     borderRadius: 8,
//                     backgroundColor: theme.danger || '#CC0000',
//                     alignItems: 'center',
//                     opacity: pressed ? 0.8 : 1,
//                   }
//                 ]}
//                 onPress={handleConfirmReject}
//               >
//                 <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Submit</Text>
//               </Pressable>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {showApplyToVolunteerButton && (
//         <View style={localStyles.footer}>
//           <Pressable
//             style={({ pressed }) => [
//               localStyles.helpButton,
//               {
//                 backgroundColor: theme.primary,
//                 opacity: pressed || isVolunteerLoading ? 0.9 : 1,
//                 shadowColor: theme.inverse,
//               },
//             ]}
//             onPress={handleApplyToVolunteer}
//             disabled={isVolunteerLoading}
//           >
//             {isVolunteerLoading ? (
//               <ActivityIndicator color={theme.textLight} />
//             ) : (
//               <Text style={[localStyles.helpButtonText, { color: theme.textLight }]}>
//                 Apply to Volunteer
//               </Text>
//             )}
//           </Pressable>
//         </View>
//       )}

//       {showHelpButton && (
//         <View style={localStyles.footer}>
//           <Pressable
//             style={({ pressed }) => [
//               localStyles.helpButton,
//               {
//                 backgroundColor: theme.primary,
//                 opacity: pressed || isContributing ? 0.9 : 1,
//                 shadowColor: theme.inverse,
//               },
//             ]}
//             onPress={handleHelpPress}
//             disabled={isContributing}
//           >
//             {isContributing ? (
//               <ActivityIndicator color={theme.textLight} />
//             ) : (
//               <Text style={[localStyles.helpButtonText, { color: theme.textLight }]}>
//                 I Want to Help
//               </Text>
//             )}
//           </Pressable>
//         </View>
//       )}

//       <ConfirmModal
//         visible={alertModal.visible}
//         title={alertModal.title}
//         message={alertModal.message}
//         confirmText="OK"
//         cancelText=""
//         onConfirm={() => setAlertModal(prev => ({ ...prev, visible: false }))}
//         onCancel={() => setAlertModal(prev => ({ ...prev, visible: false }))}
//       />
//     </View>
//   );
// }

// const localStyles = StyleSheet.create({
//   scrollContent: {
//     padding: 16,
//     paddingBottom: 100,
//   },
//   card: {
//     borderRadius: 12,
//     borderWidth: 1,
//     padding: 20,
//     gap: 16,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     lineHeight: 32,
//   },
//   badgeContainer: {
//     flexDirection: 'row',
//     gap: 8,
//     flexWrap: 'wrap',
//   },
//   badge: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 8,
//   },
//   badgeText: {
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//   },
//   detailLabel: {
//     fontSize: 14,
//   },
//   detailValue: {
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     marginTop: 8,
//   },
//   description: {
//     fontSize: 16,
//     lineHeight: 24,
//   },
//   itemsContainer: {
//     gap: 12,
//     marginTop: 8,
//   },
//   footer: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     padding: 16,
//     backgroundColor: 'transparent',
//   },
//   helpButton: {
//     paddingVertical: 18,
//     borderRadius: 100,
//     alignItems: 'center',
//     elevation: 4,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   helpButtonText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
// });
