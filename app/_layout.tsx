import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native"
import { useRouter, useSegments } from "expo-router"
import { Stack } from "@/lib/PlatformStack"
import { StatusBar } from "expo-status-bar"
import { View, ActivityIndicator, Platform } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import "react-native-reanimated"
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Pressable, Text } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useGlobalWebSockets } from "@/features/communication/hooks/useGlobalWebSockets"
import { useNotifications } from "@/features/communication/hooks/useNotifications"
import { useToastStore } from "@/stores/useToastStore"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { useAuthStore } from "@/features/auth/stores/useAuthStore"
import { useThemeStore } from "@/stores/useThemeStore"
import { useEffect, useState } from "react"
import { Colors } from "@/constants/theme"
import { storage } from "@/lib/storage"

const queryClient = new QueryClient()

export const unstable_settings = {
    initialRouteName: "(auth)",
}

export default function RootLayout() {
    const systemScheme = useColorScheme() ?? "light"
    const router = useRouter()
    const segments = useSegments()
    const { isAuthenticated, restoreSession } = useAuthStore()
    const { themeMode, loadThemeMode } = useThemeStore()

    const activeScheme = themeMode === 'system' ? systemScheme : themeMode
    const theme = Colors[activeScheme ?? "light"]
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null)
    const [isInitialLoading, setIsInitialLoading] = useState(true)

    // Restore session and theme on mount
    useEffect(() => {
        const init = async () => {
            await restoreSession()
            await loadThemeMode()
            const val = await storage.getItemAsync("has_completed_onboarding")
            setHasCompletedOnboarding(val === "true")
            setIsInitialLoading(false)
        }
        init()
    }, [loadThemeMode])

    // Load onboarding completed state dynamically whenever segments change (user navigates)
    useEffect(() => {
        if (isInitialLoading) return
        const checkOnboarding = async () => {
            const val = await storage.getItemAsync("has_completed_onboarding")
            const completed = val === "true"
            if (completed !== hasCompletedOnboarding) {
                setHasCompletedOnboarding(completed)
            }
        }
        checkOnboarding()
    }, [segments, isInitialLoading, hasCompletedOnboarding])

    // Handle auth guard
    useEffect(() => {
        if (isInitialLoading || hasCompletedOnboarding === null) return

        const inAuthGroup = segments[0] === "(auth)"
        const inProtectedGroup = segments[0] === "(app)"
        const isCurrentlyOnboarding = segments[1] === "onboarding"

        if (!isAuthenticated && inProtectedGroup) {
            if (hasCompletedOnboarding) {
                router.replace("/(auth)/login")
            } else {
                router.replace("/(auth)/onboarding")
            }
        } else if (!isAuthenticated && inAuthGroup && isCurrentlyOnboarding && hasCompletedOnboarding) {
            router.replace("/(auth)/login")
        } else if (isAuthenticated && inAuthGroup) {
            router.replace("/(app)" as any)
        }
    }, [isAuthenticated, isInitialLoading, hasCompletedOnboarding, segments])

    if (isInitialLoading || hasCompletedOnboarding === null) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: theme.appBG,
                }}
            >
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        )
    }

    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider
                    value={activeScheme === "dark" ? DarkTheme : DefaultTheme}
                >
                    <SafeAreaView
                        style={{
                            flex: 1,
                            backgroundColor: theme.appBG,
                        }}
                        edges={
                            Platform.OS === "android"
                                ? ["top", "bottom", "left", "right"]
                                : undefined
                        }
                    >
                        <AppContent theme={theme} />
                        <StatusBar style="auto" />
                    </SafeAreaView>
                </ThemeProvider>
            </QueryClientProvider>
        </SafeAreaProvider>
    )
}

function AppContent({ theme }: { theme: any }) {
    const { isAuthenticated, user } = useAuthStore()
    const segments = useSegments()
    const currentGroup = String(segments[0] || "")
    const currentScreen = String(segments[1] || "index")
    const canShowFloatingNotification =
        currentGroup === "(app)" &&
        ["index", "map", "messages", "profile", "explore"].includes(currentScreen)

    useGlobalWebSockets({
        isAuthenticated,
        userId: user?.id,
    });

    return (
        <View style={{ flex: 1, backgroundColor: theme.appBG }}>
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: Platform.select({
                        ios: "slide_from_right",
                        android: "slide_from_right",
                        default: "slide_from_right",
                    }),
                    contentStyle: {
                        backgroundColor: theme.appBG,
                    },
                } as any}
            >
                <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="(app)"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="create-request"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        animationTypeForReplace: "pop",
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="request/[id]"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="location/[id]"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="messages/[id]"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="volunteer-dashboard"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="requester-dashboard"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="community-funds"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="community-funds/[id]"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="community-funds/create"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="wallet"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="profile-edit"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="my-reports"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="transaction-history"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="collaborator-dashboard"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="create-location"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="notifications"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="payment/payos-return"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="payment/payos-cancel"
                    options={{
                        headerShown: false,
                        animation: Platform.select({
                            ios: "slide_from_right",
                            android: "slide_from_right",
                            default: "slide_from_right",
                        }),
                        contentStyle: {
                            backgroundColor: theme.appBG,
                        },
                    }}
                />
                <Stack.Screen
                    name="modal"
                    options={{ presentation: "modal", title: "Modal" }}
                />
            </Stack>

            <GlobalNotificationButton
                theme={theme}
                isVisible={isAuthenticated && canShowFloatingNotification}
            />

            {/* Premium Global In-App Toast Notification Banner */}
            <ToastAlertOverlay theme={theme} />
        </View>
    );
}

function GlobalNotificationButton({
    theme,
    isVisible,
}: {
    theme: any
    isVisible: boolean
}) {
    const router = useRouter()
    const { data: notifications = [] } = useNotifications(isVisible)
    const unreadCount = notifications.filter((item: any) => !item.isRead).length

    if (!isVisible) return null

    return (
        <Pressable
            onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                router.push("/notifications" as any)
            }}
            style={{
                position: "absolute",
                top: Platform.OS === "ios" ? 12 : 10,
                right: 14,
                width: 42,
                height: 42,
                borderRadius: 21,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.componentBG,
                borderWidth: 1,
                borderColor: theme.border,
                shadowColor: "#000",
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 6,
                zIndex: 50,
            }}
        >
            <MaterialIcons name="notifications" size={22} color={theme.primary} />
            {unreadCount > 0 && (
                <View
                    style={{
                        position: "absolute",
                        top: -2,
                        right: -2,
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        paddingHorizontal: 4,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: theme.danger,
                    }}
                >
                    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </Text>
                </View>
            )}
        </Pressable>
    )
}

function ToastAlertOverlay({ theme }: { theme: any }) {
    const { toast, hideToast } = useToastStore();
    const router = useRouter();

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => {
            hideToast();
        }, toast.duration || 4000);
        return () => clearTimeout(timer);
    }, [toast, hideToast]);

    if (!toast) return null;

    const handlePress = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const url = toast.actionUrl;
        hideToast();
        if (url) {
            router.push(url as any);
        }
    };

    const handleClose = async (e: any) => {
        e.stopPropagation();
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        hideToast();
    };

    const iconName = toast.type === "message" ? "chat" : "notifications";

    return (
        <Animated.View
            entering={FadeInUp.springify().duration(400)}
            exiting={FadeOutUp.duration(300)}
            style={{
                position: "absolute",
                top: Platform.OS === "ios" ? 60 : 24,
                left: 16,
                right: 16,
                zIndex: 9999,
            }}
        >
            <Pressable
                onPress={handlePress}
                style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: theme.componentBG,
                    borderWidth: 1.5,
                    borderColor: theme.border,
                    borderRadius: 16,
                    padding: 12,
                    gap: 12,
                    opacity: pressed ? 0.92 : 1,
                    ...Platform.select({
                        web: {
                            shadowColor: theme.inverse,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 12,
                            elevation: 5,
                            cursor: "pointer",
                        } as any,
                        default: {},
                    }),
                })}
            >
                <View
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: theme.primary + "15",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <MaterialIcons name={iconName} size={20} color={theme.primary} />
                </View>

                <View style={{ flex: 1, gap: 2 }}>
                    <Text
                        style={{
                            color: theme.text,
                            fontSize: 14,
                            fontWeight: "700",
                        }}
                        numberOfLines={1}
                    >
                        {toast.title}
                    </Text>
                    <Text
                        style={{
                            color: theme.textSupporting,
                            fontSize: 12,
                            fontWeight: "500",
                        }}
                        numberOfLines={2}
                    >
                        {toast.description}
                    </Text>
                </View>

                <Pressable
                    onPress={handleClose}
                    style={({ pressed }) => ({
                        padding: 6,
                        borderRadius: 14,
                        backgroundColor: pressed ? theme.highlightBG : "transparent",
                    })}
                >
                    <MaterialIcons name="close" size={18} color={theme.textSupporting} />
                </Pressable>
            </Pressable>
        </Animated.View>
    );
}
