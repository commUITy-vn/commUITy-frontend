import { Button, ConfirmModal } from "@/components/ui";
import { geocodeAddress } from "@/features/maps/api/geocode-address";
import { createSupportNeed } from "@/features/support/api/create-support-need";
import { useCreateSupportRequest } from "@/features/support/hooks/useCreateSupportRequest";
import {
    CATEGORY_LABELS,
} from "@/features/support/types/support.types";
import { useTheme } from "@/hooks/useTheme";
import { useCreateRequestStore } from "@/stores/useCreateRequestStore";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function CreateRequestConfirmationScreen() {
  const router = useRouter();
  const theme = useTheme();
  const {
    category,
    categoryId,
    categoryName,
    title,
    description,
    address,
    items,
    latitude,
    longitude,
    reset,
  } = useCreateRequestStore();

  const createRequestMutation = useCreateSupportRequest();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: "",
    message: "",
  });

  const showAlert = (title: string, message: string) => {
    setAlertModal({ visible: true, title, message });
  };

  const handleSubmit = async () => {
    if (!categoryId) {
      showAlert("Error", "Please select a category first.");
      return;
    }
    if (!address.trim()) {
      showAlert("Error", "Please select a support request address.");
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSubmitting(true);

    try {
      const resolvedAddress =
        latitude && longitude
          ? { address, latitude, longitude }
          : await geocodeAddress(address);

      if (!resolvedAddress) {
        setIsSubmitting(false);
        showAlert("Error", "Could not resolve this address. Please choose a valid address from suggestions.");
        return;
      }

      const createdRequest = await createRequestMutation.mutateAsync({
        title,
        description,
        categoryId,
        address: resolvedAddress.address,
        latitude: resolvedAddress.latitude,
        longitude: resolvedAddress.longitude,
      });
      // Submit items if any exist
      if (items && items.length > 0) {
        const groupedItems: Record<
          string,
          {
            supportType: "GOODS" | "MONEY";
            needName: string;
            unit: string;
            requiredQuantity: number;
          }
        > = {};

        for (const item of items) {
          const name = item.name.trim();
          if (!name) continue;

          const supportType = item.category === "MONEY" ? "MONEY" : "GOODS";
          const unit = item.unit || (supportType === "MONEY" ? "VND" : "PIECE");
          const key = `${supportType}:${unit}:${name.toLowerCase()}`;
          const qty = Number(item.neededQuantity) || 1;

          if (groupedItems[key]) {
            groupedItems[key].requiredQuantity += qty;
          } else {
            groupedItems[key] = {
              supportType,
              needName: name,
              unit,
              requiredQuantity: qty,
            };
          }
        }

        for (const item of Object.values(groupedItems)) {
          await createSupportNeed(createdRequest.id, {
            ...item,
            requiredQuantity: Math.max(0.01, item.requiredQuantity),
          });
        }
      }

      reset(); // Clear the draft store on success
      setIsSubmitting(false);
      router.push("/create-request/success");
    } catch (error) {
      setIsSubmitting(false);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit request. Please try again.";
      showAlert("Error", message);
    }
  };

  const handleEdit = (step: string) => {
    router.push((step === "index" ? "/create-request" : `/create-request/${step}`) as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.appBG }}>
      {/* Header */}
      <View style={[localStyles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={localStyles.backButton}
        >
          <MaterialIcons name="chevron-left" size={24} color={theme.primary} />
        </Pressable>
        <Text style={[localStyles.headerTitle, { color: theme.text }]}>
          Review
        </Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Step indicator */}
      <View style={localStyles.stepIndicator}>
        <View
          style={[localStyles.stepDot, { backgroundColor: theme.success }]}
        />
        <View
          style={[localStyles.stepDot, { backgroundColor: theme.success }]}
        />
        <View
          style={[localStyles.stepDot, { backgroundColor: theme.success }]}
        />
        <View
          style={[localStyles.stepDot, { backgroundColor: theme.primary }]}
        />
      </View>

      <ScrollView
        style={localStyles.content}
        contentContainerStyle={localStyles.contentContainer}
      >
        <Text style={[localStyles.stepTitle, { color: theme.text }]}>
          Confirm your request
        </Text>

        {/* Category */}
        <View style={localStyles.fieldRow}>
          <View style={localStyles.fieldLeft}>
            <MaterialIcons name="category" size={22} color={theme.icon} />
            <Text
              style={[localStyles.fieldLabel, { color: theme.textSupporting }]}
            >
              Category
            </Text>
          </View>
          <Pressable
            onPress={() => handleEdit("index")}
            style={localStyles.fieldValue}
          >
            <Text style={[localStyles.fieldValueText, { color: theme.text }]}>
              {categoryName || (category ? CATEGORY_LABELS[category] : "Not set")}
            </Text>
            <MaterialIcons name="chevron-right" size={18} color={theme.icon} />
          </Pressable>
        </View>

        {/* Title */}
        <View style={localStyles.fieldRow}>
          <View style={localStyles.fieldLeft}>
            <MaterialIcons name="title" size={22} color={theme.icon} />
            <Text
              style={[localStyles.fieldLabel, { color: theme.textSupporting }]}
            >
              Title
            </Text>
          </View>
          <Pressable
            onPress={() => handleEdit("details")}
            style={localStyles.fieldValue}
          >
            <Text
              style={[localStyles.fieldValueText, { color: theme.text }]}
              numberOfLines={2}
            >
              {title || "Not set"}
            </Text>
            <MaterialIcons name="chevron-right" size={18} color={theme.icon} />
          </Pressable>
        </View>

        {/* Description */}
        {description ? (
          <View style={localStyles.fieldRow}>
            <View style={localStyles.fieldLeft}>
              <MaterialIcons name="description" size={22} color={theme.icon} />
              <Text
                style={[
                  localStyles.fieldLabel,
                  { color: theme.textSupporting },
                ]}
              >
                Description
              </Text>
            </View>
            <Pressable
              onPress={() => handleEdit("details")}
              style={localStyles.fieldValue}
            >
              <Text
                style={[
                  localStyles.fieldValueTextSmall,
                  { color: theme.textSupporting },
                ]}
                numberOfLines={3}
              >
                {description}
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={18}
                color={theme.icon}
              />
            </Pressable>
          </View>
        ) : null}

        {/* Location */}
        {address ? (
          <View style={localStyles.fieldRow}>
            <View style={localStyles.fieldLeft}>
              <MaterialIcons name="location-on" size={22} color={theme.icon} />
              <Text
                style={[
                  localStyles.fieldLabel,
                  { color: theme.textSupporting },
                ]}
              >
                Address
              </Text>
            </View>
            <Pressable
              onPress={() => handleEdit("details")}
              style={localStyles.fieldValue}
            >
              <Text
                style={[localStyles.fieldValueText, { color: theme.text }]}
                numberOfLines={1}
              >
                {address}
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={18}
                color={theme.icon}
              />
            </Pressable>
          </View>
        ) : null}

        {/* Items */}
        <View style={localStyles.fieldRow}>
          <View style={localStyles.fieldLeft}>
            <MaterialIcons name="inventory-2" size={22} color={theme.icon} />
            <Text
              style={[localStyles.fieldLabel, { color: theme.textSupporting }]}
            >
              Items ({items.length})
            </Text>
          </View>
          <Pressable
            onPress={() => handleEdit("items")}
            style={localStyles.fieldValue}
          >
            <Text
              style={[
                localStyles.fieldValueTextSmall,
                { color: theme.textSupporting },
              ]}
              numberOfLines={2}
            >
              {items.length > 0
                ? items.map((i) => `${i.name} (${i.neededQuantity})`).join(", ")
                : "No items"}
            </Text>
            <MaterialIcons name="chevron-right" size={18} color={theme.icon} />
          </Pressable>
        </View>

        {/* Submit button */}
        <View style={localStyles.buttonContainer}>
          <Button
            text={isSubmitting ? "Submitting..." : "Submit Request"}
            onPress={handleSubmit}
            size="large"
            primary
            isLoading={isSubmitting}
            isDisabled={isSubmitting || !category || !title.trim() || !address.trim()}
          />
        </View>
      </ScrollView>

      <ConfirmModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        confirmText="OK"
        cancelText=""
        onConfirm={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
        onCancel={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: 12 },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  content: { flex: 1 },
  contentContainer: { padding: 20, gap: 0, paddingBottom: 40 },
  stepTitle: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  fieldLabel: { fontSize: 15 },
  fieldValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    justifyContent: "flex-end",
  },
  fieldValueText: { fontSize: 15, fontWeight: "500", textAlign: "right" },
  fieldValueTextSmall: { fontSize: 13, textAlign: "right", flex: 1 },
  buttonContainer: { marginTop: 32 },
});
