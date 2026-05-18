import React, { useState } from "react"
import {
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from "react-native"
import { useRouter } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useTheme } from "@/hooks/useTheme"
import { useCreateRequestStore } from "@/stores/useCreateRequestStore"
import { Button } from "@/components/ui"
import {
    CATEGORY_LABELS,
    URGENCY_LABELS,
    ITEM_CATEGORY_LABELS,
} from "@/features/support/types/support.types"

export default function CreateRequestConfirmationScreen() {
    const router = useRouter()
    const theme = useTheme()
    const { category, title, description, location, urgency, items, reset } =
        useCreateRequestStore()

    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        setIsSubmitting(true)

        try {
            // TODO: Call API to create support request
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500))

            setIsSubmitting(false)
            router.replace("/create-request/success")
        } catch (error) {
            setIsSubmitting(false)
            Alert.alert("Error", "Failed to submit request. Please try again.")
        }
    }

    const handleEdit = (step: string) => {
        router.push(`/create-request/${step}` as any)
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.appBG }}>
            {/* Header */}
            <View
                style={[
                    localStyles.header,
                    { borderBottomColor: theme.border },
                ]}
            >
                <Pressable
                    onPress={async () => {
                        await Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                        )
                        router.back()
                    }}
                    style={localStyles.backButton}
                >
                    <MaterialIcons
                        name="chevron-left"
                        size={24}
                        color={theme.primary}
                    />
                </Pressable>
                <Text style={[localStyles.headerTitle, { color: theme.text }]}>
                    Review
                </Text>
                <View style={{ width: 48 }} />
            </View>

            {/* Step indicator */}
            <View style={localStyles.stepIndicator}>
                <View
                    style={[
                        localStyles.stepDot,
                        { backgroundColor: theme.success },
                    ]}
                />
                <View
                    style={[
                        localStyles.stepDot,
                        { backgroundColor: theme.success },
                    ]}
                />
                <View
                    style={[
                        localStyles.stepDot,
                        { backgroundColor: theme.success },
                    ]}
                />
                <View
                    style={[
                        localStyles.stepDot,
                        { backgroundColor: theme.success },
                    ]}
                />
                <View
                    style={[
                        localStyles.stepDot,
                        { backgroundColor: theme.primary },
                    ]}
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
                        <MaterialIcons
                            name="category"
                            size={22}
                            color={theme.icon}
                        />
                        <Text
                            style={[
                                localStyles.fieldLabel,
                                { color: theme.textSupporting },
                            ]}
                        >
                            Category
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => handleEdit("index")}
                        style={localStyles.fieldValue}
                    >
                        <Text
                            style={[
                                localStyles.fieldValueText,
                                { color: theme.text },
                            ]}
                        >
                            {category ? CATEGORY_LABELS[category] : "Not set"}
                        </Text>
                        <MaterialIcons
                            name="chevron-right"
                            size={18}
                            color={theme.icon}
                        />
                    </Pressable>
                </View>

                {/* Title */}
                <View style={localStyles.fieldRow}>
                    <View style={localStyles.fieldLeft}>
                        <MaterialIcons
                            name="title"
                            size={22}
                            color={theme.icon}
                        />
                        <Text
                            style={[
                                localStyles.fieldLabel,
                                { color: theme.textSupporting },
                            ]}
                        >
                            Title
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => handleEdit("details")}
                        style={localStyles.fieldValue}
                    >
                        <Text
                            style={[
                                localStyles.fieldValueText,
                                { color: theme.text },
                            ]}
                            numberOfLines={2}
                        >
                            {title || "Not set"}
                        </Text>
                        <MaterialIcons
                            name="chevron-right"
                            size={18}
                            color={theme.icon}
                        />
                    </Pressable>
                </View>

                {/* Description */}
                {description ? (
                    <View style={localStyles.fieldRow}>
                        <View style={localStyles.fieldLeft}>
                            <MaterialIcons
                                name="description"
                                size={22}
                                color={theme.icon}
                            />
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
                {location ? (
                    <View style={localStyles.fieldRow}>
                        <View style={localStyles.fieldLeft}>
                            <MaterialIcons
                                name="location-on"
                                size={22}
                                color={theme.icon}
                            />
                            <Text
                                style={[
                                    localStyles.fieldLabel,
                                    { color: theme.textSupporting },
                                ]}
                            >
                                Location
                            </Text>
                        </View>
                        <Pressable
                            onPress={() => handleEdit("details")}
                            style={localStyles.fieldValue}
                        >
                            <Text
                                style={[
                                    localStyles.fieldValueText,
                                    { color: theme.text },
                                ]}
                                numberOfLines={1}
                            >
                                {location}
                            </Text>
                            <MaterialIcons
                                name="chevron-right"
                                size={18}
                                color={theme.icon}
                            />
                        </Pressable>
                    </View>
                ) : null}

                {/* Urgency */}
                <View style={localStyles.fieldRow}>
                    <View style={localStyles.fieldLeft}>
                        <MaterialIcons
                            name="schedule"
                            size={22}
                            color={theme.icon}
                        />
                        <Text
                            style={[
                                localStyles.fieldLabel,
                                { color: theme.textSupporting },
                            ]}
                        >
                            Urgency
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => handleEdit("urgency")}
                        style={localStyles.fieldValue}
                    >
                        <Text
                            style={[
                                localStyles.fieldValueText,
                                {
                                    color:
                                        urgency === "HIGH"
                                            ? theme.danger
                                            : urgency === "MEDIUM"
                                              ? theme.warning
                                              : theme.success,
                                    fontWeight: "600",
                                },
                            ]}
                        >
                            {URGENCY_LABELS[urgency]}
                        </Text>
                        <MaterialIcons
                            name="chevron-right"
                            size={18}
                            color={theme.icon}
                        />
                    </Pressable>
                </View>

                {/* Items */}
                <View style={localStyles.fieldRow}>
                    <View style={localStyles.fieldLeft}>
                        <MaterialIcons
                            name="inventory-2"
                            size={22}
                            color={theme.icon}
                        />
                        <Text
                            style={[
                                localStyles.fieldLabel,
                                { color: theme.textSupporting },
                            ]}
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
                                ? items
                                      .map(
                                          (i) =>
                                              `${i.name} (${i.neededQuantity})`,
                                      )
                                      .join(", ")
                                : "No items"}
                        </Text>
                        <MaterialIcons
                            name="chevron-right"
                            size={18}
                            color={theme.icon}
                        />
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
                        isDisabled={isSubmitting || !category || !title.trim()}
                    />
                </View>
            </ScrollView>
        </View>
    )
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
    stepTitle: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
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
})
