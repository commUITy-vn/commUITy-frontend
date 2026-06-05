import { BottomSheet, Button } from "@/components/ui";
import TextInput from "@/components/ui/TextInput";
import { MaterialIcons } from "@expo/vector-icons";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

let WebView: any;
if (Platform.OS !== "web") {
  WebView = require("react-native-webview").WebView;
}

const HERE_API_KEY = process.env.EXPO_PUBLIC_HERE_API_KEY || "";

import { useAuthStore } from "@/features/auth/stores/useAuthStore";
import { UserRole } from "@/features/auth/types";
import { geocodeAddress } from "@/features/maps/api/geocode-address";
import { useSupportLocations } from "@/features/maps/hooks/useSupportLocations";
import { assignSupportLocation } from "@/features/support/api/assign-support-location";
import { api } from "@/lib/api-client";
import {
  applyToSupportRequest,
  approveVolunteer,
  getAssignmentsBySupportRequest,
  getMyAssignments,
  rejectVolunteer,
  type VolunteerAssignment,
} from "@/features/support/api/volunteer-assignments";
import {
  ItemCategory,
  STATUS_LABELS,
  SupportStatus,
} from "@/features/support/types/support.types";
import { useTheme } from "@/hooks/useTheme";

// Hooks & API
import { deleteSupportNeed } from "@/features/support/api/delete-support-need";
import {
  getSupportNeedContributions,
  type SupportNeedContributionResponse,
} from "@/features/support/api/get-support-need-contributions";
import { updateSupportRequest } from "@/features/support/api/update-support-request";
import { ContributeItemModal } from "@/features/support/components/ContributeItemModal";
import { SupportNeedModal } from "@/features/support/components/SupportNeedModal";
import { useCategories } from "@/features/support/hooks/useCategories"; // Hook load categories động
import { useSupportNeeds } from "@/features/support/hooks/useSupportNeeds";
import { useSupportRequestById } from "@/features/support/hooks/useSupportRequestById";
import { ReportModal, ReportTargetType } from "@/features/reports";
import { useCreateSupportNeedTransferTicket } from "@/features/money-transfer/hooks";
import {
  createPayOsMobileRedirectUrls,
  getPayOsMobileCallbackUrl,
  getRouteFromPayOsRedirectUrl,
} from "@/features/finance/lib/payos-mobile";

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [isNeedModalVisible, setIsNeedModalVisible] = useState(false);
  const [isShareSheetVisible, setIsShareSheetVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState<any>(null);
  const [contributeNeed, setContributeNeed] = useState<any>(null);
  const [transferNeed, setTransferNeed] = useState<any>(null);
  const [historyNeed, setHistoryNeed] = useState<any>(null);
  const [rejectAssignment, setRejectAssignment] =
    useState<VolunteerAssignment | null>(null);
  const [assignmentRejectReason, setAssignmentRejectReason] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferError, setTransferError] = useState("");

  // States for Editable Fields
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("Select Category");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // States for Address Search
  const [address, setAddress] = useState("");
  const [latStr, setLatStr] = useState("10.8231");
  const [lngStr, setLngStr] = useState("106.6297");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isConversationsLoading, setIsConversationsLoading] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webViewRef = useRef<any>(null);

  // Data Fetching
  const {
    data: request,
    isLoading: requestLoading,
    refetch: refetchRequest,
  } = useSupportRequestById(id as string);
  const {
    needs,
    isLoading: needsLoading,
    contribute,
    createPayOsContribution,
  } = useSupportNeeds(id as string);
  const createSupportNeedTransferTicketMutation = useCreateSupportNeedTransferTicket(
    transferNeed?.id,
    id as string,
  );
  const { data: categories } = useCategories(true); // Fetch active categories from backend
  const { data: supportLocations = [] } = useSupportLocations();
  const { data: myVolunteerAssignments = [] } = useQuery<
    VolunteerAssignment[],
    Error
  >({
    queryKey: ["volunteerAssignments", "me"],
    queryFn: getMyAssignments,
    enabled: user?.role === UserRole.VOLUNTEER,
  });
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<
    VolunteerAssignment[],
    Error
  >({
    queryKey: ["volunteerAssignments", "request", id],
    queryFn: () => getAssignmentsBySupportRequest(id as string),
    enabled: !!id,
  });
  const {
    data: contributionHistory = [],
    isLoading: isContributionHistoryLoading,
  } = useQuery({
    queryKey: ["supportNeedContributions", historyNeed?.id],
    queryFn: () => getSupportNeedContributions(historyNeed.id),
    enabled: !!historyNeed?.id,
  });
  const needContributionQueries = useQueries({
    queries: (needs || []).map((need: any) => ({
      queryKey: ["supportNeedContributions", need.id],
      queryFn: () => getSupportNeedContributions(need.id),
      enabled: !!need.id,
    })),
  });

  // Quyền chỉnh sửa
  const isOwner = user?.id === request?.requesterId;
  const isStaff =
    user?.role === UserRole.ADMIN || user?.role === UserRole.COLLABORATOR;
  const isVolunteer = user?.role === UserRole.VOLUNTEER;
  const isRequesterOwner = user?.role === UserRole.REQUESTER && isOwner;
  const requestAllowsSupportNeedChanges =
    request?.status === SupportStatus.PENDING ||
    request?.status === SupportStatus.APPROVED;
  const requestAllowsContributions =
    request?.status === SupportStatus.APPROVED ||
    request?.status === SupportStatus.IN_PROGRESS;
  const canEditRequest =
    isRequesterOwner && request?.status === SupportStatus.PENDING;
  const canManageNeeds = isRequesterOwner && requestAllowsSupportNeedChanges;
  const requestAllowsVolunteerApplication =
    request?.status === SupportStatus.APPROVED ||
    request?.status === SupportStatus.IN_PROGRESS;
  const requestAssignmentForUser = assignments.find(
    (assignment) => assignment.volunteerId === user?.id,
  );
  const myAssignmentForRequest = myVolunteerAssignments.find(
    (assignment) => assignment.supportRequestId === id,
  );
  const userAssignmentForRequest =
    requestAssignmentForUser || myAssignmentForRequest;
  const shouldShowVolunteerHelp =
    isVolunteer && !isOwner && requestAllowsVolunteerApplication;
  const canApplyVolunteer =
    shouldShowVolunteerHelp && !userAssignmentForRequest;
  const canContributeAsAcceptedVolunteer =
    userAssignmentForRequest?.status === "ACCEPTED";
  const volunteerHelpLabel = userAssignmentForRequest
    ? `Volunteer request: ${userAssignmentForRequest.status}`
    : "I want to help";
  const canContribute =
    !isOwner &&
    requestAllowsContributions &&
    (user?.role === UserRole.COLLABORATOR || canContributeAsAcceptedVolunteer);
  const canReviewAssignments = !!request && (isOwner || isStaff);
  const canAssignSupportLocation =
    !!request && isStaff && request.status === SupportStatus.APPROVED;
  const getContributorAssignment = (contributorId?: string) => {
    if (!contributorId) return null;
    return (
      assignments.find((item) => item.volunteerId === contributorId) || null
    );
  };

  const getContributionState = (contributorId?: string) => {
    const assignment = getContributorAssignment(contributorId);
    if (!assignment) {
      return {
        isCounted: true,
        tone: "success" as const,
        label: "Counted as collaborator/direct contribution.",
      };
    }
    if (assignment.status !== "PENDING" && assignment.status !== "REJECTED") {
      return {
        isCounted: true,
        tone: "success" as const,
        label: `Counted: volunteer assignment ${assignment.status}.`,
      };
    }
    if (assignment.status === "REJECTED") {
      return {
        isCounted: false,
        tone: "danger" as const,
        label: "Not counted: volunteer assignment rejected.",
      };
    }
    return {
      isCounted: false,
      tone: "pending" as const,
      label: `Not counted yet: volunteer assignment ${assignment.status}.`,
    };
  };

  const displayNeeds = useMemo(
    () =>
      (needs || []).map((need: any, index: number) => {
        const contributions =
          (needContributionQueries[index]?.data as
            | SupportNeedContributionResponse[]
            | undefined) || [];
        const requiredQuantity = Number(
          need.requiredQuantity || need.quantity || 0,
        );
        const effectiveReceivedQuantity = contributions.reduce(
          (sum, contribution) => {
            if (contribution.status && contribution.status !== "SUCCESS") {
              return sum;
            }
            const assignment = assignments.find(
              (item) => item.volunteerId === contribution.contributorId,
            );
            if (
              !assignment ||
              (assignment.status !== "PENDING" && assignment.status !== "REJECTED")
            ) {
              return sum + Number(contribution.quantity || 0);
            }
            return sum;
          },
          0,
        );
        const effectiveRemainingQuantity = Math.max(
          0,
          requiredQuantity - effectiveReceivedQuantity,
        );
        return {
          ...need,
          effectiveReceivedQuantity,
          effectiveRemainingQuantity,
          effectiveIsFulfilled:
            requiredQuantity > 0 &&
            effectiveReceivedQuantity >= requiredQuantity,
          backendReceivedQuantity: Number(need.receivedQuantity || 0),
          backendRemainingQuantity: Number(need.remainingQuantity || 0),
        };
      }),
    [needs, needContributionQueries, assignments],
  );

  useEffect(() => {
    if (request) {
      setEditTitle(request.title || "");
      setEditDescription(request.description || "");

      // Lấy chính xác Category ID để phục vụ việc update API
      const initialCategoryId = request.categoryId || "";
      setEditCategoryId(initialCategoryId);
      const matchedCategory = categories?.find(
        (cat: any) => cat.id === initialCategoryId,
      );
      setEditCategoryName(matchedCategory?.name || "Select Category");

      setAddress(request.address || "");
      if (request.latitude) setLatStr(request.latitude.toString());
      if (request.longitude) setLngStr(request.longitude.toString());
    }
  }, [request]);

  useEffect(() => {
    if (!isShareSheetVisible) return;
    setIsConversationsLoading(true);
    api
      .get<any>("/api/v1/conversations/me")
      .then((res) => setConversations(res || []))
      .catch((error) => {
        console.error("Failed to load conversations for sharing:", error);
        setConversations([]);
      })
      .finally(() => setIsConversationsLoading(false));
  }, [isShareSheetVisible]);

  const handleShareRequest = async (conversationId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await api.post(`/api/v1/conversations/${conversationId}/messages`, {
        content: `[SHARED_ITEM:SUPPORT:${id}:${request?.title || "Support Request"}]`,
      });
      Alert.alert("Success", "Support request shared successfully.");
      setIsShareSheetVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to share support request.");
    }
  };

  const updateRequestMutation = useMutation({
    mutationFn: (data: any) => updateSupportRequest(id as string, data),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["supportRequest"] });
      queryClient.invalidateQueries({ queryKey: ["supportRequest", id] });
      queryClient.invalidateQueries({ queryKey: ["supportRequests"] });
      queryClient.invalidateQueries({ queryKey: ["mySupportRequests"] });
      Alert.alert("Success", "Request details updated successfully!");
    },
    onError: (error: any) => {
      console.error("Update Request Error:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to update request. Please try again.",
      );
    },
  });

  const deleteNeedMutation = useMutation({
    mutationFn: (needId: string) => deleteSupportNeed(needId),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["supportNeeds", id] });
    },
  });

  const applyMutation = useMutation({
    mutationFn: () => applyToSupportRequest(id as string),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({
        queryKey: ["volunteerAssignments", "request", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["volunteerAssignments", "me"],
      });
      queryClient.invalidateQueries({ queryKey: ["volunteerAssignments"] });
      Alert.alert("Success", "Your volunteer application has been submitted.");
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to apply as volunteer.");
    },
  });

  const approveVolunteerMutation = useMutation({
    mutationFn: (volunteerId: string) =>
      approveVolunteer(id as string, volunteerId),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({
        queryKey: ["volunteerAssignments", "request", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["volunteerAssignments", "me"],
      });
      queryClient.invalidateQueries({ queryKey: ["volunteerAssignments"] });
      queryClient.invalidateQueries({ queryKey: ["supportRequest", id] });
      queryClient.invalidateQueries({ queryKey: ["supportRequests"] });
      queryClient.invalidateQueries({ queryKey: ["mySupportRequests"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to approve volunteer.");
    },
  });

  const rejectVolunteerMutation = useMutation({
    mutationFn: ({
      volunteerId,
      rejectionReason,
    }: {
      volunteerId: string;
      rejectionReason: string;
    }) => rejectVolunteer(id as string, volunteerId, rejectionReason),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setRejectAssignment(null);
      setAssignmentRejectReason("");
      queryClient.invalidateQueries({
        queryKey: ["volunteerAssignments", "request", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["volunteerAssignments", "me"],
      });
      queryClient.invalidateQueries({ queryKey: ["volunteerAssignments"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to reject volunteer.");
    },
  });

  const assignSupportLocationMutation = useMutation({
    mutationFn: (supportLocationId: string) =>
      assignSupportLocation(id as string, { supportLocationId }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowLocationPicker(false);
      queryClient.invalidateQueries({ queryKey: ["supportRequest", id] });
      queryClient.invalidateQueries({ queryKey: ["supportRequests"] });
      queryClient.invalidateQueries({ queryKey: ["mySupportRequests"] });
      Alert.alert("Success", "Support request assigned to support location.");
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error?.message || "Failed to assign support location.",
      );
    },
  });

  const handleOpenSupportNeedTransfer = (need: any) => {
    setTransferNeed(need);
    setTransferAmount('');
    setTransferReason('');
    setTransferError('');
  };

  const handleSubmitSupportNeedTransfer = async () => {
    if (!transferNeed) return;
    const parsedAmount = Number(transferAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setTransferError('Please enter a valid transfer amount');
      return;
    }
    if (!transferReason.trim()) {
      setTransferError('Transfer reason is required');
      return;
    }

    try {
      await createSupportNeedTransferTicketMutation.mutateAsync({
        amount: parsedAmount,
        reason: transferReason.trim(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTransferNeed(null);
      setTransferAmount('');
      setTransferReason('');
      setTransferError('');
      Alert.alert('Ticket submitted', 'Admins can now review this money transfer ticket.');
    } catch (error: any) {
      setTransferError(error?.message || 'Failed to create transfer ticket.');
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    try {
      const res = await fetch(
        `https://autosuggest.search.hereapi.com/v1/autosuggest?at=${latStr},${lngStr}&limit=5&q=${encodeURIComponent(
          query,
        )}&apiKey=${HERE_API_KEY}&lang=vi`,
      );
      const data = await res.json();
      const validItems = (data.items || []).filter(
        (item: any) => item.position,
      );
      setSuggestions(validItems);
    } catch (error) {
      console.error("Autosuggest Error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchLocation = (text: string) => {
    setAddress(text);
    setIsSearching(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => fetchSuggestions(text), 600);
  };

  const handleSelectSuggestion = (item: any) => {
    const { lat, lng } = item.position;
    const fullAddress = item.address?.label || item.title;
    setAddress(fullAddress);
    setLatStr(lat.toString());
    setLngStr(lng.toString());
    setSuggestions([]);

    const message = JSON.stringify({ type: "SET_LOCATION", lat, lng });
    if (Platform.OS === "web") {
      const iframe = document.getElementById("map-iframe") as HTMLIFrameElement;
      iframe?.contentWindow?.postMessage(message, "*");
    } else {
      webViewRef.current?.postMessage(message);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveRequestUpdates = async () => {
    if (!request) return;
    if (!editTitle.trim()) {
      Alert.alert("Notice", "Title cannot be empty.");
      return;
    }
    if (!editCategoryId) {
      Alert.alert("Notice", "Please select a category.");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Notice", "Address cannot be empty.");
      return;
    }

    let resolved = {
      address: address.trim(),
      latitude: parseFloat(latStr) || request.latitude,
      longitude: parseFloat(lngStr) || request.longitude,
    };

    if (address.trim() !== request.address) {
      const geocoded = await geocodeAddress(address.trim());
      if (!geocoded) {
        Alert.alert(
          "Notice",
          "Could not resolve this address. Please choose a valid address from suggestions.",
        );
        return;
      }
      resolved = geocoded;
      setAddress(geocoded.address);
      setLatStr(geocoded.latitude.toString());
      setLngStr(geocoded.longitude.toString());
    }

    // Payload sử dụng categoryId để Backend không văng lỗi 500
    updateRequestMutation.mutate({
      title: editTitle.trim(),
      description: editDescription.trim(),
      categoryId: editCategoryId,
      address: resolved.address,
      latitude: resolved.latitude,
      longitude: resolved.longitude,
    });
  };

  if (requestLoading) {
    return (
      <View
        style={[localStyles.centerContainer, { backgroundColor: theme.appBG }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  if (!request) {
    return (
      <View
        style={[localStyles.centerContainer, { backgroundColor: theme.appBG }]}
      >
        <Text style={{ color: theme.text }}>Request not found</Text>
      </View>
    );
  }

  const getHereMapHtml = (lat: string, lng: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" type="text/css" href="https://js.api.here.com/v3/3.2/mapsjs-ui.css" />
        <script src="https://js.api.here.com/v3/3.2/mapsjs-core.js"></script>
        <script src="https://js.api.here.com/v3/3.2/mapsjs-service.js"></script>
        <script src="https://js.api.here.com/v3/3.2/mapsjs-mapevents.js"></script>
        <script src="https://js.api.here.com/v3/3.2/mapsjs-ui.js"></script>
        <style>
          body { margin: 0; padding: 0; overflow: hidden; background-color: #0F172A; }
          #map { width: 100vw; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const apiKey = '${HERE_API_KEY}';
          const platform = new H.service.Platform({ apikey: apiKey });
          const defaultLayers = platform.createDefaultLayers();
          
          const map = new H.Map(
            document.getElementById('map'), 
            defaultLayers.raster.normal.map, 
            {
              center: { lat: ${lat}, lng: ${lng} },
              zoom: 15,
              pixelRatio: window.devicePixelRatio || 1
            }
          );
          
          const mapEvents = new H.mapevents.MapEvents(map);
          new H.mapevents.Behavior(mapEvents);
          H.ui.UI.createDefault(map, defaultLayers);

          let marker = new H.map.Marker({ lat: ${lat}, lng: ${lng} });
          map.addObject(marker);

          window.addEventListener('message', (event) => {
            try {
              const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
              if (data.type === 'SET_LOCATION') {
                const newPos = { lat: data.lat, lng: data.lng };
                marker.setGeometry(newPos);
                map.getViewModel().setLookAtData({ position: newPos, zoom: 16 }, true);
              }
            } catch(e) {}
          });
        </script>
      </body>
    </html>
  `;

  return (
    <KeyboardAvoidingView
      style={[localStyles.container, { backgroundColor: theme.appBG }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[localStyles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={localStyles.iconBtn}>
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[localStyles.headerTitle, { color: theme.text }]}>
          Request Details
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Pressable
            onPress={() => setIsReportModalVisible(true)}
            style={localStyles.iconBtn}
          >
            <MaterialIcons name="flag" size={22} color={theme.textSupporting} />
          </Pressable>
          <Pressable
            onPress={() => setIsShareSheetVisible(true)}
            style={localStyles.iconBtn}
          >
            <MaterialIcons name="share" size={24} color={theme.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={localStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={localStyles.statusContainer}>
          <View
            style={[
              localStyles.badge,
              { backgroundColor: theme.highlightBG, borderColor: theme.border },
            ]}
          >
            <Text style={{ color: theme.primary, fontWeight: "600" }}>
              {STATUS_LABELS[request.status as SupportStatus] || request.status}
            </Text>
          </View>
        </View>

        {shouldShowVolunteerHelp && (
          <Button
            text={volunteerHelpLabel}
            onPress={() => {
              if (canApplyVolunteer) applyMutation.mutate();
            }}
            primary={canApplyVolunteer}
            isDisabled={!canApplyVolunteer}
            isLoading={applyMutation.isPending}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Dynamic Fields */}
        {canEditRequest ? (
          <View style={{ gap: 12 }}>
            <TextInput
              label="Title"
              placeholder="Request title..."
              value={editTitle}
              onChangeText={setEditTitle}
            />
            <TextInput
              label="Description"
              placeholder="Describe the situation..."
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              style={{ height: 80, textAlignVertical: "top" }}
            />
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: theme.textSupporting,
                }}
              >
                Category
              </Text>
              <Pressable
                onPress={() => setShowCategoryPicker(true)}
                style={[
                  localStyles.pickerRow,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.componentBG,
                  },
                ]}
              >
                <Text style={{ color: theme.text, fontSize: 16 }}>
                  {editCategoryName}
                </Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={20}
                  color={theme.icon}
                />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <Text style={[localStyles.title, { color: theme.text }]}>
              {request.title}
            </Text>
            <Text
              style={{
                color: theme.primary,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              {editCategoryName}
            </Text>
            <Text
              style={[localStyles.description, { color: theme.textSupporting }]}
            >
              {request.description}
            </Text>
          </View>
        )}

        <View
          style={[localStyles.divider, { backgroundColor: theme.border }]}
        />

        {/* Location */}
        <Text
          style={[
            localStyles.sectionTitle,
            { color: theme.text, marginBottom: 12 },
          ]}
        >
          Location Details
        </Text>

        {canEditRequest ? (
          <View style={{ position: "relative", zIndex: 20 }}>
            <TextInput
              placeholder="Search address..."
              value={address}
              onChangeText={handleSearchLocation}
            />
            {isSearching && (
              <ActivityIndicator
                style={{ position: "absolute", right: 10, top: 15 }}
                color={theme.primary}
              />
            )}
            {suggestions.length > 0 && (
              <View
                style={[
                  localStyles.suggestionDropdown,
                  {
                    backgroundColor: theme.componentBG,
                    borderColor: theme.border,
                  },
                ]}
              >
                {suggestions.map((item, index) => (
                  <Pressable
                    key={item.id || index}
                    style={localStyles.suggestionItem}
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <MaterialIcons
                      name="place"
                      size={18}
                      color={theme.primary}
                    />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text
                        style={{ color: theme.text, fontWeight: "600" }}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={{ color: theme.textSupporting, fontSize: 12 }}
                        numberOfLines={1}
                      >
                        {item.address.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View
            style={[
              localStyles.addressBox,
              { borderColor: theme.border, backgroundColor: theme.highlightBG },
            ]}
          >
            <MaterialIcons name="location-on" size={22} color={theme.primary} />
            <Text
              style={[localStyles.addressText, { color: theme.text }]}
              numberOfLines={2}
            >
              {request.address || "No target address details supplied"}
            </Text>
          </View>
        )}

        <View style={[localStyles.mapContainer, { borderColor: theme.border }]}>
          {Platform.OS === "web" ? (
            <iframe
              id="map-iframe"
              srcDoc={getHereMapHtml(latStr, lngStr)}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          ) : (
            <WebView
              ref={webViewRef}
              originWhitelist={["*"]}
              source={{ html: getHereMapHtml(latStr, lngStr) }}
              style={{ flex: 1 }}
              scrollEnabled={false}
            />
          )}
        </View>

        {(request.assignedSupportLocationName || canAssignSupportLocation) && (
          <View style={{ marginTop: 16, gap: 10 }}>
            <Text
              style={[localStyles.sectionTitleSmall, { color: theme.text }]}
            >
              Support location
            </Text>
            <View
              style={[
                localStyles.addressBox,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.highlightBG,
                },
              ]}
            >
              <MaterialIcons name="home-work" size={22} color={theme.primary} />
              <Text
                style={[localStyles.addressText, { color: theme.text }]}
                numberOfLines={2}
              >
                {request.assignedSupportLocationName ||
                  "No support location assigned"}
              </Text>
            </View>
            {canAssignSupportLocation && (
              <Button
                text={
                  request.assignedSupportLocationId
                    ? "Change Support Location"
                    : "Assign Support Location"
                }
                onPress={() => setShowLocationPicker(true)}
                isLoading={assignSupportLocationMutation.isPending}
                style={{ backgroundColor: theme.highlightBG }}
              />
            )}
          </View>
        )}

        {canEditRequest && (
          <Button
            text="Save Request Updates"
            onPress={handleSaveRequestUpdates}
            primary
            style={{ marginTop: 24 }}
            isLoading={updateRequestMutation.isPending}
          />
        )}

        {canReviewAssignments && (
          <>
            <View
              style={[localStyles.divider, { backgroundColor: theme.border }]}
            />
            <Text
              style={[
                localStyles.sectionTitle,
                { color: theme.text, marginBottom: 12 },
              ]}
            >
              Volunteer applications
            </Text>
            {assignmentsLoading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : assignments.length === 0 ? (
              <Text style={{ color: theme.textSupporting }}>
                No volunteer applications yet.
              </Text>
            ) : (
              <View style={localStyles.assignmentList}>
                {assignments.map((assignment, index) => (
                  <View
                    key={
                      assignment.id ||
                      `${assignment.supportRequestId}-${assignment.volunteerId}-${assignment.assignedAt || assignment.updatedAt || index}`
                    }
                    style={[
                      localStyles.assignmentCard,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.highlightBG,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ color: theme.text, fontWeight: "700" }}
                        numberOfLines={1}
                      >
                        {assignment.volunteerName || "Volunteer"}
                      </Text>
                      <Text
                        style={{
                          color: theme.textSupporting,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {assignment.status}
                      </Text>
                    </View>
                    {assignment.status === "PENDING" && (
                      <View style={localStyles.assignmentActions}>
                        <Pressable
                          onPress={() =>
                            approveVolunteerMutation.mutate(
                              assignment.volunteerId,
                            )
                          }
                          style={localStyles.actionBtn}
                        >
                          <MaterialIcons
                            name="check-circle"
                            size={22}
                            color={theme.success}
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => setRejectAssignment(assignment)}
                          style={localStyles.actionBtn}
                        >
                          <MaterialIcons
                            name="cancel"
                            size={22}
                            color={theme.danger}
                          />
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View
          style={[localStyles.divider, { backgroundColor: theme.border }]}
        />

        {/* Needs Management */}
        <View style={localStyles.sectionHeader}>
          <Text style={[localStyles.sectionTitle, { color: theme.text }]}>
            Items needed
          </Text>
          {canManageNeeds && (
            <Pressable
              onPress={() => {
                setSelectedNeed(null);
                setIsNeedModalVisible(true);
              }}
              style={[
                localStyles.addNeedBtn,
                { backgroundColor: theme.primary },
              ]}
            >
              <MaterialIcons name="add" size={20} color="#FFFFFF" />
            </Pressable>
          )}
        </View>

        {needsLoading ? (
          <ActivityIndicator
            size="small"
            color={theme.primary}
            style={{ marginTop: 16 }}
          />
        ) : !displayNeeds || displayNeeds.length === 0 ? (
          <View style={localStyles.emptyContainer}>
            <MaterialIcons
              name="inventory-2"
              size={48}
              color={theme.textSupporting}
            />
            <Text
              style={[
                localStyles.emptyText,
                { color: theme.textSupporting, marginTop: 12 },
              ]}
            >
              No items added yet.
            </Text>
          </View>
        ) : (
          <View style={localStyles.needsList}>
            {displayNeeds.map((need: any, index: number) => (
              <View
                key={need.id}
                style={[
                  localStyles.needCard,
                  { borderColor: theme.border },
                  index === 0 && { borderTopWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <View style={localStyles.needInfo}>
                  <Text style={[localStyles.needName, { color: theme.text }]}>
                    {need.needName || need.name || "Unnamed Item"}
                  </Text>
                  <Text
                    style={[
                      localStyles.needMeta,
                      { color: theme.textSupporting },
                    ]}
                  >
                    {need.effectiveReceivedQuantity}/
                    {need.requiredQuantity || need.quantity || 0}{" "}
                    {need.unit || "pcs"} ·{" "}
                    {need.supportType === "MONEY" ? "Money" : "Goods"}
                  </Text>
                </View>
                {(canManageNeeds ||
                  canContribute ||
                  need.backendReceivedQuantity > 0 ||
                  need.effectiveReceivedQuantity > 0) && (
                  <View style={localStyles.needActions}>
                    <Pressable
                      onPress={() => setHistoryNeed(need)}
                      style={localStyles.actionBtn}
                    >
                      <MaterialIcons
                        name="history"
                        size={20}
                        color={theme.textSupporting}
                      />
                    </Pressable>
                    {canContribute && (
                      <Pressable
                        onPress={() => setContributeNeed(need)}
                        disabled={
                          need.effectiveIsFulfilled ||
                          need.backendRemainingQuantity === 0
                        }
                        style={localStyles.actionBtn}
                      >
                        <MaterialIcons
                          name="volunteer-activism"
                          size={20}
                          color={
                            need.effectiveIsFulfilled ||
                            need.backendRemainingQuantity === 0
                              ? theme.textSupporting
                              : theme.success
                          }
                        />
                      </Pressable>
                    )}
                    {isRequesterOwner && need.supportType === "MONEY" && need.backendReceivedQuantity > 0 && (
                      <Pressable
                        onPress={() => handleOpenSupportNeedTransfer(need)}
                        style={localStyles.actionBtn}
                      >
                        <MaterialIcons
                          name="payments"
                          size={20}
                          color={theme.primary}
                        />
                      </Pressable>
                    )}
                    {canManageNeeds && (
                      <>
                        <Pressable
                          onPress={() => {
                            setSelectedNeed(need);
                            setIsNeedModalVisible(true);
                          }}
                          style={localStyles.actionBtn}
                        >
                          <MaterialIcons
                            name="edit"
                            size={20}
                            color={theme.primary}
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => deleteNeedMutation.mutate(need.id)}
                          style={localStyles.actionBtn}
                        >
                          <MaterialIcons
                            name="close"
                            size={20}
                            color={theme.danger}
                          />
                        </Pressable>
                      </>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Dynamic Category Picker Sheet */}
      <BottomSheet
        isVisible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        options={(categories || []).map((cat: any) => ({
          key: cat.id,
          label: cat.name,
          onPress: () => {
            setEditCategoryId(cat.id);
            setEditCategoryName(cat.name);
            setShowCategoryPicker(false);
          },
        }))}
      />

      <BottomSheet
        isVisible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        title="Select support location"
        options={
          supportLocations.length > 0
            ? supportLocations.map((location: any) => ({
                key: location.id,
                label: location.name,
                icon: "home-work" as const,
                onPress: () =>
                  assignSupportLocationMutation.mutate(location.id),
              }))
            : [
                {
                  key: "empty",
                  label: "No active support locations available",
                  icon: "info-outline" as const,
                  onPress: () => {},
                },
              ]
        }
      />

      <BottomSheet
        isVisible={isShareSheetVisible}
        onClose={() => setIsShareSheetVisible(false)}
        title="Share Support Request"
      >
        <View style={{ paddingBottom: 24, maxHeight: 400, width: "100%" }}>
          {isConversationsLoading ? (
            <ActivityIndicator
              size="large"
              color={theme.primary}
              style={{ marginVertical: 20 }}
            />
          ) : conversations.length === 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: theme.textSupporting, textAlign: "center" }}>
                No active chats found
              </Text>
            </View>
          ) : (
            <ScrollView style={{ width: "100%" }} showsVerticalScrollIndicator={false}>
              {conversations.map((conversation: any) => {
                const otherMember = conversation.members?.find(
                  (member: any) => member.userId !== user?.id,
                );
                const chatName = otherMember?.fullName || "User";
                return (
                  <Pressable
                    key={conversation.id}
                    onPress={() => handleShareRequest(conversation.id)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 14,
                      paddingHorizontal: 20,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.border,
                      backgroundColor: pressed
                        ? theme.activeComponentBG
                        : "transparent",
                    })}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: theme.primary + "20",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <MaterialIcons name="person" size={20} color={theme.primary} />
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        color: theme.text,
                        fontWeight: "600",
                        fontSize: 15,
                      }}
                    >
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

      <ReportModal
        visible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
        targetType={ReportTargetType.SUPPORT_REQUEST}
        targetId={id as string}
        targetName={request?.title || "Support Request"}
        onSuccessSubmit={() => {
          Alert.alert(
            "Report submitted",
            "Your report has been submitted to administrators for review.",
          );
        }}
      />

      <ContributeItemModal
        visible={!!contributeNeed}
        onClose={() => setContributeNeed(null)}
        item={
          contributeNeed
            ? {
                id: contributeNeed.id,
                category:
                  contributeNeed.supportType === "MONEY"
                    ? ItemCategory.MONEY
                    : ItemCategory.GOODS,
                name: contributeNeed.needName || "Support need",
                neededQuantity: contributeNeed.requiredQuantity || 0,
                receivedQuantity:
                  contributeNeed.effectiveReceivedQuantity ??
                  contributeNeed.receivedQuantity ??
                  0,
                remainingQuantity:
                  contributeNeed.effectiveRemainingQuantity ??
                  contributeNeed.remainingQuantity,
                isFulfilled:
                  contributeNeed.effectiveIsFulfilled ??
                  contributeNeed.isFulfilled,
                unit: contributeNeed.unit,
              }
            : null
        }
        onConfirm={async (needId, quantity, notes) => {
          if (contributeNeed?.supportType === "MONEY") {
            const checkout = await createPayOsContribution({
              needId,
              data: {
                quantity,
                note: notes || undefined,
                ...(Platform.OS === "web" ? {} : createPayOsMobileRedirectUrls()),
              },
            });

            if (Platform.OS === "web" && typeof window !== "undefined") {
              window.location.assign(checkout.checkoutUrl);
              return;
            }

            const result = await WebBrowser.openAuthSessionAsync(
              checkout.checkoutUrl,
              getPayOsMobileCallbackUrl(),
            );

            if (result.type === "success" && result.url) {
              router.replace(getRouteFromPayOsRedirectUrl(result.url) as any);
            }
          } else {
            await contribute({
              needId,
              data: {
                quantity,
                note: notes || undefined,
              },
            });
          }
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["supportRequests"] }),
            queryClient.invalidateQueries({ queryKey: ["mySupportRequests"] }),
            queryClient.invalidateQueries({ queryKey: ["supportRequest", id] }),
            queryClient.invalidateQueries({ queryKey: ["supportNeeds", id] }),
            queryClient.invalidateQueries({
              queryKey: ["supportNeedContributions"],
            }),
          ]);
          await refetchRequest();
          setContributeNeed(null);
        }}
      />

      <Modal
        visible={!!rejectAssignment}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectAssignment(null)}
      >
        <View style={localStyles.modalOverlay}>
          <View
            style={[
              localStyles.rejectModal,
              { backgroundColor: theme.componentBG, borderColor: theme.border },
            ]}
          >
            <Text style={[localStyles.modalTitle, { color: theme.text }]}>
              Reject volunteer
            </Text>
            <Text style={{ color: theme.textSupporting, fontSize: 13 }}>
              {rejectAssignment?.volunteerName || "Volunteer"}
            </Text>
            <TextInput
              label="Reason"
              value={assignmentRejectReason}
              onChangeText={setAssignmentRejectReason}
              multiline
              height={90}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button
                text="Reject"
                danger
                style={{ flex: 1 }}
                isLoading={rejectVolunteerMutation.isPending}
                isDisabled={!assignmentRejectReason.trim()}
                onPress={() => {
                  if (!rejectAssignment) return;
                  rejectVolunteerMutation.mutate({
                    volunteerId: rejectAssignment.volunteerId,
                    rejectionReason: assignmentRejectReason.trim(),
                  });
                }}
              />
              <Button
                text="Cancel"
                style={{ flex: 1, backgroundColor: theme.highlightBG }}
                onPress={() => {
                  setRejectAssignment(null);
                  setAssignmentRejectReason("");
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!historyNeed}
        transparent
        animationType="fade"
        onRequestClose={() => setHistoryNeed(null)}
      >
        <View style={localStyles.modalOverlay}>
          <View
            style={[
              localStyles.rejectModal,
              { backgroundColor: theme.componentBG, borderColor: theme.border },
            ]}
          >
            <View style={localStyles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[localStyles.modalTitle, { color: theme.text }]}>
                  Contribution history
                </Text>
                <Text style={{ color: theme.textSupporting, fontSize: 13 }}>
                  {historyNeed?.needName || "Support need"}
                </Text>
              </View>
              <Pressable
                onPress={() => setHistoryNeed(null)}
                style={localStyles.actionBtn}
              >
                <MaterialIcons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>

            {isContributionHistoryLoading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : contributionHistory.length === 0 ? (
              <Text style={{ color: theme.textSupporting }}>
                No contributions recorded for this need yet.
              </Text>
            ) : (
              <ScrollView
                style={{ maxHeight: 320 }}
                showsVerticalScrollIndicator={false}
              >
                {contributionHistory.map((item) => {
                  const contributionState = getContributionState(
                    item.contributorId,
                  );
                  const paymentStatusLabel = item.status && item.status !== "SUCCESS"
                    ? `Payment ${item.status.toLowerCase()}`
                    : contributionState.label;
                  const contributionStateColor =
                    item.status && item.status !== "SUCCESS"
                      ? theme.textSupporting
                      :
                    contributionState.tone === "success"
                      ? theme.success
                      : contributionState.tone === "danger"
                        ? theme.danger
                        : theme.textSupporting;
                  return (
                    <View
                      key={item.id}
                      style={[
                        localStyles.historyRow,
                        { borderBottomColor: theme.border },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontWeight: "700" }}>
                          {item.contributorName || "Contributor"}
                        </Text>
                        <Text
                          style={{ color: theme.textSupporting, fontSize: 12 }}
                        >
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString()
                            : ""}
                        </Text>
                        <Text
                          style={{
                            color: contributionStateColor,
                            fontSize: 12,
                            marginTop: 4,
                            fontWeight: "700",
                          }}
                        >
                          {paymentStatusLabel}
                        </Text>
                        {!!item.note && (
                          <Text
                            style={{
                              color: theme.textSupporting,
                              fontSize: 12,
                              marginTop: 4,
                            }}
                          >
                            {item.note}
                          </Text>
                        )}
                      </View>
                      <Text style={{ color: theme.primary, fontWeight: "800" }}>
                        +{item.quantity} {historyNeed?.unit || ""}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!transferNeed}
        transparent
        animationType="fade"
        onRequestClose={() => setTransferNeed(null)}
      >
        <View style={localStyles.modalOverlay}>
          <View
            style={[
              localStyles.rejectModal,
              { backgroundColor: theme.componentBG, borderColor: theme.border },
            ]}
          >
            <View style={localStyles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[localStyles.modalTitle, { color: theme.text }]}>
                  Request money transfer
                </Text>
                <Text style={{ color: theme.textSupporting, fontSize: 13 }}>
                  {transferNeed?.needName || "Money support need"}
                </Text>
              </View>
              <Pressable
                onPress={() => setTransferNeed(null)}
                style={localStyles.actionBtn}
              >
                <MaterialIcons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>

            {transferError ? (
              <View style={{ backgroundColor: theme.danger + "15", borderColor: theme.danger, borderWidth: 1, borderRadius: 8, padding: 10 }}>
                <Text style={{ color: theme.danger, fontSize: 13 }}>{transferError}</Text>
              </View>
            ) : null}

            <TextInput
              label="Amount (VND)"
              value={transferAmount}
              onChangeText={(text) => setTransferAmount(text.replace(/[^0-9]/g, ""))}
              keyboardType="numeric"
            />
            <TextInput
              label="Reason"
              value={transferReason}
              onChangeText={setTransferReason}
              multiline
              height={90}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button
                text="Submit Ticket"
                primary
                style={{ flex: 1 }}
                isLoading={createSupportNeedTransferTicketMutation.isPending}
                onPress={handleSubmitSupportNeedTransfer}
              />
              <Button
                text="Cancel"
                style={{ flex: 1, backgroundColor: theme.highlightBG }}
                onPress={() => setTransferNeed(null)}
              />
            </View>
          </View>
        </View>
      </Modal>

      <SupportNeedModal
        visible={isNeedModalVisible}
        onClose={() => setIsNeedModalVisible(false)}
        requestId={id as string}
        initialData={selectedNeed}
      />
    </KeyboardAvoidingView>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  iconBtn: { padding: 12 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  statusContainer: { alignItems: "flex-start", marginBottom: 14 },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 4, lineHeight: 30 },
  description: { fontSize: 15, lineHeight: 24 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 22, fontWeight: "700" },
  sectionTitleSmall: { fontSize: 16, fontWeight: "700" },
  pickerRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    gap: 10,
  },
  addressText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  suggestionDropdown: {
    position: "absolute",
    top: 55,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 999,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  mapContainer: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    marginTop: 8,
  },
  addNeedBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 15, textAlign: "center" },
  needsList: { gap: 0 },
  assignmentList: { gap: 10 },
  assignmentCard: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  assignmentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  needCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  needInfo: { flex: 1, gap: 2 },
  needName: { fontSize: 16, fontWeight: "500" },
  needMeta: { fontSize: 13 },
  needActions: { flexDirection: "row", gap: 4 },
  actionBtn: { padding: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  rejectModal: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
