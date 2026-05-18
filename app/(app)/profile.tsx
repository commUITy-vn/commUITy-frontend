import React, { useState } from "react"
import {
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet,
    Modal,
    TextInput,
} from "react-native"
import * as Haptics from "expo-haptics"
import { useRouter } from "expo-router"
import { useTheme } from "@/hooks/useTheme"
import { useThemeStyles } from "@/hooks/useThemeStyles"
import { useAuthStore } from "@/features/auth/stores/useAuthStore"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Alert } from "react-native"
import { Colors } from "@/constants/theme"

export default function ProfileScreen() {
    const theme = useTheme() || Colors.light // Fallback to light theme if useTheme fails
    const styles = useThemeStyles()
    const router = useRouter()
    const { user, isAuthenticated, logout } = useAuthStore()

    // Profile edit modal state
    const [showEditProfile, setShowEditProfile] = useState(false)
    const [editDisplayName, setEditDisplayName] = useState(
        user?.displayName || "",
    )
    const [editEmail, setEditEmail] = useState(user?.email || "")

    // Mock data for profile details (in real app, this would come from user object)
    const personalDetails = user
    const settingsItems = [
        { key: "profile", title: "Profile" },
        { key: "wallet", title: "Wallet" },
        { key: "rules", title: "Rules" },
        { key: "preferences", title: "Preferences" },
        { key: "security", title: "Security" },
        { key: "help", title: "Help" },
        { key: "whats-new", title: "What's New" },
        { key: "about", title: "About" },
        { key: "troubleshoot", title: "Troubleshoot" },
        { key: "save-the-world", title: "Save the World" },
        { key: "transaction-history", title: "Transaction History" },
        { key: "backup-restore", title: "Backup & Restore" },
        { key: "sign-out", title: "Sign out" },
    ]

    const handlePressSettingsItem = async (key: string) => {
        switch (key) {
            case "sign-out":
                Alert.alert("Sign out", "Are you sure you want to sign out?", [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Sign out",
                        onPress: async () => {
                            await Haptics.notificationAsync(
                                Haptics.NotificationFeedbackType.Success,
                            )
                            await logout()
                            router.replace("/(auth)/login")
                        },
                    },
                ])
                break
            case "transaction-history":
                router.push("/(app)/finance-dashboard")
                break
            case "backup-restore":
                Alert.alert(
                    "Backup & Restore",
                    "Backup & Restore screen coming soon!",
                )
                break
            case "preferences":
                Alert.alert("Preferences", "Preferences screen coming soon!")
                break
            case "help":
                Alert.alert("Help", "Help screen coming soon!")
                break
            case "whats-new":
                Alert.alert("What's New", "What's New screen coming soon!")
                break
            case "about":
                Alert.alert("About", "About screen coming soon!")
                break
            case "troubleshoot":
                Alert.alert("Troubleshoot", "Troubleshoot screen coming soon!")
                break
            case "save-the-world":
                Alert.alert(
                    "Save the World",
                    "Save the World screen coming soon!",
                )
                break
            case "profile":
                router.push("/(app)/profile-edit")
                break
            case "wallet":
                router.push("/(app)/finance-dashboard")
                break
            case "rules":
                Alert.alert("Rules", "Rules screen coming soon!")
                break
            case "security":
                Alert.alert("Security", "Security screen coming soon!")
                break
            default:
                break
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.appBG }}>
            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 12,
                    paddingBottom: 80,
                    gap: 24,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Avatar and Info - Expensify style */}
                <View style={localStyles.profileHeader}>
                    <View style={localStyles.avatarContainer}>
                        <View
                            style={[
                                localStyles.avatarPlaceholder,
                                { backgroundColor: theme.primary },
                            ]}
                        >
                            <Text
                                style={[
                                    localStyles.avatarText,
                                    { color: theme.textLight },
                                ]}
                            >
                                {personalDetails?.displayName?.[0] ?? "U"}
                            </Text>
                        </View>
                    </View>
                    <View style={localStyles.profileInfo}>
                        <Text
                            style={[
                                localStyles.profileName,
                                { color: theme.text },
                            ]}
                        >
                            {personalDetails?.displayName ?? "User Name"}
                        </Text>
                        <Text
                            style={[
                                localStyles.profileEmail,
                                { color: theme.textSupporting },
                            ]}
                        >
                            {personalDetails?.email ?? "user@example.com"}
                        </Text>
                    </View>
                </View>

                {/* Stats Section */}
                <View style={localStyles.statsSection}>
                    <View style={localStyles.statsItem}>
                        <Text
                            style={[
                                localStyles.statsValue,
                                { color: theme.primary },
                            ]}
                        >
                            8
                        </Text>
                        <Text
                            style={[
                                localStyles.statsLabel,
                                { color: theme.textSupporting },
                            ]}
                        >
                            Donations
                        </Text>
                    </View>
                    <View style={localStyles.statsDivider} />
                    <View style={localStyles.statsItem}>
                        <Text
                            style={[
                                localStyles.statsValue,
                                { color: theme.success },
                            ]}
                        >
                            1.050.000đ
                        </Text>
                        <Text
                            style={[
                                localStyles.statsLabel,
                                { color: theme.textSupporting },
                            ]}
                        >
                            Total Given
                        </Text>
                    </View>
                </View>

                {/* Divider */}
                <View style={localStyles.divider} />

                {/* Settings Menu */}
                <View style={localStyles.settingsSection}>
                    {settingsItems.map((item) => (
                        <Pressable
                            key={item.key}
                            onPress={() => handlePressSettingsItem(item.key)}
                            style={[
                                localStyles.settingsItem,
                                {
                                    borderBottomWidth: StyleSheet.hairlineWidth,
                                    borderColor: theme.border,
                                },
                            ]}
                        >
                            <View style={localStyles.settingsItemContent}>
                                <Text
                                    style={[
                                        localStyles.settingsItemText,
                                        { color: theme.text },
                                    ]}
                                >
                                    {item.title}
                                </Text>
                                <MaterialIcons
                                    name="chevron-right"
                                    size={24}
                                    color={theme.icon}
                                />
                            </View>
                        </Pressable>
                    ))}
                </View>

                {/* Floating Donate Button - Expensify style */}
                <View style={localStyles.floatingButtonContainer}>
                    <Pressable
                        onPress={() => {
                            // TODO: Show donation modal
                            Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Medium,
                            )
                            Alert.alert("Donate", "Donation flow coming soon!")
                        }}
                    >
                        <Text
                            style={[
                                localStyles.floatingButtonText,
                                { color: theme.textLight },
                            ]}
                        >
                            Donate to Community Fund
                        </Text>
                    </Pressable>
                </View>

                {/* Version Info - Expensify style */}
                <View style={localStyles.versionContainer}>
                    <Text
                        style={[
                            localStyles.versionText,
                            { color: theme.textSupporting },
                        ]}
                    >
                        Version 1.0.0
                    </Text>
                </View>
            </ScrollView>

            {/* Profile Edit Modal */}
            <Modal
                visible={showEditProfile}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowEditProfile(false)}
            >
                <View style={{ flex: 1, backgroundColor: theme.appBG }}>
                    <View
                        style={[
                            localStyles.modalHeader,
                            { borderBottomColor: theme.border },
                        ]}
                    >
                        <Pressable onPress={() => setShowEditProfile(false)}>
                            <MaterialIcons
                                name="close"
                                size={24}
                                color={theme.text}
                            />
                        </Pressable>
                        <Text
                            style={[
                                localStyles.modalTitle,
                                { color: theme.text },
                            ]}
                        >
                            Edit Profile
                        </Text>
                        <Pressable
                            onPress={async () => {
                                await Haptics.impactAsync(
                                    Haptics.ImpactFeedbackStyle.Light,
                                )
                                setShowEditProfile(false)
                            }}
                        >
                            <Text
                                style={{
                                    color: theme.primary,
                                    fontSize: 16,
                                    fontWeight: "600",
                                }}
                            >
                                Save
                            </Text>
                        </Pressable>
                    </View>
                    <View style={{ padding: 20, gap: 20 }}>
                        <View>
                            <Text
                                style={{
                                    color: theme.textSupporting,
                                    fontSize: 13,
                                    marginBottom: 8,
                                }}
                            >
                                Display Name
                            </Text>
                            <TextInput
                                style={[
                                    localStyles.editInput,
                                    {
                                        color: theme.text,
                                        borderColor: theme.border,
                                        backgroundColor: theme.highlightBG,
                                    },
                                ]}
                                value={editDisplayName}
                                onChangeText={setEditDisplayName}
                                placeholder="Enter your display name"
                                placeholderTextColor={theme.placeholderText}
                            />
                        </View>
                        <View>
                            <Text
                                style={{
                                    color: theme.textSupporting,
                                    fontSize: 13,
                                    marginBottom: 8,
                                }}
                            >
                                Email
                            </Text>
                            <TextInput
                                style={[
                                    localStyles.editInput,
                                    {
                                        color: theme.text,
                                        borderColor: theme.border,
                                        backgroundColor: theme.highlightBG,
                                    },
                                ]}
                                value={editEmail}
                                onChangeText={setEditEmail}
                                placeholder="Enter your email"
                                placeholderTextColor={theme.placeholderText}
                                keyboardType="email-address"
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const localStyles = StyleSheet.create({
    profileHeader: {
        paddingVertical: 24,
        alignItems: "center",
    },
    avatarContainer: {
        alignItems: "center",
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontSize: 28,
        fontWeight: "bold",
    },
    profileInfo: {
        marginTop: 12,
        alignItems: "center",
    },
    profileName: {
        fontSize: 24,
        fontWeight: "600",
    },
    profileEmail: {
        fontSize: 14,
        marginTop: 4,
    },
    statsSection: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginVertical: 24,
    },
    statsItem: {
        alignItems: "center",
    },
    statsValue: {
        fontSize: 20,
        fontWeight: "bold",
    },
    statsLabel: {
        fontSize: 14,
    },
    statsDivider: {
        width: 1,
        height: 40,
        backgroundColor: "#E2E8F0",
    },
    settingsSection: {
        marginTop: 16,
    },
    settingsItem: {
        paddingVertical: 16,
        paddingHorizontal: 0,
    },
    settingsItemContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    settingsItemText: {
        fontSize: 16,
        fontWeight: "500",
    },
    floatingButtonContainer: {
        position: "absolute",
        bottom: 24,
        left: 24,
        right: 24,
    },
    floatingButtonText: {
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
    },
    versionContainer: {
        marginTop: 40,
        alignItems: "center",
    },
    versionText: {
        fontSize: 12,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
    },
    editInput: {
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 12,
        fontSize: 16,
        paddingVertical: 0,
    },
})
