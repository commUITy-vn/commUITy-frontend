import { Stack, useRouter } from "expo-router"
import { Pressable } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useTheme } from "@/hooks/useTheme"

export default function CreateRequestLayout() {
    const theme = useTheme()
    const router = useRouter()

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                animationDuration: 300,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="details" />
            <Stack.Screen name="urgency" />
            <Stack.Screen name="items" />
            <Stack.Screen name="confirmation" />
            <Stack.Screen name="success" options={{ gestureEnabled: false }} />
        </Stack>
    )
}
