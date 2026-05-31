import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Modal, TextInput as RNTextInput, Image, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { ConfirmModal, BottomSheet } from '@/components/ui';
import { getUser } from '@/features/users/api/get-user';
import { createPrivateConversation } from '@/features/communication/api/create-private-conversation';
import TextInput from '@/components/ui/TextInput';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';
import { SupportItemProgress } from '@/features/support/components/SupportItemProgress';
import { ContributeItemModal } from '@/features/support/components/ContributeItemModal';
import { useSupportRequestById } from '@/features/support/hooks/useSupportRequestById';
import { useSupportNeeds } from '@/features/support/hooks/useSupportNeeds';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { UserRole } from '@/features/auth/types';
import { useQueryClient } from '@tanstack/react-query';
import {
  VolunteerAssignment,
  getMyAssignments,
  applyToSupportRequest,
  approveVolunteer,
  rejectVolunteer,
  getAssignmentsBySupportRequest,
} from '@/features/support/api/volunteer-assignments';
import {
  UrgencyLevel,
  URGENCY_LABELS,
  SupportItem,
  ItemCategory,
} from '@/features/support/types/support.types';
import { approveSupportRequest } from '@/features/support/api/approve-support-request';
import { rejectSupportRequest } from '@/features/support/api/reject-support-request';
import { createSupportNeed } from '@/features/support/api/create-support-need';
import { updateSupportNeed } from '@/features/support/api/update-support-need';
import { deleteSupportNeed } from '@/features/support/api/delete-support-need';
import { ReportModal, ReportTargetType } from '@/features/reports';

export default function RequestDetailScreen() {
  const theme = useTheme();
  const styles = useThemeStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

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
        return theme.highlightBG;
      case 'APPROVED':
      case 'ACCEPTED':
      case 'FULFILLED':
      case 'COMPLETED':
        return theme.success + '20';
      case 'IN_PROGRESS':
        return theme.primary + '20';
      case 'REJECTED':
        return theme.danger + '20';
      case 'CANCELLED':
        return theme.highlightBG;
      default:
        return theme.highlightBG;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return theme.textSupporting;
      case 'APPROVED':
      case 'ACCEPTED':
      case 'FULFILLED':
      case 'COMPLETED':
        return theme.success;
      case 'IN_PROGRESS':
        return theme.primary;
      case 'REJECTED':
        return theme.danger;
      case 'CANCELLED':
        return theme.textSupporting;
      default:
        return theme.textSupporting;
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

  // Applicant details BottomSheet state
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Sharing states
  const [isMenuSheetVisible, setIsMenuSheetVisible] = useState(false);
  const [isShareSheetVisible, setIsShareSheetVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isConversationsLoading, setIsConversationsLoading] = useState(false);

  useEffect(() => {
    if (isShareSheetVisible) {
      setIsConversationsLoading(true);
      api.get<any>('/api/v1/conversations/me')
        .then((res) => {
          setConversations(res || []);
        })
        .catch((err) => {
          console.error('Failed to load conversations for sharing:', err);
        })
        .finally(() => {
          setIsConversationsLoading(false);
        });
    }
  }, [isShareSheetVisible]);

  const handleShareRequest = async (conversationId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const payload = {
        content: `[SHARED_ITEM:SUPPORT:${id}:${request?.title || 'Help Request'}]`,
      };
      await api.post(`/api/v1/conversations/${conversationId}/messages`, payload);
      showAlert('Success', 'Request shared successfully!');
      setIsShareSheetVisible(false);
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to share request.');
    }
  };

  // Request review state
  const [isReviewing, setIsReviewing] = useState(false);
  const [requestRejectionModalVisible, setRequestRejectionModalVisible] = useState(false);
  const [requestRejectionReason, setRequestRejectionReason] = useState('');
  const [requestRejectionError, setRequestRejectionError] = useState('');

  // Support needs management state
  const [needModalVisible, setNeedModalVisible] = useState(false);
  const [editingNeed, setEditingNeed] = useState<any | null>(null); // null means adding
  const [needType, setNeedType] = useState<'MONEY' | 'GOODS'>('GOODS');
  const [needName, setNeedName] = useState('');
  const [needUnit, setNeedUnit] = useState('PIECE');
  const [needQuantity, setNeedQuantity] = useState('');
  const [needError, setNeedError] = useState('');
  const [isNeedActionLoading, setIsNeedActionLoading] = useState(false);

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
    }
  }, [request, user]);

  const handleApplyToVolunteer = async () => {
    setIsVolunteerLoading(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await applyToSupportRequest(id);
      showAlert('Applied to Volunteer', 'Your application to volunteer has been submitted successfully.');
      loadAssignments();
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to submit application to volunteer.');
    } finally {
      setIsVolunteerLoading(false);
    }
  };

  const handleApproveVolunteer = async (volunteerId: string) => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const res = await approveVolunteer(id, volunteerId);
      
      if (res.conversationId) {
        try {
          const existingMsgs = await api.get<any[]>(`/api/v1/conversations/${res.conversationId}/messages`);
          const assignment = requestAssignments.find(a => a.volunteerId === volunteerId);
          const volunteerName = assignment?.volunteerName || 'A volunteer';
          
          if (!existingMsgs || existingMsgs.length === 0) {
            await api.post(`/api/v1/conversations/${res.conversationId}/messages`, {
              content: `[SYSTEM:START] This is the coordination chat for the support request: "${request?.title || 'Help Request'}".`,
            });
          } else {
            await api.post(`/api/v1/conversations/${res.conversationId}/messages`, {
              content: `[SYSTEM:JOIN] ${volunteerName} has joined the chat to help with this support request.`,
            });
          }
        } catch (msgErr) {
          console.error('Failed to post system messages on volunteer approval:', msgErr);
        }
      }

      showAlert('Success', 'Volunteer approved successfully!');
      
      if (isOwner && res.conversationId) {
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

  const handleApplicantPress = async (volunteerId: string) => {
    setSelectedApplicantId(volunteerId);
    setIsProfileVisible(true);
    setIsProfileLoading(true);
    setProfileData(null);

    try {
      const res = await getUser(volunteerId);
      if (res) {
        setProfileData(res);
      } else {
        const currentAssignment = requestAssignments.find(a => a.volunteerId === volunteerId);
        setProfileData({
          id: volunteerId,
          fullName: currentAssignment?.volunteerName || 'Volunteer',
          email: currentAssignment?.volunteerEmail,
          phone: currentAssignment?.volunteerPhone,
          role: 'VOLUNTEER',
        });
      }
    } catch (err) {
      console.warn('Failed to fetch user details, using mock fallback:', err);
      const currentAssignment = requestAssignments.find(a => a.volunteerId === volunteerId);
      setProfileData({
        id: volunteerId,
        fullName: currentAssignment?.volunteerName || 'Volunteer',
        email: currentAssignment?.volunteerEmail,
        phone: currentAssignment?.volunteerPhone,
        role: 'VOLUNTEER',
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleDirectMessage = async () => {
    if (!selectedApplicantId) return;
    setChatLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProfileVisible(false);

    try {
      const res: any = await createPrivateConversation({ receiverId: selectedApplicantId });
      const conversationId = res?.id || res?.data?.id;
      if (conversationId) {
        requestAnimationFrame(() => {
          router.push({ pathname: '/messages/[id]', params: { id: conversationId } } as any);
        });
      } else {
        router.push('/(app)/messages' as any);
      }
    } catch (err) {
      console.error('Failed to create private conversation, navigating to mock chat:', err);
      router.push({ pathname: '/messages/[id]', params: { id: selectedApplicantId } } as any);
    } finally {
      setChatLoading(false);
    }
  };

  const handleOpenRejectModal = (assignment: VolunteerAssignment) => {
    setSelectedApplicant(assignment);
    setRejectionReason('');
    setRejectionError('');
    setRejectionModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedApplicant) return;
    if (!rejectionReason.trim()) {
      setRejectionError('Rejection reason is required');
      return;
    }
    if (rejectionReason.trim().length > 200) {
      setRejectionError('Rejection reason must not exceed 200 characters');
      return;
    }
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await rejectVolunteer(id, selectedApplicant.volunteerId, rejectionReason.trim());
      setRejectionModalVisible(false);
      setSelectedApplicant(null);
      setRejectionReason('');
      showAlert('Success', 'Volunteer application has been rejected.');
      loadAssignments();
    } catch (err: any) {
      setRejectionError(err?.message || 'Failed to reject volunteer.');
    }
  };

  // Support request review handlers
  const handleApproveRequest = async () => {
    setIsReviewing(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await approveSupportRequest(id);
      showAlert('Request Approved', 'The support request has been successfully approved.');
      queryClient.invalidateQueries({ queryKey: ['supportRequests'] });
      queryClient.invalidateQueries({ queryKey: ['supportRequest', id] });
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to approve support request.');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleOpenRequestRejectModal = () => {
    setRequestRejectionReason('');
    setRequestRejectionError('');
    setRequestRejectionModalVisible(true);
  };

  const handleConfirmRequestReject = async () => {
    if (!requestRejectionReason.trim()) {
      setRequestRejectionError('Rejection reason is required');
      return;
    }
    setIsReviewing(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await rejectSupportRequest(id, requestRejectionReason.trim());
      setRequestRejectionModalVisible(false);
      showAlert('Request Rejected', 'The support request has been rejected.');
      queryClient.invalidateQueries({ queryKey: ['supportRequests'] });
      queryClient.invalidateQueries({ queryKey: ['supportRequest', id] });
    } catch (err: any) {
      setRequestRejectionError(err?.message || 'Failed to reject support request.');
    } finally {
      setIsReviewing(false);
    }
  };

  // Support Need handlers
  const handleOpenAddNeedModal = () => {
    setEditingNeed(null);
    setNeedType('GOODS');
    setNeedName('');
    setNeedUnit('PIECE');
    setNeedQuantity('');
    setNeedError('');
    setNeedModalVisible(true);
  };

  const handleOpenEditNeedModal = (item: any) => {
    const originalNeed = needs.find(n => n.id === item.id);
    setEditingNeed(originalNeed || item);
    setNeedType(originalNeed?.supportType || 'GOODS');
    setNeedName(originalNeed?.needName || item.name);
    setNeedUnit(originalNeed?.unit || 'PIECE');
    setNeedQuantity(String(originalNeed?.requiredQuantity || item.neededQuantity || ''));
    setNeedError('');
    setNeedModalVisible(true);
  };

  const handleSaveNeed = async () => {
    if (!needName.trim()) {
      setNeedError('Item name is required');
      return;
    }
    const parsedQty = parseFloat(needQuantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setNeedError('Quantity must be greater than 0');
      return;
    }

    setIsNeedActionLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const payload = {
        supportType: needType,
        needName: needName.trim(),
        unit: needUnit,
        requiredQuantity: parsedQty,
      };

      if (editingNeed) {
        await updateSupportNeed(editingNeed.id, payload);
        showAlert('Success', 'Item updated successfully.');
      } else {
        await createSupportNeed(id, payload);
        showAlert('Success', 'Item added successfully.');
      }
      setNeedModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['supportNeeds', id] });
      queryClient.invalidateQueries({ queryKey: ['supportRequest', id] });
      queryClient.invalidateQueries({ queryKey: ['supportRequests'] });
    } catch (err: any) {
      setNeedError(err?.message || 'Failed to save needed item.');
    } finally {
      setIsNeedActionLoading(false);
    }
  };

  const handleDeleteNeed = async (needId: string) => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await deleteSupportNeed(needId);
      showAlert('Success', 'Item deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['supportNeeds', id] });
      queryClient.invalidateQueries({ queryKey: ['supportRequest', id] });
      queryClient.invalidateQueries({ queryKey: ['supportRequests'] });
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to delete needed item.');
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
    unit: need.unit,
  }));

  const isOwner = user && request && request.requesterId === user.id;
  const isStaff = user && (user.role === UserRole.ADMIN || user.role === UserRole.COLLABORATOR);
  const myAssignment = myAssignments.find((a) => a.supportRequestId === id) || requestAssignments.find(a => a.volunteerId === user?.id);
  const showApplicantsSection = (isOwner || isStaff);
  
  // Volunteer Apply: approved or in-progress support requests
  const showApplyToVolunteerButton = user?.role === UserRole.VOLUNTEER && !myAssignment && request && (request.status === 'APPROVED' || request.status === 'IN_PROGRESS');
  
  // Volunteer must be accepted, collaborator can always contribute
  const isVolunteerAccepted = user?.role === UserRole.VOLUNTEER && myAssignment && (myAssignment.status === 'ACCEPTED' || myAssignment.status === 'APPROVED' || myAssignment.status === 'IN_PROGRESS' || myAssignment.status === 'COMPLETED');
  const showHelpButton = !isOwner && mappedItems.length > 0 && request && (request.status === 'APPROVED' || request.status === 'IN_PROGRESS') && (
    isStaff || isVolunteerAccepted
  );

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
      await contribute({
        needId: itemId,
        data: {
          quantity,
          note: notes,
        },
      });
      setModalVisible(false);
      setSelectedItem(null);
      showAlert('Thank You', 'Your contribution has been recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['supportNeeds', id] });
      queryClient.invalidateQueries({ queryKey: ['supportRequest', id] });
      queryClient.invalidateQueries({ queryKey: ['supportRequests'] });
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to submit contribution.');
    }
  };

  if (isRequestLoading || isNeedsLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isRequestError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text, fontSize: 18 }}>Failed to load request details</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={[styles.container, { backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text, fontSize: 18 }}>Request not found</Text>
      </View>
    );
  }

  const urgencyValue: UrgencyLevel = request.urgency === 1 || request.urgency === 'HIGH' ? UrgencyLevel.HIGH :
                       request.urgency === 3 || request.urgency === 'LOW' ? UrgencyLevel.LOW :
                       UrgencyLevel.MEDIUM;

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG, flex: 1, height: (Platform.OS === 'web' ? '100vh' : '100%') as any }]}>
      {/* Header back button + title */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 8,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.appBG,
        }}
      >
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
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsMenuSheetVisible(true);
          }}
          style={({ pressed }) => [
            {
              padding: 8,
              borderRadius: 8,
            },
            pressed && { backgroundColor: theme.highlightBG },
          ]}
        >
          <MaterialIcons name="more-vert" size={24} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={localStyles.scrollContent}>
        <View style={[localStyles.card, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
          <Text style={[localStyles.title, { color: theme.text }]}>{request.title}</Text>

          <View style={localStyles.badgeContainer}>
            <View style={[localStyles.statusBadge, { backgroundColor: getStatusBg(request.status) }]}>
              <Text style={[localStyles.statusBadgeText, { color: getStatusText(request.status) }]}>
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <Text style={[localStyles.sectionTitle, { color: theme.text, marginTop: 0 }]}>Needed Items</Text>
            {isOwner && (request.status === 'PENDING' || request.status === 'APPROVED') && (
              <Pressable
                onPress={handleOpenAddNeedModal}
                style={({ pressed }) => [
                  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: theme.highlightBG },
                  pressed && { opacity: 0.8 }
                ]}
              >
                <MaterialIcons name="add" size={16} color={theme.primary} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}>Add Item</Text>
              </Pressable>
            )}
          </View>

          <View style={localStyles.itemsContainer}>
            {mappedItems.length > 0 ? (
              mappedItems.map((item) => {
                const canInteract = showHelpButton || (isOwner && (request.status === 'PENDING' || request.status === 'APPROVED'));
                const isCompleted = request.status === 'COMPLETED' || request.status === 'FULFILLED' || String(request.status).toUpperCase() === 'COMPLETED' || String(request.status).toUpperCase() === 'FULFILLED';
                if (canInteract) {
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        if (isOwner && (request.status === 'PENDING' || request.status === 'APPROVED')) {
                          handleOpenEditNeedModal(item);
                        } else if (showHelpButton) {
                          setSelectedItem(item);
                          setModalVisible(true);
                        }
                      }}
                      style={({ pressed }) => [
                        pressed && { opacity: 0.7 }
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <SupportItemProgress item={item} isCompleted={isCompleted} />
                        </View>
                        {isOwner && (request.status === 'PENDING' || request.status === 'APPROVED') && (
                          <View style={{ flexDirection: 'row', gap: 8, marginLeft: 8 }}>
                            <Pressable onPress={() => handleOpenEditNeedModal(item)} style={{ padding: 4 }}>
                              <MaterialIcons name="edit" size={20} color={theme.primary} />
                            </Pressable>
                            <Pressable onPress={() => handleDeleteNeed(item.id)} style={{ padding: 4 }}>
                              <MaterialIcons name="delete" size={20} color={theme.danger} />
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                } else {
                  return (
                    <View key={item.id} style={{ paddingVertical: 4 }}>
                      <SupportItemProgress item={item} isCompleted={isCompleted} />
                    </View>
                  );
                }
              })
            ) : (
              <Text style={{ color: theme.textSupporting, fontStyle: 'italic' }}>No items requested.</Text>
            )}
          </View>
        </View>

        {/* Support Request Review Panel (For Staff) */}
        {request.status === 'PENDING' && isStaff && (
          <View style={[localStyles.card, { backgroundColor: theme.componentBG, borderColor: theme.border, marginTop: 16, gap: 12 }]}>
            <Text style={[localStyles.sectionTitle, { color: theme.text, marginTop: 0 }]}>
              Review Support Request
            </Text>
            <Text style={{ fontSize: 14, color: theme.textSupporting }}>
              As an Admin or Collaborator, you can approve or reject this pending support request.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
              <Pressable
                disabled={isReviewing}
                onPress={handleApproveRequest}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 8,
                    backgroundColor: '#E5F6EE',
                    borderWidth: 1,
                    borderColor: '#008040',
                    alignItems: 'center',
                    opacity: pressed || isReviewing ? 0.8 : 1,
                  }
                ]}
              >
                {isReviewing ? (
                  <ActivityIndicator color="#008040" />
                ) : (
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#008040' }}>Approve Request</Text>
                )}
              </Pressable>
              
              <Pressable
                disabled={isReviewing}
                onPress={handleOpenRequestRejectModal}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 8,
                    backgroundColor: '#FFE5E5',
                    borderWidth: 1,
                    borderColor: '#CC0000',
                    alignItems: 'center',
                    opacity: pressed || isReviewing ? 0.8 : 1,
                  }
                ]}
              >
                {isReviewing ? (
                  <ActivityIndicator color="#CC0000" />
                ) : (
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#CC0000' }}>Reject Request</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

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
                <View style={[localStyles.statusBadge, { backgroundColor: getStatusBg(myAssignment.status) }]}>
                  <Text style={[localStyles.statusBadgeText, { color: getStatusText(myAssignment.status) }]}>
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
                  <Pressable
                    key={assignment.id}
                    onPress={() => handleApplicantPress(assignment.volunteerId)}
                    style={({ pressed }) => [
                      {
                        padding: 14,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.border,
                        backgroundColor: theme.highlightBG,
                        opacity: pressed ? 0.9 : 1,
                      }
                    ]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                        {assignment.volunteerName}
                      </Text>
                      <View style={[localStyles.statusBadge, { backgroundColor: getStatusBg(assignment.status) }]}>
                        <Text style={[localStyles.statusBadgeText, { color: getStatusText(assignment.status) }]}>
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
                          onPress={(e) => {
                            e.stopPropagation();
                            handleApproveVolunteer(assignment.volunteerId);
                          }}
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
                          onPress={(e) => {
                            e.stopPropagation();
                            handleOpenRejectModal(assignment);
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#CC0000' }}>Reject</Text>
                        </Pressable>
                      </View>
                    )}
                  </Pressable>
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

      {/* Volunteer Rejection Reason Modal */}
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

      {/* Support Request Rejection Reason Modal */}
      <Modal
        visible={requestRejectionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRequestRejectionModalVisible(false)}
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
              Reject Support Request
            </Text>
            
            <Text style={{ fontSize: 14, color: theme.textSupporting, marginBottom: 16 }}>
              Please provide a reason for rejecting this support request.
            </Text>
            
            <TextInput
              label="Rejection Reason"
              value={requestRejectionReason}
              onChangeText={(text) => {
                setRequestRejectionReason(text);
                if (text.trim()) setRequestRejectionError('');
              }}
              errorText={requestRejectionError}
              multiline
              numberOfLines={3}
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
                  setRequestRejectionModalVisible(false);
                  setRequestRejectionReason('');
                  setRequestRejectionError('');
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
                onPress={handleConfirmRequestReject}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Submit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Support Need Add / Edit Modal */}
      <Modal
        visible={needModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNeedModalVisible(false)}
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
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>
              {editingNeed ? 'Edit Needed Item' : 'Add Needed Item'}
            </Text>
            
            {needError ? (
              <View style={{ backgroundColor: theme.danger + '15', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.danger, marginBottom: 12 }}>
                <Text style={{ color: theme.danger, fontSize: 13 }}>{needError}</Text>
              </View>
            ) : null}

            {/* Type selector (MONEY or GOODS) */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: theme.textSupporting, marginBottom: 6 }}>Support Type</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {(['GOODS', 'MONEY'] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setNeedType(t)}
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 8,
                        borderWidth: 1.5,
                        borderColor: needType === t ? theme.primary : theme.border,
                        backgroundColor: needType === t ? theme.highlightBG : theme.componentBG,
                        alignItems: 'center',
                      },
                      pressed && { opacity: 0.8 }
                    ]}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: needType === t ? theme.primary : theme.textSupporting }}>
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <TextInput
              label="Item Name"
              value={needName}
              onChangeText={(text) => {
                setNeedName(text);
                if (text.trim()) setNeedError('');
              }}
            />

            <TextInput
              label="Unit"
              value={needUnit}
              onChangeText={setNeedUnit}
            />

            <TextInput
              label="Required Quantity"
              value={needQuantity}
              onChangeText={(text) => {
                setNeedQuantity(text);
                if (text.trim()) setNeedError('');
              }}
              keyboardType="numeric"
            />
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
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
                  setNeedModalVisible(false);
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textSupporting }}>Cancel</Text>
              </Pressable>
              
              <Pressable
                disabled={isNeedActionLoading}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 8,
                    backgroundColor: theme.primary,
                    alignItems: 'center',
                    opacity: pressed || isNeedActionLoading ? 0.8 : 1,
                  }
                ]}
                onPress={handleSaveNeed}
              >
                {isNeedActionLoading ? (
                  <ActivityIndicator color={theme.textLight} />
                ) : (
                  <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textLight }}>Save</Text>
                )}
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

      {/* Profile Details Bottom Sheet */}
      <BottomSheet isVisible={isProfileVisible} onClose={() => setIsProfileVisible(false)}>
        {isProfileLoading ? (
          <View style={{ padding: 40, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : profileData ? (
          <View style={{ padding: 24, alignItems: 'center', gap: 16 }}>
            {/* Avatar */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: theme.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '700' }}>
                {profileData.fullName?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>

            {/* User Info */}
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>
                {profileData.fullName}
              </Text>
              <Text style={{ fontSize: 14, color: theme.textSupporting, marginTop: 4 }}>
                Volunteer Applicant
              </Text>
            </View>

            {/* Details Fields */}
            <View
              style={{
                width: '100%',
                backgroundColor: theme.appBG,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: theme.border,
                gap: 12,
                marginTop: 8,
              }}
            >
              <View>
                <Text style={{ fontSize: 11, color: theme.textSupporting, textTransform: 'uppercase', fontWeight: '600' }}>
                  Email Address
                </Text>
                <Text style={{ fontSize: 14, color: theme.text, marginTop: 2, fontWeight: '500' }}>
                  {profileData.email || 'N/A'}
                </Text>
              </View>
              <View style={{ height: 1, backgroundColor: theme.border }} />
              <View>
                <Text style={{ fontSize: 11, color: theme.textSupporting, textTransform: 'uppercase', fontWeight: '600' }}>
                  Phone Number
                </Text>
                <Text style={{ fontSize: 14, color: theme.text, marginTop: 2, fontWeight: '500' }}>
                  {profileData.phone || 'N/A'}
                </Text>
              </View>
            </View>

            {/* Direct Message Action */}
            <Pressable
              style={({ pressed }) => [
                {
                  width: '100%',
                  paddingVertical: 14,
                  borderRadius: 24,
                  backgroundColor: pressed ? theme.primaryPressed : theme.primary,
                  alignItems: 'center',
                  marginTop: 12,
                  opacity: chatLoading ? 0.8 : 1,
                }
              ]}
              onPress={handleDirectMessage}
              disabled={chatLoading}
            >
              {chatLoading ? (
                <ActivityIndicator color={theme.textLight} />
              ) : (
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textLight }}>
                  Message Chat
                </Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: theme.textSupporting }}>Could not load profile details.</Text>
          </View>
        )}
      </BottomSheet>

      {/* Options Menu BottomSheet */}
      <BottomSheet
        isVisible={isMenuSheetVisible}
        onClose={() => setIsMenuSheetVisible(false)}
        title="Options"
        options={[
          {
            key: 'share',
            label: 'Share Request',
            icon: 'share',
            onPress: () => {
              setIsMenuSheetVisible(false);
              // Defer opening of the next sheet to prevent React Native modal conflict
              setTimeout(() => {
                setIsShareSheetVisible(true);
              }, 400);
            },
          },
          ...(!isOwner ? [{
            key: 'report',
            label: 'Report Request',
            icon: 'flag' as any,
            onPress: () => {
              setIsMenuSheetVisible(false);
              setTimeout(() => {
                setIsReportModalVisible(true);
              }, 400);
            },
          }] : []),
        ]}
      />

      <ReportModal
        visible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
        targetType={ReportTargetType.SUPPORT_REQUEST}
        targetId={id}
        targetName={request?.title || 'Help Request'}
        onSuccessSubmit={() => {
          showAlert('Report Submitted', 'Your report has been submitted to administrators for review.');
        }}
      />

      {/* Share Target BottomSheet */}
      <BottomSheet
        isVisible={isShareSheetVisible}
        onClose={() => setIsShareSheetVisible(false)}
        title="Share Request"
      >
        <View style={{ paddingBottom: 24, maxHeight: 400, width: '100%' }}>
          {isConversationsLoading ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 20 }} />
          ) : conversations.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: theme.textSupporting, textAlign: 'center' }}>No active chats found</Text>
            </View>
          ) : (
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
              {conversations.map((c: any) => {
                const otherMember = c.members?.find((m: any) => m.userId !== user?.id);
                const chatName = otherMember?.fullName || 'Người dùng';
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => handleShareRequest(c.id)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 14,
                      paddingHorizontal: 20,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.border,
                      backgroundColor: pressed ? theme.activeComponentBG : 'transparent',
                    })}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: theme.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ color: theme.textSupporting, fontSize: 14, fontWeight: '700' }}>
                        {chatName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '500' }}>
                      {chatName}
                    </Text>
                    <MaterialIcons name="send" size={18} color={theme.primary} />
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </BottomSheet>

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
    fontWeight: 'bold',
    lineHeight: 32,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  itemsContainer: {
    gap: 12,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'transparent',
  },
  helpButton: {
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  helpButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});