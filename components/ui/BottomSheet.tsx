import React, { useEffect, useCallback, useState } from "react"
import {
    View,
    Text,
    Pressable,
    Modal,
    StyleSheet,
    Platform,
} from "react-native"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    runOnJS,
} from "react-native-reanimated"
import * as Haptics from "expo-haptics"
import { useTheme } from "@/hooks/useTheme"
import { MaterialIcons } from "@expo/vector-icons"

type BottomSheetOption = {
    key: string
    label: string
    icon?: keyof typeof MaterialIcons.glyphMap
    onPress: () => void
    destructive?: boolean
}

type BottomSheetProps = {
    isVisible: boolean
    onClose: () => void
    options: BottomSheetOption[]
    title?: string
    /**
     * Fires synchronously when the close animation begins
     * (before the hide animation). Use this to immediately
     * trigger side-effects like FAB unwind.
     */
    onCloseStart?: () => void
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Extracted option item to use hooks properly
const BottomSheetOptionItem: React.FC<{
    option: BottomSheetOption
    index: number
    onPress: (option: BottomSheetOption) => void
}> = ({ option, index, onPress }) => {
    const theme = useTheme()
    const [hovered, setHovered] = useState(false)

    return (
        <Pressable
            onPress={() => onPress(option)}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            style={({ pressed }) => [
                localStyles.option,
                {
                    backgroundColor: pressed
                        ? theme.activeComponentBG
                        : hovered
                          ? theme.hoverComponentBG
                          : "transparent",
                    borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                    borderTopColor: theme.border,
                },
            ]}
        >
            {option.icon ? (
                <MaterialIcons
                    name={option.icon}
                    size={24}
                    color={
                        option.destructive
                            ? theme.danger
                            : hovered
                              ? theme.primary
                              : theme.icon
                    }
                    style={localStyles.optionIcon}
                />
            ) : null}
            <Text
                style={[
                    localStyles.optionText,
                    {
                        color: option.destructive
                            ? theme.danger
                            : hovered
                              ? theme.primary
                              : theme.text,
                        fontWeight: option.destructive ? "600" : "400",
                    },
                ]}
            >
                {option.label}
            </Text>
        </Pressable>
    )
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
    isVisible,
    onClose,
    options,
    title,
    onCloseStart,
}) => {
    const theme = useTheme()

    const backdropOpacity = useSharedValue(0)
    const sheetTranslateY = useSharedValue(400)

    const show = useCallback(() => {
        backdropOpacity.value = withTiming(1, {
            duration: 300,
            easing: Easing.out(Easing.ease),
        })
        sheetTranslateY.value = withTiming(0, {
            duration: 340,
            easing: Easing.out(Easing.ease),
        })
    }, [backdropOpacity, sheetTranslateY])

    const hide = useCallback(
        (callback?: () => void) => {
            backdropOpacity.value = withTiming(0, {
                duration: 200,
                easing: Easing.in(Easing.ease),
            })
            sheetTranslateY.value = withTiming(
                400,
                {
                    duration: 250,
                    easing: Easing.in(Easing.ease),
                },
                () => {
                    if (callback) {
                        runOnJS(callback)()
                    }
                },
            )
        },
        [backdropOpacity, sheetTranslateY],
    )

    useEffect(() => {
        if (isVisible) {
            show()
        }
    }, [isVisible, show])

    const handleClose = useCallback(() => {
        // Fire onCloseStart synchronously (e.g., for immediate FAB unwind)
        onCloseStart?.()
        hide(onClose)
    }, [hide, onClose, onCloseStart])

    const handleOptionPress = useCallback(
        async (option: BottomSheetOption) => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            // Fire onCloseStart synchronously (e.g., for immediate FAB unwind)
            onCloseStart?.()
            // Call option immediately (unwinds FAB + navigates)
            option.onPress()
            // Then animate sheet closed
            hide(onClose)
        },
        [hide, onClose, onCloseStart],
    )

    const backdropAnimatedStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }))

    const sheetAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: sheetTranslateY.value }],
    }))

    if (!isVisible) return null

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            {/* Backdrop - tappable to dismiss */}
            <AnimatedPressable
                onPress={handleClose}
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: "rgba(0,0,0,0.5)" },
                    backdropAnimatedStyle,
                ]}
            />

            {/* Bottom Sheet */}
            <Animated.View
                style={[
                    localStyles.sheet,
                    sheetAnimatedStyle,
                    {
                        backgroundColor: theme.componentBG,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                    },
                ]}
            >
                {/* Handle bar */}
                <View style={localStyles.handleBar}>
                    <View
                        style={[
                            localStyles.handle,
                            { backgroundColor: theme.border },
                        ]}
                    />
                </View>

                {/* Title */}
                {title ? (
                    <View style={localStyles.titleContainer}>
                        <Text
                            style={[
                                localStyles.title,
                                { color: theme.textSupporting },
                            ]}
                        >
                            {title}
                        </Text>
                    </View>
                ) : null}

                {/* Options */}
                <View style={localStyles.optionsContainer}>
                    {options.map((option, index) => (
                        <BottomSheetOptionItem
                            key={option.key}
                            option={option}
                            index={index}
                            onPress={handleOptionPress}
                        />
                    ))}
                </View>

                {/* Safe area bottom padding */}
                <View
                    style={[
                        localStyles.safeArea,
                        { backgroundColor: theme.componentBG },
                    ]}
                />
            </Animated.View>
        </Modal>
    )
}

const localStyles = StyleSheet.create({
    sheet: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 0,
    },
    handleBar: {
        alignItems: "center",
        paddingVertical: 8,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    titleContainer: {
        paddingHorizontal: 20,
        paddingBottom: 8,
    },
    title: {
        fontSize: 13,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    optionsContainer: {
        paddingHorizontal: 0,
    },
    option: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 20,
        minHeight: 56,
    },
    optionIcon: {
        marginRight: 16,
    },
    optionText: {
        fontSize: 16,
        flex: 1,
    },
    cancelContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
    },
    cancelButton: {
        borderRadius: 100,
        minHeight: 52,
        justifyContent: "center",
        alignItems: "center",
    },
    cancelText: {
        fontSize: 16,
    },
    safeArea: {
        height: Platform.OS === "ios" ? 34 : 12,
    },
})

export default BottomSheet
