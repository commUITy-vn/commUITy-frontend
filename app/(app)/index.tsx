import React, { useState, useCallback, useMemo } from "react"
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Pressable,
    Platform,
    TextInput as RNTextInput,
    Linking,
} from "react-native"
import { useRouter, useFocusEffect } from "expo-router"
import { useTheme } from "@/hooks/useTheme"
import { useThemeStyles } from "@/hooks/useThemeStyles"
import { useSupportRequests } from "@/features/support/hooks/useSupportRequests"
import { useCommunityFunds } from "@/features/finance/hooks/useCommunityFunds"
import { useSupportLocations } from "@/features/maps/hooks/useSupportLocations"
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    interpolateColor,
} from "react-native-reanimated"
import Animated from "react-native-reanimated"
import * as Haptics from "expo-haptics"
import { BottomSheet, TextInput, Button } from "@/components/ui"
import { Modal } from "react-native"
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons"
import { useAuthStore } from "@/features/auth/stores/useAuthStore"
import { UserRole } from "@/features/auth/types"

// Conditional imports for WebView/Leaflet
let WebView: any
if (Platform.OS !== "web") {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        WebView = require("react-native-webview").WebView
    } catch (e) {
        console.warn("WebView failed to load on non-web platform:", e)
    }
}

interface UnifiedFeedItem {
    id: string;
    itemType: 'request' | 'fund' | 'location';
    title?: string;
    name?: string;
    description?: string;
    categoryName?: string;
    status?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    contactPhone?: string;
    totalBalance?: number;
    isActive?: boolean;
    createdByName?: string;
    createdAt: string;
}

export default function HomeScreen() {
    const theme = useTheme()
    const styles = useThemeStyles()
    const router = useRouter()
    const { user } = useAuthStore()

    // FAB / Bottom sheet state
    const [isCreateMenuVisible, setIsCreateMenuVisible] = useState(false)



    // Two-Tier Filters State
    const [primaryFilter, setPrimaryFilter] = useState<'All' | 'Requests' | 'Funds' | 'Locations'>('All')
    const [secondaryFilter, setSecondaryFilter] = useState<string>('All')
    const [searchQuery, setSearchQuery] = useState("")

    const isStaff = user?.role === UserRole.ADMIN || user?.role === UserRole.COLLABORATOR

    // Query all three datasets
    const { data: requests, isLoading: isRequestsLoading, isError: isRequestsError, refetch: refetchRequests } = useSupportRequests()
    const { data: funds, isLoading: isFundsLoading, isError: isFundsError, refetch: refetchFunds } = useCommunityFunds()
    const { data: locations, isLoading: isLocationsLoading, isError: isLocationsError, refetch: refetchLocations } = useSupportLocations()

    useFocusEffect(
        useCallback(() => {
            refetchRequests()
            refetchFunds()
            refetchLocations()
        }, [refetchRequests, refetchFunds, refetchLocations])
    )

    const isLoading = isRequestsLoading || isFundsLoading || isLocationsLoading
    const isError = isRequestsError || isFundsError || isLocationsError

    // Map datasets into a single unified format
    const unifiedItems = useMemo<UnifiedFeedItem[]>(() => {
        const items: UnifiedFeedItem[] = []

        if (requests) {
            requests.forEach((r) => {
                // Visibility rules: hide PENDING/REJECTED requests from volunteer/public unless owned
                const isOwner = user && r.requesterId === user.id
                if ((r.status === 'PENDING' || r.status === 'REJECTED') && !isOwner && !isStaff) {
                    return
                }
                items.push({
                    id: r.id,
                    itemType: 'request',
                    title: r.title,
                    categoryName: r.categoryName,
                    status: r.status,
                    address: r.address,
                    latitude: r.latitude,
                    longitude: r.longitude,
                    createdAt: r.createdAt,
                })
            })
        }

        if (funds) {
            funds.forEach((f) => {
                items.push({
                    id: f.id,
                    itemType: 'fund',
                    name: f.name,
                    description: f.description,
                    totalBalance: typeof f.totalBalance === 'number' ? f.totalBalance : parseFloat(f.totalBalance as any || '0'),
                    isActive: f.isActive,
                    createdByName: f.createdByName,
                    createdAt: f.createdAt,
                })
            })
        }

        if (locations) {
            locations.forEach((l) => {
                items.push({
                    id: l.id,
                    itemType: 'location',
                    name: l.name,
                    description: l.description,
                    address: l.address,
                    latitude: l.latitude,
                    longitude: l.longitude,
                    contactPhone: l.contactPhone,
                    isActive: l.isActive,
                    createdAt: l.createdAt,
                })
            })
        }

        // Sort chronologically in descending order
        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [requests, funds, locations, user, isStaff])

    // Filter unified feed based on selector states
    const filteredFeed = useMemo(() => {
        return unifiedItems.filter((item) => {
            // 1. Primary Filter Match
            if (primaryFilter === 'Requests' && item.itemType !== 'request') return false
            if (primaryFilter === 'Funds' && item.itemType !== 'fund') return false
            if (primaryFilter === 'Locations' && item.itemType !== 'location') return false

            // 2. Secondary Filter Match
            if (secondaryFilter !== 'All') {
                if (item.itemType === 'request') {
                    if (item.status !== secondaryFilter) return false
                } else if (item.itemType === 'fund' || item.itemType === 'location') {
                    const activeMatch = secondaryFilter === 'Active' ? true : false
                    if (item.isActive !== activeMatch) return false
                }
            }

            // 3. Search Query Match
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase()
                const titleMatch = item.title?.toLowerCase().includes(query) || false
                const nameMatch = item.name?.toLowerCase().includes(query) || false
                const addressMatch = item.address?.toLowerCase().includes(query) || false
                const categoryMatch = item.categoryName?.toLowerCase().includes(query) || false
                if (!titleMatch && !nameMatch && !addressMatch && !categoryMatch) {
                    return false
                }
            }

            return true
        })
    }, [unifiedItems, primaryFilter, secondaryFilter, searchQuery])

    // Reset secondary filter when primary tab switches
    const handlePrimaryFilterChange = async (tab: 'All' | 'Requests' | 'Funds' | 'Locations') => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        setPrimaryFilter(tab)
        setSecondaryFilter('All')
    }

    // Secondary Filter Options depending on selected primary tab
    const secondaryOptions = useMemo(() => {
        if (primaryFilter === 'Requests') {
            return ['All', 'APPROVED', 'IN_PROGRESS', 'FULFILLED', ...(isStaff ? ['PENDING'] : [])]
        }
        if (primaryFilter === 'Funds' || primaryFilter === 'Locations') {
            return ['All', 'Active', 'Inactive']
        }
        return []
    }, [primaryFilter, isStaff])

    // Simulated progress tracker helper for Help Request Cards
    const getSimulatedProgress = (status?: string) => {
        switch (status) {
            case 'FULFILLED':
            case 'COMPLETED':
                return 100
            case 'IN_PROGRESS': return 65
            case 'APPROVED':
            case 'ACCEPTED':
                return 30
            default: return 0
        }
    }

    // Interactive Leaflet static mini preview map
    const getMiniMapHtml = (latitude?: number, longitude?: number) => {
        const lat = latitude || 21.028511
        const lng = longitude || 105.804817
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                <style>
                    html, body { margin: 0; padding: 0; height: 100%; width: 100%; background-color: ${theme.highlightBG}; overflow: hidden; }
                    #map { height: 100%; width: 100%; }
                </style>
            </head>
            <body>
                <div id="map"></div>
                <script>
                    var map = L.map('map', {
                        zoomControl: false,
                        dragging: false,
                        scrollWheelZoom: false,
                        doubleClickZoom: false,
                        touchZoom: false,
                        boxZoom: false,
                        keyboard: false
                    }).setView([${lat}, ${lng}], 14);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19
                    }).addTo(map);
                    L.marker([${lat}, ${lng}]).addTo(map);
                </script>
            </body>
            </html>
        `
    }

    // Render Help Request Card Component
    const renderRequestCard = (item: UnifiedFeedItem) => {
        const progress = getSimulatedProgress(item.status)
        const isPending = item.status === 'PENDING'
        const isApproved = item.status === 'APPROVED' || item.status === 'ACCEPTED'
        const isInProgress = item.status === 'IN_PROGRESS'
        const isFulfilled = item.status === 'FULFILLED' || item.status === 'COMPLETED'

        let statusText = item.status || 'PENDING'
        let statusColor = theme.textSupporting
        let statusBg = theme.highlightBG

        if (isPending) {
            statusColor = theme.textSupporting
            statusBg = theme.highlightBG
        } else if (isApproved) {
            statusColor = theme.success
            statusBg = theme.success + "20"
        } else if (isInProgress) {
            statusColor = theme.primary
            statusBg = theme.primary + "20"
        } else if (isFulfilled) {
            statusColor = theme.success
            statusBg = theme.success + "20"
        }

        return (
            <Pressable
                key={item.id}
                onPress={() => router.push(`/request/${item.id}`)}
                style={({ pressed }) => [
                    cardStyles.card,
                    { backgroundColor: theme.componentBG, borderColor: theme.border, shadowColor: theme.inverse },
                    pressed && { backgroundColor: theme.hoverComponentBG },
                ]}
            >
                <View style={cardStyles.headerRow}>
                    <View style={cardStyles.tagRow}>
                        <View style={[cardStyles.typeBadge, { backgroundColor: theme.primary + "15" }]}>
                            <MaterialIcons name="support" size={14} color={theme.primary} />
                            <Text style={[cardStyles.typeBadgeText, { color: theme.primary }]}>Help Request</Text>
                        </View>
                        <View style={[cardStyles.catBadge, { backgroundColor: theme.highlightBG, borderColor: theme.border }]}>
                            <Text style={[cardStyles.catBadgeText, { color: theme.textSupporting }]}>{item.categoryName}</Text>
                        </View>
                    </View>
                    <View style={[cardStyles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[cardStyles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
                    </View>
                </View>

                <Text style={[cardStyles.title, { color: theme.text }]} numberOfLines={2}>
                    {item.title}
                </Text>

                <View style={cardStyles.addressRow}>
                    <Ionicons name="location" size={16} color={theme.textSupporting} />
                    <Text style={[cardStyles.addressText, { color: theme.textSupporting }]} numberOfLines={1}>
                        {item.address || "No Address Provided"}
                    </Text>
                </View>

                {/* Simulated Progress bar */}
                <View style={cardStyles.progressContainer}>
                    <View style={cardStyles.progressLabelRow}>
                        <Text style={[cardStyles.progressLabel, { color: theme.textSupporting }]}>Items Completion</Text>
                        <Text style={[cardStyles.progressPercent, { color: theme.text }]}>{progress}%</Text>
                    </View>
                    <View style={[cardStyles.progressBarBG, { backgroundColor: theme.border }]}>
                        <View
                            style={[
                                cardStyles.progressBarFill,
                                {
                                    width: `${progress}%`,
                                    backgroundColor: progress === 100 ? theme.success : theme.primary,
                                },
                            ]}
                        />
                    </View>
                </View>
            </Pressable>
        )
    }

    // Render Community Fund Card Component (Premium Metal Wallet style)
    const renderFundCard = (item: UnifiedFeedItem) => {
        const isDark = theme.appBG === '#0F172A';
        const fundColor = isDark ? '#A78BFA' : '#7C3AED';
        const fundBg = isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(124, 58, 237, 0.12)';

        return (
            <Pressable
                key={item.id}
                onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                    router.push({ pathname: '/community-funds/[id]', params: { id: item.id } } as any)
                }}
                style={({ pressed }) => [
                    cardStyles.card,
                    {
                        backgroundColor: theme.componentBG,
                        borderColor: theme.border,
                        shadowColor: theme.inverse,
                        overflow: 'hidden',
                        padding: 0,
                        opacity: pressed ? 0.95 : 1,
                    },
                ]}
            >
                <View style={{ padding: 16 }}>
                    <View style={cardStyles.headerRow}>
                        <View style={[cardStyles.typeBadge, { backgroundColor: fundBg }]}>
                            <Ionicons name="wallet-outline" size={14} color={fundColor} />
                            <Text style={[cardStyles.typeBadgeText, { color: fundColor }]}>Community Fund</Text>
                        </View>
                        <View style={[cardStyles.statusBadge, { backgroundColor: item.isActive ? theme.success + "20" : theme.danger + "20" }]}>
                            <Text style={[cardStyles.statusBadgeText, { color: item.isActive ? theme.success : theme.danger }]}>
                                {item.isActive ? "ACTIVE" : "CLOSED"}
                            </Text>
                        </View>
                    </View>

                    <Text style={[cardStyles.title, { color: theme.text, marginBottom: item.description ? 4 : 12 }]} numberOfLines={1}>
                        {item.name}
                    </Text>

                    {item.description ? (
                        <Text style={{ color: theme.textSupporting, fontSize: 14, marginBottom: 12 }} numberOfLines={2}>
                            {item.description}
                        </Text>
                    ) : null}

                    {/* Glassmorphic Balance Display */}
                    <View style={[cardStyles.fundBox, { backgroundColor: theme.highlightBG, borderColor: theme.border }]}>
                        <View>
                            <Text style={[cardStyles.fundLabel, { color: theme.textSupporting }]}>Total Balance</Text>
                            <Text style={[cardStyles.fundBalance, { color: theme.text }]}>
                                ₫ {item.totalBalance?.toLocaleString()}
                            </Text>
                        </View>
                        <MaterialIcons name="account-balance-wallet" size={32} color={theme.primary} />
                    </View>

                    <View style={[cardStyles.footerRow, { marginTop: 12 }]}>
                        <Text style={[cardStyles.createdByText, { color: theme.textSupporting }]} numberOfLines={1}>
                            By {item.createdByName || "Community Manager"}
                        </Text>
                    </View>
                </View>
            </Pressable>
        )
    }

    const renderLocationCard = (item: UnifiedFeedItem) => {
        return (
            <Pressable
                key={item.id}
                onPress={() => router.push(`/location/${item.id}`)}
                style={({ pressed }) => [
                    cardStyles.card,
                    { 
                        backgroundColor: theme.componentBG, 
                        borderColor: theme.border, 
                        shadowColor: theme.inverse, 
                        padding: 0, 
                        overflow: 'hidden',
                        opacity: pressed ? 0.92 : 1,
                    },
                ]}
            >
                <View style={{ padding: 16, paddingBottom: 8 }}>
                    <View style={cardStyles.headerRow}>
                        <View style={[cardStyles.typeBadge, { backgroundColor: theme.textSupporting + "15" }]}>
                            <Ionicons name="map-outline" size={14} color={theme.textSupporting} />
                            <Text style={[cardStyles.typeBadgeText, { color: theme.textSupporting }]}>Location Help</Text>
                        </View>
                        <View style={[cardStyles.statusBadge, { backgroundColor: item.isActive ? theme.success + "20" : theme.danger + "20" }]}>
                            <Text style={[cardStyles.statusBadgeText, { color: item.isActive ? theme.success : theme.danger }]}>
                                {item.isActive ? "ACTIVE" : "INACTIVE"}
                            </Text>
                        </View>
                    </View>

                    <Text style={[cardStyles.title, { color: theme.text, marginBottom: item.description ? 4 : 8 }]} numberOfLines={1}>
                        {item.name}
                    </Text>

                    {item.description ? (
                        <Text style={{ color: theme.textSupporting, fontSize: 14, marginBottom: 8 }} numberOfLines={2}>
                            {item.description}
                        </Text>
                    ) : null}

                    <View style={cardStyles.addressRow}>
                        <Ionicons name="pin" size={16} color={theme.textSupporting} />
                        <Text style={[cardStyles.addressText, { color: theme.textSupporting }]} numberOfLines={1}>
                            {item.address}
                        </Text>
                    </View>

                    {item.contactPhone && (
                        <View style={[cardStyles.addressRow, { marginTop: 4 }]}>
                            <Ionicons name="call" size={14} color={theme.textSupporting} />
                            <Text style={[cardStyles.addressText, { color: theme.textSupporting }]}>
                                {item.contactPhone}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Interactive Leaflet static mini preview map with scrollWheelZoom strictly FALSE */}
                <Pressable
                    onPress={async (e) => {
                        e.stopPropagation();
                        await handleOpenMap(item.latitude, item.longitude, item.name || item.title);
                    }}
                    style={[cardStyles.miniMapContainer, { borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.highlightBG }]}
                >
                    {Platform.OS === 'web' ? (
                        <iframe
                            srcDoc={getMiniMapHtml(item.latitude, item.longitude)}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                        />
                    ) : WebView ? (
                        <WebView
                            source={{ html: getMiniMapHtml(item.latitude, item.longitude) }}
                            style={{ flex: 1 }}
                            scrollEnabled={false}
                            domStorageEnabled
                            javaScriptEnabled
                        />
                    ) : (
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                            <Text style={{ color: theme.textSupporting, fontSize: 12 }}>Map preview unavailable</Text>
                        </View>
                    )}
                </Pressable>
            </Pressable>
        )
    }

    // FAB animations
    const fabRotate = useSharedValue(0)
    const fabScale = useSharedValue(1)
    const fabHovered = useSharedValue(0)

    const fabAnimatedStyle = useAnimatedStyle(() => {
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

    const unwindFab = () => {
        fabRotate.value = withTiming(0, {
            duration: 250,
            easing: Easing.out(Easing.ease),
        })
    }

    const navigateWithUnwind = useCallback((href: any) => {
        setTimeout(() => {
            router.push(href)
        }, 180)
    }, [router])

    const handleOpenMap = useCallback(async (latitude?: number, longitude?: number, label?: string) => {
        if (!latitude || !longitude) return
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        
        const latLng = `${latitude},${longitude}`
        const name = label ? encodeURIComponent(label) : ''
        
        const iosUrl = `maps://0,0?q=${latLng}(${name})`
        const androidUrl = `geo:0,0?q=${latLng}(${name})`
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        
        if (Platform.OS === 'ios') {
            try {
                const canOpen = await Linking.canOpenURL(iosUrl)
                if (canOpen) {
                    await Linking.openURL(iosUrl)
                    return
                }
            } catch (e) {
                console.warn("Could not open native maps scheme:", e)
            }
        } else if (Platform.OS === 'android') {
            try {
                const canOpen = await Linking.canOpenURL(androidUrl)
                if (canOpen) {
                    await Linking.openURL(androidUrl)
                    return
                }
            } catch (e) {
                console.warn("Could not open native maps scheme:", e)
            }
        }
        
        try {
            await Linking.openURL(webUrl)
        } catch (e) {
            console.error("Could not open web maps URL:", e)
        }
    }, [])

    const bottomSheetOptions = useMemo(() => {
        const options = [];
        const role = user?.role;

        // 1. Admins, Collaborators, and Requesters can create support requests
        if (role === 'ADMIN' || role === 'COLLABORATOR' || role === 'REQUESTER') {
            options.push({
                key: "create-request",
                label: "Create Support Request",
                icon: "support" as any,
                onPress: () => navigateWithUnwind("/create-request"),
            });
        }

        // 2. Admins & Collaborators can add locations
        if (role === 'ADMIN' || role === 'COLLABORATOR') {
            options.push({
                key: "add-location",
                label: "Add Help Location",
                icon: "map" as any,
                onPress: () => navigateWithUnwind("/create-location"),
            });
        }

        // 3. Admins can create community funds
        if (role === 'ADMIN') {
            options.push({
                key: "create-fund",
                label: "Create Community Fund",
                icon: "monetization-on" as any,
                onPress: () => navigateWithUnwind("/community-funds/create"),
            });
        }

        return options;
    }, [user, navigateWithUnwind]);

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: theme.appBG,
                    height: (Platform.OS === "web" ? "100vh" : "100%") as any,
                    maxHeight: (Platform.OS === "web" ? "100vh" : undefined) as any,
                },
            ]}
        >
            {/* Search Input Panel */}
            <View style={[localStyles.searchPanel, { borderBottomColor: theme.border }]}>
                <View style={[localStyles.searchBox, { backgroundColor: theme.highlightBG, borderColor: theme.border }]}>
                    <Ionicons name="search" size={20} color={theme.textSupporting} />
                    <RNTextInput
                        placeholder="Search support requests, funds or locations..."
                        placeholderTextColor={theme.textSupporting}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={[
                            localStyles.searchInput,
                            {
                                color: theme.text,
                                ...Platform.select({
                                    web: { outlineStyle: "none" } as any,
                                }),
                            },
                        ]}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery("")}>
                            <MaterialIcons name="close" size={20} color={theme.textSupporting} />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Segmented Primary Tab Pill Selector */}
            <View style={localStyles.primaryFilterBar}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={localStyles.filterScroll}
                >
                    {(['All', 'Requests', 'Funds', 'Locations'] as const).map((tab) => {
                        const isActive = primaryFilter === tab
                        let tabLabel = "All"
                        if (tab === 'Requests') tabLabel = "Help Requests"
                        if (tab === 'Funds') tabLabel = "Community Funds"
                        if (tab === 'Locations') tabLabel = "Location Help"

                        return (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => handlePrimaryFilterChange(tab)}
                                style={[
                                    filterStyles.pill,
                                    {
                                        backgroundColor: isActive ? theme.primary : theme.highlightBG,
                                        borderColor: isActive ? theme.primary : theme.border,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        filterStyles.pillText,
                                        { color: isActive ? theme.textLight : theme.textSupporting },
                                    ]}
                                >
                                    {tabLabel}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>
            </View>

            {/* Dynamic Secondary Sub-Filters Row */}
            {secondaryOptions.length > 0 && (
                <View style={[localStyles.secondaryFilterBar, { borderBottomColor: theme.border }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={localStyles.subFilterScroll}>
                        {secondaryOptions.map((opt) => {
                            const isActive = secondaryFilter === opt
                            let label = opt
                            if (opt === 'APPROVED') label = 'Approved'
                            if (opt === 'IN_PROGRESS') label = 'In Progress'
                            if (opt === 'FULFILLED') label = 'Fulfilled'
                            if (opt === 'PENDING') label = 'Pending'

                            return (
                                <TouchableOpacity
                                    key={opt}
                                    onPress={async () => {
                                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                        setSecondaryFilter(opt)
                                    }}
                                    style={[
                                        filterStyles.subPill,
                                        {
                                            backgroundColor: isActive ? theme.highlightBG : 'transparent',
                                            borderColor: isActive ? theme.primary : 'transparent',
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            filterStyles.subPillText,
                                            {
                                                color: isActive ? theme.primary : theme.textSupporting,
                                                fontWeight: isActive ? '700' : '500',
                                            },
                                        ]}
                                    >
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Main Interactive Chronological Feed */}
            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : isError ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                    <MaterialIcons name="error-outline" size={48} color={theme.danger} style={{ marginBottom: 12 }} />
                    <Text style={{ textAlign: "center", color: theme.textSupporting, fontSize: 16 }}>
                        Failed to fetch community assets feed.
                    </Text>
                </View>
            ) : filteredFeed.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                    <Ionicons name="search-outline" size={56} color={theme.textSupporting} style={{ marginBottom: 16 }} />
                    <Text style={{ color: theme.text, fontSize: 18, fontWeight: "600", marginBottom: 4 }}>No Results Found</Text>
                    <Text style={{ color: theme.textSupporting, fontSize: 14, textAlign: 'center' }}>
                        No records match your selected filter criteria or search query.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredFeed}
                    keyExtractor={(item) => `${item.itemType}-${item.id}`}
                    renderItem={({ item }) => {
                        if (item.itemType === 'request') return renderRequestCard(item)
                        if (item.itemType === 'fund') return renderFundCard(item)
                        return renderLocationCard(item)
                    }}
                    contentContainerStyle={localStyles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Unified Floating Action Button (FAB) */}
            {bottomSheetOptions.length > 0 && (
                <Animated.View
                    style={[
                        localStyles.fab,
                        fabAnimatedStyle,
                        {
                            borderRadius: 28,
                            ...Platform.select({
                                web: {
                                    shadowColor: theme.inverse,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 4,
                                    elevation: 6,
                                },
                                default: {},
                            }),
                        },
                    ]}
                >
                    <Pressable
                        onPress={async () => {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
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
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Ionicons name="add" size={34} color={theme.textLight} />
                    </Pressable>
                </Animated.View>
            )}

            <BottomSheet
                isVisible={isCreateMenuVisible}
                onClose={closeFabMenu}
                onCloseStart={unwindFab}
                options={bottomSheetOptions}
            />


        </View>
    )
}

/* ---------- Stylesystems ---------- */

const filterStyles = StyleSheet.create({
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    pillText: {
        fontSize: 13,
        fontWeight: "600",
    },
    subPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        marginRight: 6,
    },
    subPillText: {
        fontSize: 12,
    },
})

const localStyles = StyleSheet.create({
    searchPanel: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        padding: 0,
    },
    primaryFilterBar: {
        paddingVertical: 10,
    },
    secondaryFilterBar: {
        paddingBottom: 10,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    filterScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    subFilterScroll: {
        gap: 4,
    },
    listContent: {
        paddingTop: 8,
        paddingBottom: 96,
        paddingHorizontal: 16,
    },
    fab: {
        position: "absolute",
        bottom: 24,
        right: 24,
        zIndex: 999,
    },
})

const cardStyles = StyleSheet.create({
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
        width: '100%',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    typeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    catBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
    },
    catBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 24,
        marginBottom: 8,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    addressText: {
        fontSize: 13,
        flex: 1,
    },
    progressContainer: {
        marginTop: 16,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    progressPercent: {
        fontSize: 12,
        fontWeight: '700',
    },
    progressBarBG: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    statusIndicatorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusIndicatorText: {
        fontSize: 12,
        fontWeight: '600',
    },
    fundBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    fundLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    fundBalance: {
        fontSize: 24,
        fontWeight: '800',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    createdByText: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
        marginRight: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    miniMapContainer: {
        height: 120,
        width: '100%',
    },
})
