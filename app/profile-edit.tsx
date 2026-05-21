import React, { useState } from "react"
import {
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from "react-native"
import { useRouter } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useTheme } from "@/hooks/useTheme"
import { useAuthStore } from "@/features/auth/stores/useAuthStore"
import TextInput from "@/components/ui/TextInput"
import { Button } from "@/components/ui"

export default function ProfileEditScreen() {
    const router = useRouter()
    const theme = useTheme()
    const { user } = useAuthStore()

    const [displayName, setDisplayName] = useState(user?.fullName || "")
    const [email, setEmail] = useState(user?.email || "")

    const handleSave = async () => {
        await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
        )
        // TODO: API call to update profile
        router.back()
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.appBG }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
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
                        size={28}
                        color={theme.primary}
                    />
                </Pressable>
                <Text style={[localStyles.headerTitle, { color: theme.text }]}>
                    Edit Profile
                </Text>
                <Pressable onPress={handleSave} style={localStyles.saveButton}>
                    <Text
                        style={[localStyles.saveText, { color: theme.primary }]}
                    >
                        Save
                    </Text>
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={localStyles.content}
                keyboardShouldPersistTaps="handled"
            >
                {/* Avatar */}
                <View style={localStyles.avatarSection}>
                    <View
                        style={[
                            localStyles.avatar,
                            { backgroundColor: theme.primary },
                        ]}
                    >
                        <Text
                            style={[
                                localStyles.avatarText,
                                { color: theme.textLight },
                            ]}
                        >
                            {displayName?.[0] || user?.fullName?.[0] || "U"}
                        </Text>
                    </View>
                    <Pressable style={localStyles.changePhotoBtn}>
                        <Text
                            style={[
                                localStyles.changePhotoText,
                                { color: theme.primary },
                            ]}
                        >
                            Change photo
                        </Text>
                    </Pressable>
                </View>

                <TextInput
                    label="Display name"
                    value={displayName}
                    onChangeText={setDisplayName}
                />

                <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />

                <View style={localStyles.buttonContainer}>
                    <Button
                        text="Save Changes"
                        onPress={handleSave}
                        size="large"
                        primary
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
    saveButton: { padding: 12 },
    saveText: { fontSize: 16, fontWeight: "600" },
    content: { padding: 20, gap: 12, paddingBottom: 40 },
    avatarSection: { alignItems: "center", marginBottom: 16, gap: 12 },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: { fontSize: 32, fontWeight: "700" },
    changePhotoBtn: { padding: 4 },
    changePhotoText: { fontSize: 15, fontWeight: "600" },
    buttonContainer: { marginTop: 20 },
})
