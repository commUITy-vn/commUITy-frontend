import React, { useEffect } from "react"
import { View, Text, Pressable, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
} from "react-native-reanimated"
import * as Haptics from "expo-haptics"
import { useTheme } from "@/hooks/useTheme"
import { useCreateRequestStore } from "@/stores/useCreateRequestStore"
import { Button } from "@/components/ui"

export default function CreateRequestSuccessScreen() {
    const router = useRouter()
    const theme = useTheme()
    const { reset } = useCreateRequestStore()

    const scale = useSharedValue(0.5)
    const opacity = useSharedValue(0)
    const checkOpacity = useSharedValue(0)

    useEffect(() => {
        // Animate the success icon
        scale.value = withTiming(1, {
            duration: 400,
            easing: Easing.out(Easing.back(2)),
        })
        opacity.value = withTiming(1, { duration: 300 })
        checkOpacity.value = withDelay(300, withTiming(1, { duration: 300 }))
    }, [])

    const iconAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }))

    const checkAnimatedStyle = useAnimatedStyle(() => ({
        opacity: checkOpacity.value,
    }))

    const handleDone = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        reset()
        router.replace("/(app)")
    }

    return (
        <View style={[localStyles.container, { backgroundColor: theme.appBG }]}>
            <View style={localStyles.content}>
                {/* Animated success icon */}
                <View style={localStyles.iconContainer}>
                    <Animated.View
                        style={[
                            localStyles.iconCircle,
                            { backgroundColor: theme.success },
                            iconAnimatedStyle,
                        ]}
                    >
                        <Animated.View style={checkAnimatedStyle}>
                            <MaterialIcons
                                name="check"
                                size={48}
                                color="#FFFFFF"
                            />
                        </Animated.View>
                    </Animated.View>
                </View>

                <Text style={[localStyles.title, { color: theme.text }]}>
                    Request Submitted!
                </Text>
                <Text
                    style={[
                        localStyles.subtitle,
                        { color: theme.textSupporting },
                    ]}
                >
                    Your support request has been created successfully. You'll
                    be notified when someone responds.
                </Text>

                {/* Quick stats */}
                <View
                    style={[
                        localStyles.statsCard,
                        {
                            backgroundColor: theme.highlightBG,
                            borderColor: theme.border,
                        },
                    ]}
                >
                    <View style={localStyles.statRow}>
                        <MaterialIcons
                            name="visibility"
                            size={20}
                            color={theme.icon}
                        />
                        <Text
                            style={[
                                localStyles.statText,
                                { color: theme.textSupporting },
                            ]}
                        >
                            Your request is now visible to the community
                        </Text>
                    </View>
                    <View
                        style={[
                            localStyles.divider,
                            { backgroundColor: theme.border },
                        ]}
                    />
                    <View style={localStyles.statRow}>
                        <MaterialIcons
                            name="notifications"
                            size={20}
                            color={theme.icon}
                        />
                        <Text
                            style={[
                                localStyles.statText,
                                { color: theme.textSupporting },
                            ]}
                        >
                            You'll get notified when someone responds
                        </Text>
                    </View>
                </View>

                <View style={localStyles.buttonContainer}>
                    <Button
                        text="Done"
                        onPress={handleDone}
                        size="large"
                        primary
                    />
                </View>
            </View>
        </View>
    )
}

const localStyles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    iconContainer: { marginBottom: 32 },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        marginBottom: 12,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 32,
    },
    statsCard: {
        width: "100%",
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 32,
        gap: 12,
    },
    statRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    statText: { fontSize: 14, flex: 1 },
    divider: { height: StyleSheet.hairlineWidth },
    buttonContainer: { width: "100%" },
})
