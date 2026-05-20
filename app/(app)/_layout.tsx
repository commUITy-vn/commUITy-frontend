import { Tabs } from "expo-router"
import { View, Text, PixelRatio } from "react-native"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Colors } from "@/constants/theme"
import { HapticTab } from "@/components/haptic-tab"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"

export default function AppLayout() {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme ?? "light"]

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.icon,
                tabBarButton: HapticTab,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: "700",
                    lineHeight: 15,
                    marginTop: 2,
                    textAlign: "center",
                },
                tabBarStyle: {
                    backgroundColor: theme.appBG,
                    borderTopWidth: 1 / PixelRatio.get(),
                    borderTopColor: theme.border,
                    height: 60,
                    paddingTop: 0,
                    paddingBottom: 0,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: "Explore",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons
                            name="explore"
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: "Inbox",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="inbox" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <View
                            style={{
                                width: size,
                                height: size,
                                borderRadius: size / 2,
                                backgroundColor: theme.primary,
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Text
                                style={{
                                    color: theme.textLight,
                                    fontSize: 10,
                                    fontWeight: "600",
                                }}
                            >
                                U
                            </Text>
                        </View>
                    ),
                }}
            />
            {/* All other routes set href: null to prevent tab bar appearance */}
            <Tabs.Screen name="notifications" options={{ href: null }} />
            <Tabs.Screen name="map" options={{ href: null }} />
            <Tabs.Screen name="location/[id]" options={{ href: null }} />
            <Tabs.Screen name="category-picker" options={{ href: null }} />
        </Tabs>
    )
}
