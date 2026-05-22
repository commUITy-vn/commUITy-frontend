import React from "react"
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Platform } from "react-native"
import { useTheme } from "@/hooks/useTheme"
import { useRouter } from "expo-router"
import * as Haptics from "expo-haptics"
import { MaterialIcons } from "@expo/vector-icons"
import { useSupportLocations } from "@/features/maps/hooks/useSupportLocations"

export default function CollaboratorDashboard() {
    const theme = useTheme()
    const router = useRouter()
    const { data: locations, isLoading } = useSupportLocations()

    const mappedLocations = ((locations as any) || []).map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        status: loc.isActive !== false ? "ACTIVE" : "INACTIVE",
    }))

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
            {/* Header (Back chevron + title + Add Location button) */}
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
                <Text style={[styles.headerTitle, { color: theme.text }]}>Collaborator Dashboard</Text>
                <Pressable
                    onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        router.push("/create-location" as any)
                    }}
                    style={styles.backButton}
                >
                    <MaterialIcons name="add" size={28} color={theme.primary} />
                </Pressable>
            </View>

            <View style={{ padding: 16, flex: 1 }}>
                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={[styles.statNumber, { color: theme.text }]}>
                            {mappedLocations.length}
                        </Text>
                        <Text
                            style={[
                                styles.statLabel,
                                { color: theme.textSupporting },
                            ]}
                        >
                            Total Active Locations
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statNumber, { color: theme.text }]}>
                            0
                        </Text>
                        <Text
                            style={[
                                styles.statLabel,
                                { color: theme.textSupporting },
                            ]}
                        >
                            Pending Requests Nearby
                        </Text>
                    </View>
                </View>

                {/* Managed Locations */}
                {isLoading ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : mappedLocations.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
                        <MaterialIcons name="place" size={48} color={theme.textSupporting} style={{ marginBottom: 12 }} />
                        <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600", marginBottom: 4, textAlign: "center" }}>No Support Locations Yet</Text>
                        <Text style={{ color: theme.textSupporting, fontSize: 14, textAlign: "center" }}>{"Tap the '+' button in the top right to create one!"}</Text>
                    </View>
                ) : (
                    <FlatList
                        data={mappedLocations}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() => router.push(`/(app)/location/${item.id}` as any)}
                                style={[styles.card, { borderColor: theme.border, backgroundColor: theme.componentBG }]}
                            >
                                <Text
                                    style={[styles.locationName, { color: theme.text }]}
                                >
                                    {item.name}
                                </Text>
                                <Text
                                    style={[
                                        styles.locationAddress,
                                        { color: theme.textSupporting, marginTop: 4 },
                                    ]}
                                >
                                    {item.address}
                                </Text>
                                <Text
                                    style={[
                                        styles.locationStatus,
                                        {
                                            color:
                                                item.status === "ACTIVE"
                                                    ? theme.success
                                                    : theme.danger,
                                        },
                                    ]}
                                >
                                    {item.status}
                                </Text>
                            </Pressable>
                        )}
                    />
                )}
            </View>
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
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
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    statBox: {
        alignItems: "center",
        flex: 1,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "bold",
    },
    statLabel: {
        fontSize: 12,
    },
    card: {
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderRadius: 8,
    },
    locationName: {
        fontSize: 16,
        fontWeight: "600",
    },
    locationAddress: {
        fontSize: 12,
    },
    locationStatus: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: "500",
    },
})
