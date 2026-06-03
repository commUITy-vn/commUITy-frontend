import React, { useState, useRef } from "react"
import {
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Image,
    ActivityIndicator,
} from "react-native"
import { useRouter } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import * as ImagePicker from "expo-image-picker"
import { useTheme } from "@/hooks/useTheme"
import { useAuthStore } from "@/features/auth/stores/useAuthStore"
import TextInput from "@/components/ui/TextInput"
import { Button } from "@/components/ui"
import { updateMe } from "@/features/users/api/update-me"
import { getUserProfile } from "@/features/auth/api/get-user-profile"
import { api } from "@/lib/api-client"
import { storage } from "@/lib/storage"
import { useQueryClient } from "@tanstack/react-query"

export default function ProfileEditScreen() {
    const router = useRouter()
    const theme = useTheme()
    const queryClient = useQueryClient()
    const { user } = useAuthStore()

    const [displayName, setDisplayName] = useState(user?.fullName || "")
    const [phone, setPhone] = useState(user?.phone || "")
    const [avatarUrl, setAvatarUrl] = useState(user?.imageUrl || "")

    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState("")

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handlePickAvatar = async () => {
        if (Platform.OS === 'web') {
            fileInputRef.current?.click()
            return
        }

        setError("")
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permission.granted) {
            setError("Photo access is required to choose an avatar.")
            return
        }

        setIsUploading(true)
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            })
            if (result.canceled || !result.assets?.[0]) return

            const asset = result.assets[0]
            const mimeType = asset.mimeType || "image/jpeg"
            const fileUrl = asset.uri

            const mediaRes = await api.post<any>('/api/v1/media', {
                fileName: asset.fileName || `avatar-${Date.now()}.jpg`,
                fileUrl,
                fileType: 'IMAGE',
                mimeType,
                fileSize: asset.fileSize,
                altText: displayName || user?.fullName || 'Avatar',
                isPublic: true,
            })
            setAvatarUrl(mediaRes.fileUrl || fileUrl)
        } catch (err: any) {
            console.error("Failed to pick avatar image:", err)
            setError(err?.message || "Failed to choose image.")
        } finally {
            setIsUploading(false)
        }
    }

    const handleFileChange = async (e: any) => {
        if (Platform.OS !== 'web') return;
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        setError("");
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const localUrl = URL.createObjectURL(file);
            const createPayload = {
                fileName: file.name,
                fileUrl: localUrl,
                fileType: 'IMAGE',
                mimeType: file.type || 'image/jpeg',
                fileSize: file.size,
                altText: file.name,
                isPublic: true,
            };
            const mediaRes = await api.post<any>('/api/v1/media', createPayload);
            setAvatarUrl(mediaRes.fileUrl || localUrl);
        } catch (err: any) {
            console.error("Failed to upload avatar image:", err);
            setError("Failed to upload image. Please try entering a URL instead.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        setError("");
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            
            // 1. Call API to update profile
            await updateMe({
                fullName: displayName,
                phone: phone,
                avatarUrl: avatarUrl,
            });

            // 2. Fetch fresh profile from /me
            const freshUser = await getUserProfile();

            // 3. Update secure storage and Zustand store
            const STORAGE_KEY_USER = 'auth_user';
            await storage.setItemAsync(STORAGE_KEY_USER, JSON.stringify(freshUser));
            
            useAuthStore.setState({ user: freshUser });
            queryClient.setQueryData(['users', 'me'], freshUser);
            queryClient.invalidateQueries({ queryKey: ['users', 'me'] });

            await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
            );
            router.back();
        } catch (err: any) {
            console.error("Failed to save profile:", err);
            setError(err?.message || "Failed to update profile. Please check your network and try again.");
            await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning,
            );
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.appBG }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            {Platform.OS === 'web' && (
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept="image/*"
                />
            )}

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
                <Pressable onPress={handleSave} style={localStyles.saveButton} disabled={isSaving}>
                    {isSaving ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                        <Text
                            style={[localStyles.saveText, { color: theme.primary }]}
                        >
                            Save
                        </Text>
                    )}
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={localStyles.content}
                keyboardShouldPersistTaps="handled"
            >
                {error ? (
                    <View style={{ backgroundColor: theme.danger + '15', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.danger, marginBottom: 8 }}>
                        <Text style={{ color: theme.danger, fontSize: 14 }}>{error}</Text>
                    </View>
                ) : null}

                {/* Avatar */}
                <View style={localStyles.avatarSection}>
                    <Pressable 
                        onPress={handlePickAvatar}
                        style={[
                            localStyles.avatar,
                            { backgroundColor: theme.primary },
                        ]}
                    >
                        {avatarUrl ? (
                            <Image
                                source={{ uri: avatarUrl }}
                                style={{ width: 80, height: 80, borderRadius: 40 }}
                            />
                        ) : (
                            <Text
                                style={[
                                    localStyles.avatarText,
                                    { color: theme.textLight },
                                ]}
                            >
                                {displayName?.[0] || user?.fullName?.[0] || "U"}
                            </Text>
                        )}
                    </Pressable>
                    <Pressable 
                        onPress={handlePickAvatar}
                        style={localStyles.changePhotoBtn}
                    >
                        <Text
                            style={[
                                localStyles.changePhotoText,
                                { color: theme.primary },
                            ]}
                        >
                            {isUploading ? "Uploading..." : "Change photo"}
                        </Text>
                    </Pressable>
                </View>

                <TextInput
                    label="Display name"
                    value={displayName}
                    onChangeText={setDisplayName}
                />

                <TextInput
                    label="Phone number"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />

                <TextInput
                    label="Avatar URL"
                    value={avatarUrl}
                    onChangeText={setAvatarUrl}
                />

                <View style={localStyles.buttonContainer}>
                    <Button
                        text={isSaving ? "Saving..." : "Save Changes"}
                        onPress={handleSave}
                        size="large"
                        primary
                        disabled={isSaving}
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
        overflow: 'hidden',
    },
    avatarText: { fontSize: 32, fontWeight: "700" },
    changePhotoBtn: { padding: 4 },
    changePhotoText: { fontSize: 15, fontWeight: "600" },
    buttonContainer: { marginTop: 20 },
})
