import React, { useState } from "react"
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Platform } from "react-native"
import { useTheme } from "@/hooks/useTheme"
import { useThemeStyles } from "@/hooks/useThemeStyles"
import { useRouter } from "expo-router"
import * as Haptics from "expo-haptics"
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import { useSupportLocations } from "@/features/maps/hooks/useSupportLocations"
import { useSupportRequests } from "@/features/support/hooks/useSupportRequests"
import { BottomSheet } from "@/components/ui"

const StatCard = ({ label, value }: { label: string; value: string }) => {
  const theme = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: theme.highlightBG }]}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSupporting }]}>{label}</Text>
    </View>
  );
};

export default function CollaboratorDashboard() {
    const theme = useTheme()
    const stylesGlobal = useThemeStyles()
    const router = useRouter()
    const { data: locations, isLoading: isLocationsLoading } = useSupportLocations()
    const { data: requests, isLoading: isRequestsLoading } = useSupportRequests()

    const [isMenuVisible, setIsMenuVisible] = useState(false)

    const isLoading = isLocationsLoading || isRequestsLoading

    const mappedLocations = ((locations as any) || []).map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        status: loc.isActive !== false ? "ACTIVE" : "INACTIVE",
    }))

    const activeLocationsCount = mappedLocations.filter((l: any) => l.status === "ACTIVE").length
    const requestsCount = requests?.length || 0

    const renderLocationItem = ({ item }: { item: any }) => {
        return (
            <View style={{ marginBottom: 16 }}>
                <Pressable
                    onPress={() => router.push(`/location/${item.id}` as any)}
                    style={({ pressed }) => [
                        styles.card,
                        { 
                            borderColor: theme.border, 
                            backgroundColor: theme.componentBG,
                            opacity: pressed ? 0.9 : 1,
                        }
                    ]}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.highlightBG, justifyContent: 'center', alignItems: 'center' }}>
                                <MaterialIcons name="place" size={20} color={theme.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }} numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <Text style={{ fontSize: 13, color: theme.textSupporting, marginTop: 2 }} numberOfLines={1}>
                                    {item.address}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.badge, { backgroundColor: item.status === "ACTIVE" ? '#E5F6EE' : theme.border }]}>
                            <Text style={[styles.badgeText, { color: item.status === "ACTIVE" ? '#008040' : theme.textSupporting }]}>
                                {item.status}
                            </Text>
                        </View>
                    </View>
                    
                    {/* Action buttons mirroring volunteer dashboard */}
                    <View style={[styles.row, { marginTop: 14 }]}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.buttonPrimary,
                                { backgroundColor: theme.primary, marginRight: 8, opacity: pressed ? 0.9 : 1 },
                            ]}
                            onPress={async () => {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push(`/location/${item.id}` as any);
                            }}
                        >
                            <Text style={[styles.buttonText, { color: theme.textLight }]}>View Location</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.buttonSecondary,
                                { backgroundColor: theme.highlightBG, borderWidth: 1, borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
                            ]}
                            onPress={async () => {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push(`/location/${item.id}` as any);
                            }}
                        >
                            <Text style={[styles.buttonText, { color: theme.text }]}>Settings</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </View>
        );
    };

    return (
        <View
            style={[
                stylesGlobal.container,
                {
                    backgroundColor: theme.appBG,
                    height: (Platform.OS === "web" ? "100vh" : "100%") as any,
                    maxHeight: (Platform.OS === "web" ? "100vh" : undefined) as any,
                },
            ]}
        >
            {/* Header (Back chevron + title) */}
            <View
                style={[
                    styles.header,
                    { borderBottomColor: theme.border },
                ]}
            >
                <Pressable
                    onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        router.back()
                    }}
                    style={styles.backButton}
                >
                    <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Collaborator Panel</Text>
                <View style={{ width: 52 }} />
            </View>

            <View style={{ padding: 16, flex: 1 }}>
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <StatCard label="Active Hubs" value={String(activeLocationsCount)} />
                    <StatCard label="Total Requests" value={String(requestsCount)} />
                    <StatCard label="Control Level" value="100%" />
                </View>

                {/* Dashboard List */}
                {isLoading ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : mappedLocations.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
                        <MaterialIcons name="place" size={48} color={theme.textSupporting} style={{ marginBottom: 12 }} />
                        <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600", marginBottom: 4, textAlign: "center" }}>No Support Locations Yet</Text>
                        <Text style={{ color: theme.textSupporting, fontSize: 14, textAlign: "center" }}>{"Tap the '+' FAB button to create a support location!"}</Text>
                    </View>
                ) : (
                    <FlatList
                        data={mappedLocations}
                        keyExtractor={(item) => item.id}
                        renderItem={renderLocationItem}
                        contentContainerStyle={{ paddingTop: 24, paddingBottom: 80 }}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            {/* Bottom-right FAB (mirroring homepage) */}
            <View
                style={{
                    position: "absolute",
                    bottom: 24,
                    right: 24,
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: theme.primary,
                    justifyContent: "center",
                    alignItems: "center",
                    elevation: 4,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                }}
            >
                <Pressable
                    onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                        setIsMenuVisible(true)
                    }}
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Ionicons name="add" size={32} color={theme.textLight} />
                </Pressable>
            </View>

            {/* Collaborator Actions Bottom Sheet */}
            <BottomSheet
                isVisible={isMenuVisible}
                onClose={() => setIsMenuVisible(false)}
                options={[
                    {
                        key: "create-request",
                        label: "Create Support Request",
                        icon: "support" as any,
                        onPress: () => {
                            setIsMenuVisible(false);
                            setTimeout(() => {
                                router.push("/create-request");
                            }, 180);
                        },
                    },
                    {
                        key: "add-location",
                        label: "Add Help Location",
                        icon: "map" as any,
                        onPress: () => {
                            setIsMenuVisible(false);
                            setTimeout(() => {
                                router.push("/create-location");
                            }, 180);
                        },
                    },
                ]}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: {
        padding: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    statCard: {
        flex: 1,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '600',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    card: {
        padding: 14,
        borderWidth: 1,
        borderRadius: 12,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    buttonPrimary: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonSecondary: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
    },
})
