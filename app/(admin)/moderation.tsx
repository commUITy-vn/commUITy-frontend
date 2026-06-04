import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Platform, ActivityIndicator, Modal } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { BorderRadius, Spacing } from '@/constants/theme';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import { ConfirmModal, BottomSheet } from '@/components/ui';
import { getUser } from '@/features/users/api/get-user';
import { createPrivateConversation } from '@/features/communication/api/create-private-conversation';
import { usePosts } from '@/features/community/hooks/usePosts';

// Support requests hooks & api
import { useSupportRequests } from '@/features/support/hooks/useSupportRequests';
import { approveSupportRequest } from '@/features/support/api/approve-support-request';
import { rejectSupportRequest } from '@/features/support/api/reject-support-request';
import { getSupportRequestById } from '@/features/support/api/get-support-request-by-id';

// Reports hooks & api
import { usePendingReports } from '@/features/reports/hooks/usePendingReports';
import { useReviewReport } from '@/features/reports/hooks/useReviewReport';
import { useResolveReport } from '@/features/reports/hooks/useResolveReport';
import { useReportDetail } from '@/features/reports/hooks/useReportDetail';
import { ReportTargetType } from '@/features/reports/types/reports.types';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import {
  useAdminMoneyTransferTickets,
  useRejectMoneyTransferTicket,
  useResolveMoneyTransferTicket,
} from '@/features/money-transfer/hooks';
import type { MoneyTransferTicketResponse } from '@/features/money-transfer/types';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';

const formatQueueDateTime = (value?: string) => {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ModerationScreen() {
  const theme = useTheme();
  const styles = useThemeStyles();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { data: postsData } = usePosts();
  const posts = useMemo(
    () => (Array.isArray(postsData) ? postsData : []),
    [postsData],
  );
  const [tab, setTab] = useState<'pending' | 'reports' | 'transfers'>('pending');

  // Queries
  const { 
    data: pendingRequests, 
    isLoading: isPendingRequestsLoading, 
    isError: isPendingRequestsError, 
    refetch: refetchPendingRequests 
  } = useSupportRequests('PENDING');
  
  const { 
    data: pendingReports, 
    isLoading: isPendingReportsLoading, 
    isError: isPendingReportsError, 
    refetch: refetchPendingReports 
  } = usePendingReports();
  const {
    data: pendingTransferTickets,
    isLoading: isPendingTransfersLoading,
    isError: isPendingTransfersError,
    refetch: refetchPendingTransfers,
  } = useAdminMoneyTransferTickets('PENDING');

  const pendingRequestDetailQueries = useQueries({
    queries: (pendingRequests || []).map((request: any) => ({
      queryKey: ['supportRequest', request.id],
      queryFn: () => getSupportRequestById(request.id),
      enabled: !!request.id,
      retry: false,
    })),
  });

  const pendingRequestDetailById = useMemo(() => {
    const details = new Map<string, any>();
    (pendingRequests || []).forEach((request: any, index: number) => {
      const detail = pendingRequestDetailQueries[index]?.data;
      if (detail) details.set(request.id, detail);
    });
    return details;
  }, [pendingRequests, pendingRequestDetailQueries]);

  const reportTargetQueries = useQueries({
    queries: (pendingReports || [])
      .filter((report: any) => report.targetType !== ReportTargetType.POST)
      .map((report: any) => ({
        queryKey: ['reportTarget', report.targetType, report.targetId],
        queryFn: () => {
          if (report.targetType === ReportTargetType.USER) {
            return getUser(report.targetId);
          }
          if (report.targetType === ReportTargetType.SUPPORT_REQUEST) {
            return getSupportRequestById(report.targetId);
          }
          return Promise.resolve(null);
        },
        enabled: !!report.targetId,
        retry: false,
      })),
  });

  const reportTargetLabelById = useMemo(() => {
    const labels = new Map<string, string>();
    let queryIndex = 0;

    (pendingReports || []).forEach((report: any) => {
      if (report.targetType === ReportTargetType.POST) {
        const post = (posts || []).find((item: any) => item.id === report.targetId);
        const postContent = post?.content ? String(post.content) : '';
        const content = postContent ? `"${postContent.slice(0, 60)}${postContent.length > 60 ? '...' : ''}"` : 'Community post';
        const author = post?.author || post?.authorName || post?.userName;
        labels.set(report.id, author ? `Post: ${content} by ${author}` : `Post: ${content}`);
        return;
      }

      const target = reportTargetQueries[queryIndex]?.data as any;
      queryIndex += 1;
      if (report.targetType === ReportTargetType.USER) {
        labels.set(report.id, `User: ${target?.fullName || target?.email || 'Unknown user'}`);
        return;
      }
      if (report.targetType === ReportTargetType.SUPPORT_REQUEST) {
        labels.set(report.id, `Support request: ${target?.title || 'Unknown request'}`);
        return;
      }
      labels.set(report.id, `Target: ${String(report.targetId).slice(0, 8)}`);
    });

    return labels;
  }, [pendingReports, posts, reportTargetQueries]);

  // Action mutations states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  // Custom Modal States
  const [supportRequestModal, setSupportRequestModal] = useState<{
    visible: boolean;
    requestId: string;
    requestTitle: string;
    rejectionReason: string;
    errorText: string;
  }>({
    visible: false,
    requestId: '',
    requestTitle: '',
    rejectionReason: '',
    errorText: '',
  });

  const [reportModal, setReportModal] = useState<{
    visible: boolean;
    reportId: string;
    reporterName: string;
    targetType: ReportTargetType | null;
    actionType: 'resolve' | 'review' | null;
    resolutionNote: string;
    rejectionReason: string; // for resolving support request target
    errorText: string;
  }>({
    visible: false,
    reportId: '',
    reporterName: '',
    targetType: null,
    actionType: null,
    resolutionNote: '',
    rejectionReason: '',
    errorText: '',
  });

  const [alertModal, setAlertModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [activeModal, setActiveModal] = useState<'detail' | 'resolve' | 'review' | 'reject_support_request' | 'resolve_transfer' | 'reject_transfer' | null>(null);
  const [transferModal, setTransferModal] = useState<{
    ticket: MoneyTransferTicketResponse | null;
    adminNote: string;
    rejectionReason: string;
    proofFile: ({ uri: string; name: string; type: string } | File) | null;
    proofName: string;
    errorText: string;
  }>({
    ticket: null,
    adminNote: '',
    rejectionReason: '',
    proofFile: null,
    proofName: '',
    errorText: '',
  });

  // Fetch report details
  const { 
    data: reportDetail, 
    isLoading: isDetailLoading, 
    isError: isDetailError,
  } = useReportDetail(selectedReportId || '');

  // Profile bottom sheet states
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [isProfileSheetVisible, setIsProfileSheetVisible] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const handleReporterPress = async (userId: string) => {
    setSelectedProfileUserId(userId);
    setIsProfileSheetVisible(true);
    setIsProfileLoading(true);
    setProfileData(null);
    try {
      const res = await getUser(userId);
      setProfileData(res);
    } catch (err) {
      console.warn('Failed to fetch reporter profile:', err);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleDirectMessage = async () => {
    if (!selectedProfileUserId) return;
    if (String(selectedProfileUserId) === String(user?.id)) {
      showAlert('Direct message unavailable', 'You cannot create a direct message with yourself.');
      return;
    }
    setChatLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProfileSheetVisible(false);
    setIsDetailModalVisible(false);

    try {
      const res: any = await createPrivateConversation({ receiverId: selectedProfileUserId });
      const conversationId = res?.id || res?.data?.id;
      if (conversationId) {
        requestAnimationFrame(() => {
          router.push({ pathname: '/messages/[id]', params: { id: conversationId } } as any);
        });
      }
    } catch (err) {
      console.error('Failed to create private conversation:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const showAlert = (title: string, message: string) => {
    setAlertModal({ visible: true, title, message });
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleNavigateToTarget = async (type: ReportTargetType, targetId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (type) {
      case ReportTargetType.SUPPORT_REQUEST:
        router.push({ pathname: '/request/[id]', params: { id: targetId } } as any);
        break;
      case ReportTargetType.USER:
        router.push({ pathname: '/profile/[userId]', params: { userId: targetId } } as any);
        break;
      case ReportTargetType.POST:
        router.push('/explore');
        break;
      default:
        break;
    }
  };

  // ----------------------------------------------------
  // Pending Requests Actions
  // ----------------------------------------------------
  const handleApproveRequest = async (id: string) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setActionLoadingId(id);
    try {
      await approveSupportRequest(id);
      showAlert('Approved', 'Support request approved successfully!');
      queryClient.invalidateQueries({ queryKey: ['supportRequests'] });
      refetchPendingRequests();
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to approve request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRequestRejectModal = (id: string, title: string) => {
    setSupportRequestModal({
      visible: true,
      requestId: id,
      requestTitle: title,
      rejectionReason: '',
      errorText: '',
    });
    setActiveModal('reject_support_request');
  };

  const handleConfirmRequestReject = async () => {
    const { requestId, rejectionReason } = supportRequestModal;
    if (!rejectionReason.trim()) {
      setSupportRequestModal(prev => ({ ...prev, errorText: 'Rejection reason is required' }));
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setActionLoadingId(requestId);
    setSupportRequestModal(prev => ({ ...prev, visible: false }));
    setActiveModal(null);
    
    try {
      await rejectSupportRequest(requestId, rejectionReason.trim());
      showAlert('Rejected', 'Support request has been rejected.');
      queryClient.invalidateQueries({ queryKey: ['supportRequests'] });
      refetchPendingRequests();
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to reject request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ----------------------------------------------------
  // Reports Actions (Resolve / Review)
  // ----------------------------------------------------
  const reviewReportMutation = useReviewReport(reportModal.reportId);
  const resolveReportMutation = useResolveReport(reportModal.reportId);
  const rejectTransferTicketMutation = useRejectMoneyTransferTicket();
  const resolveTransferTicketMutation = useResolveMoneyTransferTicket();

  const handleOpenReportModal = (id: string, reporterName: string, targetType: ReportTargetType, actionType: 'resolve' | 'review') => {
    setReportModal({
      visible: true,
      reportId: id,
      reporterName,
      targetType,
      actionType,
      resolutionNote: '',
      rejectionReason: '',
      errorText: '',
    });
    setActiveModal(actionType === 'resolve' ? 'resolve' : 'review');
  };

  const handleConfirmReportAction = async () => {
    const { reportId, actionType, targetType, resolutionNote, rejectionReason } = reportModal;
    
    if (!resolutionNote.trim()) {
      setReportModal(prev => ({ ...prev, errorText: 'Resolution note is required' }));
      return;
    }

    if (actionType === 'resolve' && targetType === ReportTargetType.SUPPORT_REQUEST && !rejectionReason.trim()) {
      setReportModal(prev => ({ ...prev, errorText: 'Support request rejection reason is required' }));
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setActionLoadingId(reportId);
    setReportModal(prev => ({ ...prev, visible: false }));
    setActiveModal(null);

    try {
      if (actionType === 'resolve') {
        await resolveReportMutation.mutateAsync({
          resolutionNote: resolutionNote.trim(),
          supportRequestRejectionReason: targetType === ReportTargetType.SUPPORT_REQUEST ? rejectionReason.trim() : undefined,
        });
        showAlert('Resolved', 'User report resolved and moderation action applied!');
      } else {
        await reviewReportMutation.mutateAsync({
          resolutionNote: resolutionNote.trim(),
        });
        showAlert('Reviewed', 'User report dismissed and marked as reviewed.');
      }
      queryClient.invalidateQueries({ queryKey: ['pendingReports'] });
      queryClient.invalidateQueries({ queryKey: ['allReports'] });
      queryClient.invalidateQueries({ queryKey: ['supportRequests'] });
      refetchPendingReports();
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to complete report action.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenTransferModal = (ticket: MoneyTransferTicketResponse, action: 'resolve_transfer' | 'reject_transfer') => {
    setTransferModal({
      ticket,
      adminNote: '',
      rejectionReason: '',
      proofFile: null,
      proofName: '',
      errorText: '',
    });
    setActiveModal(action);
  };

  const handlePickTransferProof = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setTransferModal(prev => ({ ...prev, errorText: 'Photo access is required to attach proof.' }));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset: any = result.assets[0];
    const proofName = asset.fileName || `transfer-proof-${Date.now()}.jpg`;
    const proofType = asset.mimeType || 'image/jpeg';
    const proofFile =
      Platform.OS === 'web' && asset.file
        ? asset.file
        : {
            uri: asset.uri,
            name: proofName,
            type: proofType,
          };

    setTransferModal(prev => ({
      ...prev,
      proofFile,
      proofName,
      errorText: '',
    }));
  };

  const handleConfirmTransferAction = async () => {
    const ticket = transferModal.ticket;
    if (!ticket) return;

    if (activeModal === 'reject_transfer') {
      if (!transferModal.rejectionReason.trim()) {
        setTransferModal(prev => ({ ...prev, errorText: 'Rejection reason is required' }));
        return;
      }

      setActionLoadingId(ticket.id);
      try {
        await rejectTransferTicketMutation.mutateAsync({
          ticketId: ticket.id,
          rejectionReason: transferModal.rejectionReason.trim(),
        });
        showAlert('Rejected', 'Money transfer ticket rejected.');
        setActiveModal(null);
        refetchPendingTransfers();
      } catch (err: any) {
        showAlert('Error', err?.message || 'Failed to reject transfer ticket.');
      } finally {
        setActionLoadingId(null);
      }
      return;
    }

    if (!transferModal.proofFile) {
      setTransferModal(prev => ({ ...prev, errorText: 'Transfer proof image is required' }));
      return;
    }

    setActionLoadingId(ticket.id);
    try {
      await resolveTransferTicketMutation.mutateAsync({
        ticketId: ticket.id,
        proofFile: transferModal.proofFile,
        adminNote: transferModal.adminNote.trim() || undefined,
      });
      showAlert('Resolved', 'Money transfer ticket resolved with proof.');
      setActiveModal(null);
      refetchPendingTransfers();
    } catch (err: any) {
      const message = String(err?.message || '');
      showAlert(
        'Error',
        message.includes('Cloudinary') || message.includes('Failed to upload file')
          ? 'Transfer proof upload failed on the backend Cloudinary service. Please check backend Cloudinary credentials/API secret or Cloudinary URL, then try again.'
          : message || 'Failed to resolve transfer ticket.',
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Render items based on active tab
  const renderPendingRequestItem = ({ item }: { item: any }) => {
    const isLoading = actionLoadingId === item.id;
    const detail = pendingRequestDetailById.get(item.id);
    return (
      <View style={[localStyles.itemCard, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
        <View style={localStyles.cardHeader}>
          <MaterialIcons
            name="volunteer-activism"
            size={20}
            color={theme.primary}
          />
          <Text style={[localStyles.itemTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
        </View>
        
        <Text style={[localStyles.itemDesc, { color: theme.textSupporting }]}>
          {detail?.description || item.description || 'No description provided'}
        </Text>

        <View style={[localStyles.metaInfo, { backgroundColor: theme.highlightBG }]}>
          <Text style={localStyles.metaLine} numberOfLines={1}>
            Requester: {detail?.requesterName || item.requesterName || 'Unknown'}
          </Text>
          <Text style={localStyles.metaLine} numberOfLines={1}>
            Category: {detail?.categoryName || item.categoryName || 'Uncategorized'}
          </Text>
          <Text style={[localStyles.metaLine, { fontWeight: '700' }]} numberOfLines={1}>
            Submitted: {formatQueueDateTime(detail?.createdAt || item.createdAt)}
          </Text>
        </View>

        <View style={[localStyles.actionsRow, { borderTopColor: theme.border }]}>
          <Pressable
            disabled={isLoading}
            onPress={() => handleApproveRequest(item.id)}
            style={({ pressed }) => [
              localStyles.actionBtn,
              {
                backgroundColor: '#E5F6EE',
                borderColor: '#008040',
                opacity: pressed || isLoading ? 0.8 : 1,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#008040" />
            ) : (
              <>
                <MaterialIcons name="check" size={18} color="#008040" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#008040' }}>Approve</Text>
              </>
            )}
          </Pressable>
          
          <Pressable
            disabled={isLoading}
            onPress={() => handleOpenRequestRejectModal(item.id, item.title)}
            style={({ pressed }) => [
              localStyles.actionBtn,
              {
                backgroundColor: '#FFE5E5',
                borderColor: theme.danger,
                opacity: pressed || isLoading ? 0.8 : 1,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.danger} />
            ) : (
              <>
                <MaterialIcons name="close" size={18} color={theme.danger} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.danger }}>Reject</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  const getTargetTypeLabel = (type: ReportTargetType) => {
    switch (type) {
      case ReportTargetType.SUPPORT_REQUEST:
        return 'Help Request';
      case ReportTargetType.POST:
        return 'Community Post';
      case ReportTargetType.USER:
        return 'User Profile';
      default:
        return 'Item';
    }
  };

  const getTargetIcon = (type: ReportTargetType) => {
    switch (type) {
      case ReportTargetType.SUPPORT_REQUEST:
        return 'support';
      case ReportTargetType.POST:
        return 'article';
      case ReportTargetType.USER:
        return 'person';
      default:
        return 'warning';
    }
  };

  const handlePressReportCard = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedReportId(id);
    setActiveModal('detail');
  };

  const renderReportItem = ({ item }: { item: any }) => {
    const isLoading = actionLoadingId === item.id;
    return (
      <Pressable
        onPress={() => handlePressReportCard(item.id)}
        style={({ pressed }) => [
          localStyles.itemCard,
          { backgroundColor: theme.componentBG, borderColor: theme.border, opacity: pressed ? 0.85 : 1 }
        ]}
      >
        <View style={localStyles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <MaterialIcons
              name={getTargetIcon(item.targetType)}
              size={18}
              color={theme.primary}
            />
            <Text style={[localStyles.itemTitle, { color: theme.text }]} numberOfLines={1}>
              Report targeting: {getTargetTypeLabel(item.targetType)}
            </Text>
          </View>
          <View
            style={[
              localStyles.statusBadge,
              {
                backgroundColor: '#FFF4E5',
                borderColor: '#FFE6CC',
              },
            ]}
          >
            <Text style={[localStyles.statusText, { color: '#B35900' }]}>
              {item.status}
            </Text>
          </View>
        </View>
        
        <Text style={[localStyles.itemDesc, { color: theme.text }]} numberOfLines={2}>
          <Text style={{ fontWeight: '700', color: theme.textSupporting }}>Reason: </Text>
          {item.reason || 'No reason provided'}
        </Text>

        <Text style={[localStyles.itemDesc, { color: theme.textSupporting }]} numberOfLines={2}>
          {reportTargetLabelById.get(item.id) || `Target: ${String(item.targetId).slice(0, 8)}`}
        </Text>

        {/* Reporter clickable profile link */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation(); // Stop parent press card details modal
            handleReporterPress(item.reporterId);
          }}
          style={({ pressed }) => [
            localStyles.metaInfo,
            { backgroundColor: theme.highlightBG, marginTop: 4, opacity: pressed ? 0.75 : 1 }
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <MaterialIcons name="person" size={16} color={theme.primary} />
              <Text style={{ fontSize: 13, color: theme.textSupporting }} numberOfLines={1}>
                Reporter: <Text style={{ fontWeight: '700', color: theme.primary }}>{item.reporterName}</Text>
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '600' }}>View Profile</Text>
              <MaterialIcons name="chevron-right" size={16} color={theme.primary} />
            </View>
          </View>
          <Text style={[localStyles.metaLine, { marginTop: 6, fontWeight: '700' }]} numberOfLines={1}>
            Submitted: {formatQueueDateTime(item.createdAt)}
          </Text>
        </Pressable>

        {/* Quick action buttons directly on card */}
        <View style={[localStyles.actionsRow, { borderTopColor: theme.border, marginTop: 8 }]}>
          <Pressable
            disabled={isLoading}
            onPress={(e) => {
              e.stopPropagation(); // Stop card press
              handleOpenReportModal(item.id, item.reporterName, item.targetType, 'resolve');
            }}
            style={({ pressed }) => [
              localStyles.actionBtn,
              {
                backgroundColor: '#E5F6EE',
                borderColor: '#008040',
                opacity: pressed || isLoading ? 0.8 : 1,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#008040" />
            ) : (
              <>
                <MaterialIcons name="gavel" size={18} color="#008040" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#008040' }}>Resolve</Text>
              </>
            )}
          </Pressable>
          
          <Pressable
            disabled={isLoading}
            onPress={(e) => {
              e.stopPropagation(); // Stop card press
              handleOpenReportModal(item.id, item.reporterName, item.targetType, 'review');
            }}
            style={({ pressed }) => [
              localStyles.actionBtn,
              {
                backgroundColor: '#FFF4E5',
                borderColor: '#B35900',
                opacity: pressed || isLoading ? 0.8 : 1,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#B35900" />
            ) : (
              <>
                <MaterialIcons name="remove-red-eye" size={18} color="#B35900" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#B35900' }}>Review Report</Text>
              </>
            )}
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderTransferTicketItem = ({ item }: { item: MoneyTransferTicketResponse }) => {
    const isLoading = actionLoadingId === item.id;
    return (
      <View style={[localStyles.itemCard, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
        <View style={localStyles.cardHeader}>
          <MaterialIcons name="payments" size={20} color={theme.primary} />
          <Text style={[localStyles.itemTitle, { color: theme.text }]} numberOfLines={1}>
            {item.sourceName || 'Money transfer request'}
          </Text>
          <View style={[localStyles.statusBadge, { backgroundColor: '#FFF4E5', borderColor: '#FFE6CC' }]}>
            <Text style={[localStyles.statusText, { color: '#B35900' }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={[localStyles.itemDesc, { color: theme.text }]}>
          ₫{Number(item.amount || 0).toLocaleString()} from {item.sourceType === 'COMMUNITY_FUND' ? 'community fund' : 'support need'}
        </Text>
        <Text style={[localStyles.itemDesc, { color: theme.textSupporting }]} numberOfLines={2}>
          {item.reason || 'No reason provided'}
        </Text>

        <View style={[localStyles.metaInfo, { backgroundColor: theme.highlightBG }]}>
          <Text style={localStyles.metaLine} numberOfLines={1}>
            Requester: {item.requesterName || 'Unknown'}
          </Text>
          <Text style={[localStyles.metaLine, { fontWeight: '700' }]} numberOfLines={1}>
            Submitted: {formatQueueDateTime(item.createdAt)}
          </Text>
        </View>

        <View style={[localStyles.actionsRow, { borderTopColor: theme.border, marginTop: 8 }]}>
          <Pressable
            disabled={isLoading}
            onPress={() => handleOpenTransferModal(item, 'resolve_transfer')}
            style={({ pressed }) => [
              localStyles.actionBtn,
              {
                backgroundColor: '#E5F6EE',
                borderColor: '#008040',
                opacity: pressed || isLoading ? 0.8 : 1,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#008040" />
            ) : (
              <>
                <MaterialIcons name="check" size={18} color="#008040" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#008040' }}>Resolve</Text>
              </>
            )}
          </Pressable>

          <Pressable
            disabled={isLoading}
            onPress={() => handleOpenTransferModal(item, 'reject_transfer')}
            style={({ pressed }) => [
              localStyles.actionBtn,
              {
                backgroundColor: '#FFE5E5',
                borderColor: theme.danger,
                opacity: pressed || isLoading ? 0.8 : 1,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.danger} />
            ) : (
              <>
                <MaterialIcons name="close" size={18} color={theme.danger} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.danger }}>Reject</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  const isDataLoading = tab === 'pending'
    ? isPendingRequestsLoading
    : tab === 'reports'
      ? isPendingReportsLoading
      : isPendingTransfersLoading;
  const isDataError = tab === 'pending'
    ? isPendingRequestsError
    : tab === 'reports'
      ? isPendingReportsError
      : isPendingTransfersError;
  const activeData = tab === 'pending'
    ? pendingRequests
    : tab === 'reports'
      ? pendingReports
      : pendingTransferTickets;

  return (
    <View style={[localStyles.container, { backgroundColor: theme.appBG }]}>
      {/* Header */}
      <View style={[localStyles.headerBlock, { borderBottomColor: theme.border }]}>

        <Pressable onPress={handleBack} style={localStyles.backButton}>
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[localStyles.headerTitle, { color: theme.text }]}>Moderation Queue</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Modern Tabs */}
      <View style={[localStyles.tabBar, { borderBottomColor: theme.border, backgroundColor: theme.componentBG }]}>
        {[
          { key: 'pending' as const, label: 'Requests', count: (pendingRequests || []).length },
          { key: 'reports' as const, label: 'Reports', count: (pendingReports || []).length },
          { key: 'transfers' as const, label: 'Transfers', count: (pendingTransferTickets || []).length },
        ].map((item) => {
          const active = tab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTab(item.key);
              }}
              style={[
                localStyles.tab,
                {
                  backgroundColor: active ? theme.primary : 'transparent',
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}
            >
              <Text style={[localStyles.tabText, { color: active ? '#FFFFFF' : theme.textSupporting }]}>
                {item.label}
              </Text>
              <View style={[localStyles.tabCountBadge, { backgroundColor: active ? 'rgba(255,255,255,0.22)' : theme.highlightBG }]}>
                <Text style={[localStyles.tabCountText, { color: active ? '#FFFFFF' : theme.text }]}>
                  {item.count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {isDataLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : isDataError ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <MaterialIcons name="error-outline" size={48} color={theme.danger} style={{ marginBottom: 12 }} />
          <Text style={{ textAlign: "center", color: theme.textSupporting, fontSize: 16 }}>
            Failed to fetch moderation queue from the backend.
          </Text>
        </View>
      ) : (
        <FlatList<any>
          data={activeData || []}
          keyExtractor={(item) => item.id}
          renderItem={
            tab === 'pending'
              ? renderPendingRequestItem
              : tab === 'reports'
                ? renderReportItem
                : renderTransferTicketItem
          }
          contentContainerStyle={localStyles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={localStyles.emptyContainer}>
              <MaterialIcons name="check-circle-outline" size={48} color={theme.textSupporting} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginTop: 12 }}>All Clear!</Text>
              <Text style={{ fontSize: 14, color: theme.textSupporting, marginTop: 4, textAlign: 'center' }}>
                No items require moderation in this queue.
              </Text>
            </View>
          )}
        />
      )}

      {/* Unified Moderation Actions Modal */}
      <Modal
        visible={activeModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={localStyles.modalOverlay}>
          {activeModal === 'reject_support_request' && (
            <View style={[localStyles.modalContent, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
              <Text style={[localStyles.modalTitle, { color: theme.text }]}>Reject Support Request</Text>
              <Text style={{ fontSize: 14, color: theme.textSupporting, marginBottom: 16 }}>
                Provide a reason for rejecting the request: {"\""}{supportRequestModal.requestTitle}{"\""}
              </Text>
              
              <TextInput
                label="Rejection Reason"
                value={supportRequestModal.rejectionReason}
                onChangeText={(text) => setSupportRequestModal(prev => ({ ...prev, rejectionReason: text, errorText: '' }))}
                errorText={supportRequestModal.errorText}
                multiline
                height={100}
              />

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <Button
                  text="Reject Request"
                  onPress={handleConfirmRequestReject}
                  danger
                  style={{ flex: 1 }}
                />
                <Button
                  text="Cancel"
                  onPress={() => setActiveModal(null)}
                  style={{ flex: 1, backgroundColor: theme.highlightBG }}
                />
              </View>
            </View>
          )}

          {(activeModal === 'resolve' || activeModal === 'review') && (
            <View style={[localStyles.modalContent, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
              <Text style={[localStyles.modalTitle, { color: theme.text }]}>
                {activeModal === 'resolve' ? 'Resolve User Report' : 'Mark as Reviewed'}
              </Text>
              <Text style={{ fontSize: 14, color: theme.textSupporting, marginBottom: 16 }}>
                {activeModal === 'resolve' 
                  ? 'Resolving this report will apply the moderation action (deactivate Post/Request).'
                  : 'Marking this report as reviewed will close it without taking direct moderation action.'}
              </Text>

              {reportModal.errorText ? (
                <View style={{ backgroundColor: theme.danger + '15', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.danger, marginBottom: 12 }}>
                  <Text style={{ color: theme.danger, fontSize: 13 }}>{reportModal.errorText}</Text>
                </View>
              ) : null}

              {/* Resolution Note (Required) */}
              <TextInput
                label="Resolution Note"
                value={reportModal.resolutionNote}
                onChangeText={(text) => setReportModal(prev => ({ ...prev, resolutionNote: text, errorText: '' }))}
                multiline
                height={80}
              />

              {/* Support Request Rejection Reason (Required ONLY when resolving SUPPORT_REQUEST) */}
              {activeModal === 'resolve' && reportModal.targetType === ReportTargetType.SUPPORT_REQUEST && (
                <TextInput
                  label="Support Request Rejection Reason"
                  value={reportModal.rejectionReason}
                  onChangeText={(text) => setReportModal(prev => ({ ...prev, rejectionReason: text, errorText: '' }))}
                  multiline
                  height={80}
                />
              )}

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <Button
                  text={activeModal === 'resolve' ? 'Confirm Resolve' : 'Confirm Review'}
                  onPress={handleConfirmReportAction}
                  primary
                  style={{ flex: 1 }}
                />
                <Button
                  text="Cancel"
                  onPress={() => setActiveModal(null)}
                  style={{ flex: 1, backgroundColor: theme.highlightBG }}
                />
              </View>
            </View>
          )}

          {(activeModal === 'resolve_transfer' || activeModal === 'reject_transfer') && (
            <View style={[localStyles.modalContent, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
              <Text style={[localStyles.modalTitle, { color: theme.text }]}>
                {activeModal === 'resolve_transfer' ? 'Resolve Transfer Ticket' : 'Reject Transfer Ticket'}
              </Text>
              <Text style={{ fontSize: 14, color: theme.textSupporting, marginBottom: 8 }}>
                {transferModal.ticket?.sourceName || 'Money transfer'} • ₫{Number(transferModal.ticket?.amount || 0).toLocaleString()}
              </Text>

              {transferModal.errorText ? (
                <View style={{ backgroundColor: theme.danger + '15', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.danger, marginBottom: 12 }}>
                  <Text style={{ color: theme.danger, fontSize: 13 }}>{transferModal.errorText}</Text>
                </View>
              ) : null}

              {activeModal === 'resolve_transfer' ? (
                <>
                  <Pressable
                    onPress={handlePickTransferProof}
                    style={({ pressed }) => [
                      localStyles.targetInspectionBtn,
                      {
                        backgroundColor: pressed ? theme.border : theme.highlightBG,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <MaterialIcons name="image" size={20} color={theme.primary} />
                      <Text style={{ color: theme.text, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                        {transferModal.proofName || 'Attach transfer proof image'}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={18} color={theme.primary} />
                  </Pressable>

                  <TextInput
                    label="Admin Note"
                    value={transferModal.adminNote}
                    onChangeText={(text) => setTransferModal(prev => ({ ...prev, adminNote: text, errorText: '' }))}
                    multiline
                    height={80}
                  />
                </>
              ) : (
                <TextInput
                  label="Rejection Reason"
                  value={transferModal.rejectionReason}
                  onChangeText={(text) => setTransferModal(prev => ({ ...prev, rejectionReason: text, errorText: '' }))}
                  multiline
                  height={90}
                />
              )}

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <Button
                  text={activeModal === 'resolve_transfer' ? 'Confirm Resolve' : 'Confirm Reject'}
                  onPress={handleConfirmTransferAction}
                  primary={activeModal === 'resolve_transfer'}
                  danger={activeModal === 'reject_transfer'}
                  style={{ flex: 1 }}
                  isLoading={resolveTransferTicketMutation.isPending || rejectTransferTicketMutation.isPending}
                />
                <Button
                  text="Cancel"
                  onPress={() => setActiveModal(null)}
                  style={{ flex: 1, backgroundColor: theme.highlightBG }}
                />
              </View>
            </View>
          )}

          {activeModal === 'detail' && (
            <View style={[localStyles.modalContent, { backgroundColor: theme.componentBG, borderColor: theme.border, maxWidth: 450 }]}>
              {/* Header */}
              <View style={[localStyles.modalHeaderBlock, { borderBottomColor: theme.border }]}>
                <Text style={[localStyles.modalTitle, { color: theme.text }]}>Report Details</Text>
                <Pressable onPress={() => setActiveModal(null)} style={{ padding: 4 }}>
                  <MaterialIcons name="close" size={24} color={theme.text} />
                </Pressable>
              </View>

              {isDetailLoading ? (
                <View style={{ padding: 40, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={theme.primary} />
                </View>
              ) : isDetailError || !reportDetail ? (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <MaterialIcons name="error-outline" size={40} color={theme.danger} />
                  <Text style={{ color: theme.textSupporting, marginTop: 8, textAlign: 'center' }}>
                    Failed to fetch report details.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 14 }}>
                  {/* Status & Timing */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View
                      style={[
                        localStyles.statusBadge,
                        {
                          backgroundColor: '#FFF4E5',
                          borderColor: '#FFE6CC',
                        },
                      ]}
                    >
                      <Text style={[localStyles.statusText, { color: '#B35900' }]}>
                        {reportDetail.status}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.textSupporting }}>
                      {new Date(reportDetail.createdAt).toLocaleString()}
                    </Text>
                  </View>

                  {/* Reporter Info */}
                  <Pressable
                    onPress={() => {
                      setActiveModal(null);
                      setTimeout(() => {
                        handleReporterPress(reportDetail.reporterId);
                      }, 500);
                    }}
                    style={({ pressed }) => [
                      localStyles.detailField,
                      {
                        backgroundColor: theme.highlightBG,
                        borderColor: theme.border,
                        borderWidth: 1,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSupporting, textTransform: 'uppercase' }}>Reporter</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <MaterialIcons name="person" size={18} color={theme.primary} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, flex: 1 }}>{reportDetail.reporterName}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '600' }}>View Profile</Text>
                        <MaterialIcons name="chevron-right" size={16} color={theme.primary} />
                      </View>
                    </View>
                  </Pressable>

                  {/* Reason for reporting */}
                  <View style={[localStyles.detailField, { backgroundColor: theme.highlightBG, borderColor: theme.border, borderWidth: 1 }]}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSupporting, textTransform: 'uppercase' }}>Reason for Reporting</Text>
                    <Text style={{ fontSize: 14, color: theme.text, marginTop: 6, lineHeight: 20 }}>
                      {reportDetail.reason || 'No reason provided'}
                    </Text>
                  </View>

                  {/* Reported Target Inspection Button */}
                  <Pressable
                    onPress={() => {
                      setActiveModal(null);
                      setTimeout(() => {
                        handleNavigateToTarget(reportDetail.targetType, reportDetail.targetId);
                      }, 500);
                    }}
                    style={({ pressed }) => [
                      localStyles.targetInspectionBtn,
                      {
                        backgroundColor: theme.highlightBG,
                        borderColor: theme.border,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <MaterialIcons name={getTargetIcon(reportDetail.targetType)} size={20} color={theme.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSupporting, textTransform: 'uppercase' }}>
                          Target: {getTargetTypeLabel(reportDetail.targetType)}
                        </Text>
                        <Text style={{ fontSize: 13, color: theme.text, marginTop: 2 }} numberOfLines={1}>
                          {reportTargetLabelById.get(reportDetail.id) || String(reportDetail.targetId).slice(0, 8)}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '600' }}>Inspect</Text>
                      <MaterialIcons name="chevron-right" size={18} color={theme.primary} />
                    </View>
                  </Pressable>

                  {/* Actions row inside details if Pending */}
                  {reportDetail.status === 'PENDING' && (
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                      <Button
                        text="Resolve"
                        onPress={() => {
                          setReportModal({
                            visible: true,
                            reportId: reportDetail.id,
                            reporterName: reportDetail.reporterName,
                            targetType: reportDetail.targetType,
                            actionType: 'resolve',
                            resolutionNote: '',
                            rejectionReason: '',
                            errorText: '',
                          });
                          setActiveModal('resolve');
                        }}
                        primary
                        style={{ flex: 1 }}
                      />
                      <Button
                        text="Review Report"
                        onPress={() => {
                          setReportModal({
                            visible: true,
                            reportId: reportDetail.id,
                            reporterName: reportDetail.reporterName,
                            targetType: reportDetail.targetType,
                            actionType: 'review',
                            resolutionNote: '',
                            rejectionReason: '',
                            errorText: '',
                          });
                          setActiveModal('review');
                        }}
                        style={{ flex: 1, backgroundColor: theme.highlightBG }}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* Reporter Profile Details Bottom Sheet */}
      <BottomSheet isVisible={isProfileSheetVisible} onClose={() => setIsProfileSheetVisible(false)}>
        {isProfileLoading ? (
          <View style={{ padding: 40, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : profileData ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            {/* Avatar bubble */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.highlightBG,
                borderWidth: 2,
                borderColor: theme.border,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
                ...Platform.select({
                  ios: {
                    shadowColor: theme.inverse,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  },
                  android: {
                    elevation: 3,
                  },
                  default: {},
                }),
              }}
            >
              <Text style={{ color: theme.text, fontSize: 32, fontWeight: '700' }}>
                {profileData.fullName?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>

            {/* Name */}
            <Text
              style={{
                color: theme.text,
                fontSize: 22,
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: 6,
              }}
            >
              {profileData.fullName}
            </Text>

            {/* Role Tag */}
            <View
              style={{
                backgroundColor: theme.highlightBG,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 4,
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 12,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                }}
              >
                {profileData.role === 'ADMIN' ? 'Admin' : profileData.role === 'COLLABORATOR' ? 'Collaborator' : 'Volunteer'}
              </Text>
            </View>

            {/* Info fields */}
            <View
              style={{
                width: '100%',
                backgroundColor: theme.highlightBG,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 16,
                gap: 16,
                marginBottom: 24,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="email" size={20} color={theme.textSupporting} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textSupporting, fontSize: 12 }}>Email</Text>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
                    {profileData.email || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }} />

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="phone" size={20} color={theme.textSupporting} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textSupporting, fontSize: 12 }}>Phone</Text>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>
                    {profileData.phone || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>

            {/* DM Button */}
            {String(selectedProfileUserId) !== String(user?.id) && (
              <Button
                text="Direct Message"
                primary
                onPress={handleDirectMessage}
                style={{ width: '100%', borderRadius: 100 }}
                isLoading={chatLoading}
              />
            )}
          </View>
        ) : (
          <View style={{ padding: 40, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: theme.textSupporting }}>Could not load profile details.</Text>
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        paddingTop: 12,
      },
    }),
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
    gap: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
  },
  tabCountBadge: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  list: {
    padding: Spacing.base,
    gap: Spacing.base,
    paddingBottom: 40,
  },
  itemCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  itemDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaInfo: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 3,
  },
  metaLine: {
    fontSize: 12,
    color: '#64748B',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalHeaderBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  detailField: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  targetInspectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
