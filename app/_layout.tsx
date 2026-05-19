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
import { useEffect } from "react"
import { Colors } from "@/constants/theme"

const queryClient = new QueryClient()

export const unstable_settings = {
    initialRouteName: "(auth)",
}

export default function RootLayout() {
    const colorScheme = useColorScheme()
    const router = useRouter()
    const segments = useSegments()
    const { isAuthenticated, isLoading, restoreSession } = useAuthStore()
    const theme = Colors[colorScheme ?? "light"]

    // Restore session on mount
    useEffect(() => {
        restoreSession()
    }, [])

    // Handle auth guard
    useEffect(() => {
        if (isLoading) return

        const inAuthGroup = segments[0] === "(auth)"
        const inProtectedGroup = segments[0] === "(app)"

        if (!isAuthenticated && inProtectedGroup) {
            router.replace("/(auth)/login")
        } else if (isAuthenticated && inAuthGroup) {
            router.replace("/(app)" as any)
        }
    }, [isAuthenticated, isLoading, segments])

    if (isLoading) {
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
                    value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
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
                                animation: Platform.select({
                                    ios: "slide_from_right",
                                    android: "slide_from_right",
                                    default: "slide_from_right",
                                }),
                                animationDuration: 250,
                                contentStyle: {
                                    backgroundColor: theme.appBG,
                                },
                            }}
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
                                    animationDuration: 250,
                                    animationTypeForReplace: "pop",
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
