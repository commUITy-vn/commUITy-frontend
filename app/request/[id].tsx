import { BottomSheet, Button } from "@/components/ui";
import TextInput from "@/components/ui/TextInput";
import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import {
  applyToSupportRequest,
  approveVolunteer,
  getAssignmentsBySupportRequest,
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
import { updateSupportRequest } from "@/features/support/api/update-support-request";
import { ContributeItemModal } from "@/features/support/components/ContributeItemModal";
import { SupportNeedModal } from "@/features/support/components/SupportNeedModal";
import { useCategories } from "@/features/support/hooks/useCategories"; // Hook load categories động
import { useSupportNeeds } from "@/features/support/hooks/useSupportNeeds";
import { useSupportRequestById } from "@/features/support/hooks/useSupportRequestById";

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [isNeedModalVisible, setIsNeedModalVisible] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState<any>(null);
  const [contributeNeed, setContributeNeed] = useState<any>(null);
  const [rejectAssignment, setRejectAssignment] =
    useState<VolunteerAssignment | null>(null);
  const [assignmentRejectReason, setAssignmentRejectReason] = useState("");

  // States for Editable Fields
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("Select Category");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // States for Address Search
  const [address, setAddress] = useState("");
  const [latStr, setLatStr] = useState("10.8231");
  const [lngStr, setLngStr] = useState("106.6297");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webViewRef = useRef<any>(null);

  // Data Fetching
  const { data: request, isLoading: requestLoading } = useSupportRequestById(
    id as string,
  );
  const {
    needs,
    isLoading: needsLoading,
    contribute,
  } = useSupportNeeds(id as string);
  const { data: categories } = useCategories(true); // Fetch active categories from backend
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<
    VolunteerAssignment[],
    Error
  >({
    queryKey: ["volunteerAssignments", "request", id],
    queryFn: () => getAssignmentsBySupportRequest(id as string),
    enabled: !!id,
  });

  // Quyền chỉnh sửa
  const isOwner = user?.id === request?.requesterId;
  const isStaff =
    user?.role === UserRole.ADMIN || user?.role === UserRole.COLLABORATOR;
  const isVolunteer = user?.role === UserRole.VOLUNTEER;
  const canEditRequest = isOwner && request?.status === SupportStatus.PENDING;
  const canManageNeeds =
    isOwner &&
    (request?.status === SupportStatus.PENDING ||
      request?.status === SupportStatus.APPROVED);
  const canApplyVolunteer =
    isVolunteer &&
    !isOwner &&
    (request?.status === SupportStatus.APPROVED ||
      request?.status === SupportStatus.IN_PROGRESS);
  const currentUserAssignment = assignments.find(
    (assignment) => assignment.volunteerId === user?.id,
  );
  const canContribute =
    user?.role === UserRole.COLLABORATOR ||
    currentUserAssignment?.status === "ACCEPTED";
  const canReviewAssignments = !!request && (isOwner || isStaff);

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

  const updateRequestMutation = useMutation({
    mutationFn: (data: any) => updateSupportRequest(id as string, data),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["supportRequest"] });
      queryClient.invalidateQueries({ queryKey: ["supportRequest", id] });
      queryClient.invalidateQueries({ queryKey: ["supportRequests"] });
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
      queryClient.invalidateQueries({ queryKey: ["supportRequest", id] });
      queryClient.invalidateQueries({ queryKey: ["supportRequests"] });
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
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to reject volunteer.");
    },
  });

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

  const handleSaveRequestUpdates = () => {
    if (!request) return;
    if (!editTitle.trim()) {
      Alert.alert("Notice", "Title cannot be empty.");
      return;
    }
    if (!editCategoryId) {
      Alert.alert("Notice", "Please select a category.");
      return;
    }

    // Payload sử dụng categoryId để Backend không văng lỗi 500
    updateRequestMutation.mutate({
      title: editTitle.trim(),
      description: editDescription.trim(),
      categoryId: editCategoryId,
      address: address,
      latitude: parseFloat(latStr) || request.latitude,
      longitude: parseFloat(lngStr) || request.longitude,
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
        <View style={{ width: 48 }} />
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

        {canApplyVolunteer && (
          <Button
            text={
              currentUserAssignment
                ? `Volunteer request: ${currentUserAssignment.status}`
                : "I want to help"
            }
            onPress={() => applyMutation.mutate()}
            primary={!currentUserAssignment}
            isDisabled={!!currentUserAssignment}
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
                {assignments.map((assignment) => (
                  <View
                    key={`${assignment.volunteerId}-${assignment.assignedAt}`}
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
        ) : !needs || needs.length === 0 ? (
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
            {needs.map((need: any, index: number) => (
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
                    {need.requiredQuantity || need.quantity || 0}{" "}
                    {need.unit || "pcs"} ·{" "}
                    {need.supportType === "MONEY" ? "Money" : "Goods"}
                  </Text>
                </View>
                {(canManageNeeds || canContribute) && (
                  <View style={localStyles.needActions}>
                    {canContribute && (
                      <Pressable
                        onPress={() => setContributeNeed(need)}
                        style={localStyles.actionBtn}
                      >
                        <MaterialIcons
                          name="volunteer-activism"
                          size={20}
                          color={theme.success}
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
                receivedQuantity: contributeNeed.receivedQuantity || 0,
                unit: contributeNeed.unit,
              }
            : null
        }
        onConfirm={async (needId, quantity, notes) => {
          await contribute({
            needId,
            data: {
              quantity,
              note: notes || undefined,
            },
          });
          queryClient.invalidateQueries({ queryKey: ["supportRequests"] });
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
});
