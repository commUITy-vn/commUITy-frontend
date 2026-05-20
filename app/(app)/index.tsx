import React, { useState, useCallback } from "react"
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Pressable,
    Alert,
} from "react-native"
import { useRouter } from "expo-router"
import { useTheme } from "@/hooks/useTheme"
import { useThemeStyles } from "@/hooks/useThemeStyles"
import { SummaryRequestCard } from "@/features/support/components/SummaryRequestCard"
import { useSupportRequests } from "@/features/support/hooks/useSupportRequests"
import { SupportRequestSummaryResponse } from "@/features/support/api/get-support-requests"
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    interpolateColor,
} from "react-native-reanimated"
import Animated from "react-native-reanimated"
import * as Haptics from "expo-haptics"
import { BottomSheet } from "@/components/ui"
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import { useAuthStore } from "@/features/auth/stores/useAuthStore"
import { UserRole } from "@/features/auth/types"

export default function HomeScreen() {
    const theme = useTheme()
    const styles = useThemeStyles()
    const router = useRouter()
    const { user } = useAuthStore()

    // Bottom sheet state
    const [isCreateMenuVisible, setIsCreateMenuVisible] = useState(false)

    // Filter state
    const [activeFilters, setActiveFilters] = useState<string[]>([])

    const toggleFilter = (filter: string) => {
        setActiveFilters((prev) =>
            prev.includes(filter)
                ? prev.filter((f) => f !== filter)
                : [...prev, filter],
        )
    }

    const handleRequestPress = (request: SupportRequestSummaryResponse) => {
        router.push(`/request/${request.id}`)
    }

    // Fetch support requests using the hook
    const { data: requests, isLoading, isError } = useSupportRequests()

    // FAB animation using reanimated (Expensify style rotation)
    const fabRotate = useSharedValue(0)
    const fabScale = useSharedValue(1)
    const fabHovered = useSharedValue(0)

    const fabAnimatedStyle = useAnimatedStyle(() => {
        // Use interpolateColor so the color transitions DURING the rotation
        // not after it ends. When hovering, base color is primaryHover.
        const baseColor = fabHovered.value ? theme.primaryHover : theme.primary
        const backgroundColor = interpolateColor(
            fabRotate.value,
            [0, 1],
            [baseColor, theme.primaryPressed],
        )
        return {
            transform: [
                { rotate: `${fabRotate.value * 135}deg` },
                { scale: fabScale.value },
            ],
            backgroundColor,
        }
    })

    const openFabMenu = () => {
        setIsCreateMenuVisible(true)
        fabRotate.value = withTiming(1, {
            duration: 250,
            easing: Easing.out(Easing.ease),
        })
        fabScale.value = withTiming(0.92, { duration: 100 }, () => {
            fabScale.value = withTiming(1, { duration: 150 })
        })
    }

    const closeFabMenu = () => {
        setIsCreateMenuVisible(false)
        fabRotate.value = withTiming(0, {
            duration: 250,
            easing: Easing.out(Easing.ease),
        })
    }

    // Unwind FAB animation only (without hiding sheet - sheet handles itself)
    const unwindFab = () => {
        fabRotate.value = withTiming(0, {
            duration: 250,
            easing: Easing.out(Easing.ease),
        })
    }

    // Navigate with a small delay so the FAB unwind is visible
    const navigateWithUnwind = useCallback((href: any) => {
        setTimeout(() => {
            router.push(href)
        }, 180) // Slightly less than unwind duration (250ms)
    }, [router])

    return (
        <View style={[styles.container, { backgroundColor: theme.appBG }]}>
            {/* Header / Brand Title - Expensify Style */}
            <View style={localStyles.headerContainer}>
                <Text style={[localStyles.headerText, { color: theme.text }]}>
                    commUITy
                </Text>
            </View>

            {/* Filter Pills - Expensify style horizontal list */}
            <View
                style={[
                    localStyles.filterHeader,
                    { borderBottomColor: theme.border },
                ]}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={localStyles.filterScroll}
                >
                    {["All", "Pending", "Approved", "In Progress", "Fulfilled"].map(
                        (filter) => {
                            const isActive =
                                activeFilters.includes(filter) ||
                                (filter === "All" && activeFilters.length === 0)
                            return (
                                <TouchableOpacity
                                    key={filter}
                                    onPress={() => toggleFilter(filter)}
                                    style={[
                                        filterStyles.pill,
                                        {
                                            backgroundColor: isActive
                                                ? theme.primary
                                                : theme.highlightBG,
                                            borderColor: isActive
                                                ? theme.primary
                                                : theme.border,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            filterStyles.pillText,
                                            {
                                                color: isActive
                                                    ? theme.textLight
                                                    : theme.textSupporting,
                                            },
                                        ]}
                                    >
                                        {filter}
                                    </Text>
                                </TouchableOpacity>
                            )
                        },
                    )}
                </ScrollView>
            </View>

            {/* Main Feed */}
            {isLoading ? (
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : isError ? (
                <View style={styles.container}>
                    <Text
                        style={{
                            textAlign: "center",
                            marginTop: 50,
                            color: theme.textSupporting,
                        }}
                    >
                        Failed to load community requests.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={requests || []}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <SummaryRequestCard
                            request={item}
                            onPress={handleRequestPress}
                        />
                    )}
                    contentContainerStyle={localStyles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* FAB - Expensify style with rotation + scale animation */}
            <Animated.View
                style={[
                    localStyles.fab,
                    fabAnimatedStyle,
                    {
                        borderRadius: 28,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                        elevation: 6,
                    },
                ]}
            >
                <Pressable
                    onPress={async () => {
                        await Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Medium,
                        )
                        if (isCreateMenuVisible) {
                            closeFabMenu()
                        } else {
                            openFabMenu()
                        }
                    }}
                    onHoverIn={() => {
                        fabHovered.value = 1
                    }}
                    onHoverOut={() => {
                        fabHovered.value = 0
                    }}
                    style={({ pressed }) => [
                        {
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            justifyContent: "center",
                            alignItems: "center",
                        },
                    ]}
                >
                    <Ionicons name="add" size={34} color="#FFFFFF" />
                </Pressable>
            </Animated.View>

            {/* Bottom Sheet for FAB options */}
            <BottomSheet
                isVisible={isCreateMenuVisible}
                onClose={closeFabMenu}
                onCloseStart={unwindFab}
                options={[
                    {
                        key: "create-request",
                        label: "Create Support Request",
                        icon: "support",
                        onPress: () => {
                            navigateWithUnwind("/create-request")
                        },
                    },
                    {
                        key: "donate",
                        label: "Make a Donation",
                        icon: "volunteer-activism",
                        onPress: () => {
                            navigateWithUnwind("/finance-dashboard")
                        },
                    },
                    {
                        key: "volunteer",
                        label: "Volunteer",
                        icon: "groups",
                        onPress: () => {
                            navigateWithUnwind("/volunteer-dashboard")
                        },
                    },
                ]}
            />
        </View>
    )
}

/* ---------- Static Styles ---------- */

const filterStyles = StyleSheet.create({
    pill: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    pillText: {
        fontSize: 13,
        fontWeight: "600",
    },
})

const localStyles = StyleSheet.create({
    filterHeader: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    filterScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    listContent: {
        paddingTop: 12,
        paddingBottom: 80,
    },
    fab: {
        position: "absolute",
        bottom: 24,
        right: 24,
        zIndex: 999,
    },
})
