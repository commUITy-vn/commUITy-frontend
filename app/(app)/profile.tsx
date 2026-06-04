import React, { useState } from "react"
import {
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet,
    Modal,
    TextInput,
    Platform,
    Image,
} from "react-native"
import * as Haptics from "expo-haptics"
import { useRouter } from "expo-router"
import { useTheme } from "@/hooks/useTheme"
import { useThemeStyles } from "@/hooks/useThemeStyles"
import { useAuthStore } from "@/features/auth/stores/useAuthStore"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Colors } from "@/constants/theme"
import { useMe } from "@/features/users/hooks/useMe"
import { ConfirmModal, BottomSheet, Button } from "@/components/ui"
import { useThemeStore } from "@/stores/useThemeStore"
import { env } from "@/config/env"

export default function ProfileScreen() {
    const theme = useTheme() || Colors.light // Fallback to light theme if useTheme fails
    const styles = useThemeStyles()
    const router = useRouter()
    const { user: authUser, isAuthenticated, logout } = useAuthStore()
    const { data: userProfile } = useMe()
    const user = userProfile || authUser
    const { themeMode, setThemeMode } = useThemeStore()

    // Profile edit modal state
    const [showEditProfile, setShowEditProfile] = useState(false)
    const [themeSheetVisible, setThemeSheetVisible] = useState(false)
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
    const [editDisplayName, setEditDisplayName] = useState(
        user?.fullName || "",
    )
    const [editEmail, setEditEmail] = useState(user?.email || "")
    const [alertModal, setAlertModal] = useState<{ visible: boolean; title: string; message: string }>({
        visible: false,
        title: "",
        message: "",
    })

    // Mock data for profile details (in real app, this would come from user object)
    const personalDetails = user
    const settingsItems = [
        { key: "profile", title: "Profile", icon: "person" },
        ...(user?.role === 'ADMIN' ? [
            { key: "admin-dashboard", title: "Admin Panel", icon: "security" },
            { key: "collaborator-dashboard", title: "Collaborator Panel", icon: "dashboard" }
        ] : []),
        ...(user?.role === 'COLLABORATOR' ? [
            { key: "collaborator-dashboard", title: "Collaborator Panel", icon: "dashboard" }
        ] : []),
        ...(user?.role === 'VOLUNTEER' ? [
            { key: "volunteer-dashboard", title: "Volunteer Panel", icon: "volunteer-activism" }
        ] : []),
        ...(user?.role === 'REQUESTER' ? [
            { key: "requester-dashboard", title: "Requester Panel", icon: "assignment" }
        ] : []),
        { key: "theme", title: "Appearance: " + (themeMode === 'light' ? 'Light Mode' : themeMode === 'dark' ? 'Dark Mode' : 'System Mode'), icon: themeMode === 'light' ? 'light-mode' : themeMode === 'dark' ? 'dark-mode' : 'brightness-auto' },
        { key: "notifications", title: "Notifications", icon: "notifications" },
        { key: "my-reports", title: "My Reports", icon: "flag" },
        { key: "sign-out", title: "Sign out", icon: "exit-to-app", isDanger: true },
    ]

    const handlePressSettingsItem = async (key: string) => {
        switch (key) {
            case "admin-dashboard":
                router.push("/(admin)/dashboard")
                break
            case "collaborator-dashboard":
                router.push("/collaborator-dashboard")
                break
            case "volunteer-dashboard":
                router.push("/volunteer-dashboard")
                break
            case "requester-dashboard":
                router.push("/requester-dashboard")
                break
            case "sign-out":
                setShowSignOutConfirm(true)
                break
            case "transaction-history":
                router.push("/transaction-history")
                break
            case "notifications":
                router.push("/notifications")
                break
            case "my-reports":
                router.push("/my-reports")
                break
            case "theme":
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setThemeSheetVisible(true)
                break
            case "profile":
                router.push("/profile-edit")
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
                            {(() => {
                                let resolvedAvatarUrl = user?.imageUrl;
                                if (resolvedAvatarUrl && !resolvedAvatarUrl.startsWith('http://') && !resolvedAvatarUrl.startsWith('https://') && !resolvedAvatarUrl.startsWith('file://') && !resolvedAvatarUrl.startsWith('data:')) {
                                    const apiBase = env.API_URL.endsWith('/api') ? env.API_URL.slice(0, -4) : env.API_URL;
                                    const cleanPath = resolvedAvatarUrl.startsWith('/') ? resolvedAvatarUrl : '/' + resolvedAvatarUrl;
                                    resolvedAvatarUrl = `${apiBase}${cleanPath}`;
                                }

                                const isValidImage = resolvedAvatarUrl && 
                                    (resolvedAvatarUrl.startsWith('http://') || resolvedAvatarUrl.startsWith('https://') || resolvedAvatarUrl.startsWith('file://') || resolvedAvatarUrl.startsWith('data:')) &&
                                    !resolvedAvatarUrl.includes('pravatar.cc');

                                if (isValidImage) {
                                    return (
                                        <Image
                                            source={{ uri: resolvedAvatarUrl }}
                                            style={{ width: 80, height: 80, borderRadius: 40 }}
                                        />
                                    );
                                }

                                return (
                                    <Text
                                        style={[
                                            localStyles.avatarText,
                                            { color: theme.textLight },
                                        ]}
                                    >
                                        {personalDetails?.fullName?.[0] ?? "U"}
                                    </Text>
                                );
                            })()}
                        </View>
                    </View>
                    <View style={localStyles.profileInfo}>
                        <Text
                            style={[
                                localStyles.profileName,
                                { color: theme.text },
                            ]}
                        >
                            {personalDetails?.fullName ?? "User Name"}
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

                {/* Settings Menu */}
                <View style={[localStyles.settingsSection, { marginTop: 8 }]}>
                    {settingsItems.map((item, index) => (
                        <Pressable
                            key={item.key}
                            onPress={() => handlePressSettingsItem(item.key)}
                            style={({ pressed }) => [
                                localStyles.settingsItem,
                                {
                                    borderBottomWidth: StyleSheet.hairlineWidth,
                                    borderColor: theme.border,
                                    backgroundColor: pressed ? theme.highlightBG : 'transparent',
                                },
                                index === 0 && {
                                    borderTopWidth: StyleSheet.hairlineWidth,
                                }
                            ]}
                        >
                            <View style={localStyles.settingsItemContent}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                    <MaterialIcons
                                        name={item.icon as any}
                                        size={22}
                                        color={item.isDanger ? theme.danger : theme.textSupporting}
                                    />
                                    <Text
                                        style={[
                                            localStyles.settingsItemText,
                                            { color: item.isDanger ? theme.danger : theme.text },
                                        ]}
                                    >
                                        {item.title}
                                    </Text>
                                </View>
                                <MaterialIcons
                                    name="chevron-right"
                                    size={24}
                                    color={theme.icon}
                                />
                            </View>
                        </Pressable>
                    ))}
                </View>

                {/* Donate to Community Fund Link - clean text link format */}
                <View style={localStyles.donateLinkContainer}>
                    <Pressable
                        onPress={async () => {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            router.push('/community-funds' as any);
                        }}
                        style={({ pressed }) => [
                            pressed && { opacity: 0.7 }
                        ]}
                    >
                        <Text
                            style={[
                                localStyles.donateLinkText,
                                { color: theme.primary }
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

            {/* Theme Selector Bottom Sheet */}
            <BottomSheet
                isVisible={themeSheetVisible}
                onClose={() => setThemeSheetVisible(false)}
                title="Choose Theme"
                options={[
                    {
                        key: 'light',
                        label: 'Light Mode',
                        icon: 'light-mode',
                        onPress: async () => {
                            await setThemeMode('light')
                        },
                    },
                    {
                        key: 'dark',
                        label: 'Dark Mode',
                        icon: 'dark-mode',
                        onPress: async () => {
                            await setThemeMode('dark')
                        },
                    },
                    {
                        key: 'system',
                        label: 'System Mode',
                        icon: 'brightness-auto',
                        onPress: async () => {
                            await setThemeMode('system')
                        },
                    },
                ]}
            />

            {/* Custom Confirmation Modal for Logout */}
            <ConfirmModal
                visible={showSignOutConfirm}
                title="Sign out"
                message="Are you sure you want to sign out?"
                confirmText="Sign out"
                cancelText="Cancel"
                isDestructive={true}
                onConfirm={async () => {
                    setShowSignOutConfirm(false)
                    await logout()
                }}
                onCancel={() => setShowSignOutConfirm(false)}
            />

            {/* Custom Alert Modal for info/mock dialogs */}
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
    )
}

const localStyles = StyleSheet.create({
    divider: {
        height: 1,
        marginVertical: 16,
    },
    profileHeader: {
        paddingTop: 16,
        paddingBottom: 8,
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
        marginVertical: 0,
        marginTop: 4,
        marginBottom: 12,
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
    donateLinkContainer: {
        marginTop: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    donateLinkText: {
        fontSize: 16,
        fontWeight: "600",
        textDecorationLine: "underline",
    },
})
