// Collaborator Dashboard
import React from "react"
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native"
import { useTheme } from "@/hooks/useTheme"
import { useRouter } from "expo-router"

// Dummy data for locations
const locations = [
    { id: "1", name: "Central Hub", address: "123 Main St", status: "ACTIVE" },
    {
        id: "2",
        name: "East Side Center",
        address: "456 East Ave",
        status: "INACTIVE",
    },
]

export default function CollaboratorDashboard() {
    const theme = useTheme()
    const router = useRouter()
    return (
        <View style={[styles.container, { backgroundColor: theme.appBG }]}>
            {/* Quick Stats */}
            <View style={styles.statsContainer}>
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
                        Total Items Received
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
            <FlatList
                data={locations}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => router.push(`/(app)/location/${item.id}`)}
                        style={[styles.card, { borderColor: theme.border }]}
                    >
                        <Text
                            style={[styles.locationName, { color: theme.text }]}
                        >
                            {item.name}
                        </Text>
                        <Text
                            style={[
                                styles.locationAddress,
                                { color: theme.textSupporting },
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
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
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
