import React from "react"
import { View, Text, Pressable, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useTheme } from "@/hooks/useTheme"
import { useCreateRequestStore } from "@/stores/useCreateRequestStore"
import {
    UrgencyLevel,
    URGENCY_LABELS,
} from "@/features/support/types/support.types"
import { Button } from "@/components/ui"

const urgencyInfo: Record<
    UrgencyLevel,
    { icon: keyof typeof MaterialIcons.glyphMap; description: string }
> = {
    [UrgencyLevel.LOW]: {
        icon: "arrow-downward",
        description: "I can wait a few days",
    },
    [UrgencyLevel.MEDIUM]: {
        icon: "remove",
        description: "I need help within 24 hours",
    },
    [UrgencyLevel.HIGH]: {
        icon: "arrow-upward",
        description: "I need help as soon as possible",
    },
}

export default function CreateRequestUrgencyScreen() {
    const router = useRouter()
    const theme = useTheme()
    const { urgency, setUrgency } = useCreateRequestStore()

    const handleNext = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        router.push("/create-request/items")
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
                    Urgency
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
                        { backgroundColor: theme.primary },
                    ]}
                />
                <View
                    style={[
                        localStyles.stepDot,
                        { backgroundColor: theme.border },
                    ]}
                />
                <View
                    style={[
                        localStyles.stepDot,
                        { backgroundColor: theme.border },
                    ]}
                />
            </View>

            <View style={localStyles.content}>
                <Text style={[localStyles.stepTitle, { color: theme.text }]}>
                    How urgent is this?
                </Text>

                {/* Urgency options */}
                <View style={localStyles.optionsContainer}>
                    {Object.values(UrgencyLevel).map((level) => {
                        const isSelected = urgency === level
                        const info = urgencyInfo[level]
                        const isHigh = level === UrgencyLevel.HIGH
                        const isMedium = level === UrgencyLevel.MEDIUM
                        const isLow = level === UrgencyLevel.LOW

                        return (
                            <Pressable
                                key={level}
                                onPress={async () => {
                                    await Haptics.impactAsync(
                                        Haptics.ImpactFeedbackStyle.Light,
                                    )
                                    setUrgency(level)
                                }}
                                style={({ pressed }) => [
                                    localStyles.urgencyOption,
                                    {
                                        backgroundColor: pressed
                                            ? theme.highlightBG
                                            : "transparent",
                                        borderColor: isSelected
                                            ? isHigh
                                                ? theme.danger
                                                : isMedium
                                                  ? theme.warning
                                                  : theme.success
                                            : theme.border,
                                        borderWidth: isSelected ? 2 : 1,
                                    },
                                ]}
                            >
                                <View style={localStyles.urgencyLeft}>
                                    <MaterialIcons
                                        name={
                                            isSelected
                                                ? "radio-button-checked"
                                                : "radio-button-unchecked"
                                        }
                                        size={24}
                                        color={
                                            isSelected
                                                ? isHigh
                                                    ? theme.danger
                                                    : isMedium
                                                      ? theme.warning
                                                      : theme.success
                                                : theme.icon
                                        }
                                    />
                                    <View style={localStyles.urgencyTextGroup}>
                                        <Text
                                            style={[
                                                localStyles.urgencyLabel,
                                                {
                                                    color: theme.text,
                                                    fontWeight: isSelected
                                                        ? "700"
                                                        : "500",
                                                },
                                            ]}
                                        >
                                            {URGENCY_LABELS[level]}
                                        </Text>
                                        <Text
                                            style={[
                                                localStyles.urgencyDesc,
                                                { color: theme.textSupporting },
                                            ]}
                                        >
                                            {info.description}
                                        </Text>
                                    </View>
                                </View>
                                <MaterialIcons
                                    name={info.icon}
                                    size={20}
                                    color={
                                        isHigh
                                            ? theme.danger
                                            : isMedium
                                              ? theme.warning
                                              : theme.success
                                    }
                                />
                            </Pressable>
                        )
                    })}
                </View>

                {/* Next button */}
                <View style={localStyles.buttonContainer}>
                    <Button
                        text="Next"
                        onPress={handleNext}
                        size="large"
                        primary
                    />
                </View>
            </View>
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
    content: { flex: 1, padding: 20, paddingBottom: 40 },
    stepTitle: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
    optionsContainer: { gap: 12 },
    urgencyOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 20,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    urgencyLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        flex: 1,
    },
    urgencyTextGroup: { gap: 2 },
    urgencyLabel: { fontSize: 17 },
    urgencyDesc: { fontSize: 13 },
    buttonContainer: { marginTop: 24 },
})
