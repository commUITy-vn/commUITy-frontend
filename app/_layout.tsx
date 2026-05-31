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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

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
                                name="modal"
                                options={{ presentation: "modal", title: "Modal" }}
                            />
                        </Stack>
                        <StatusBar style="auto" />
                    </SafeAreaView>
                </ThemeProvider>
            </QueryClientProvider>
        </SafeAreaProvider>
    )
}
