import React, { useState, useEffect } from "react"
import { View, Text, TextInput as RNTextInput, Platform } from "react-native"
import { useTheme } from "@/hooks/useTheme"
import { useThemeStyles } from "@/hooks/useThemeStyles"
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    createAnimatedComponent,
} from "react-native-reanimated"

// ─── TextInput Layout Constants ─────────────────────────────────────────────
// Each value has an optional Platform override — uncomment to target a platform.
// Example: const FLOATING_LABEL_TOP = Platform.select({ web: 14, default: 14 });
// ─────────────────────────────────────────────────────────────────────────────
const FLOATING_LABEL_LEFT = 6
const FLOATING_LABEL_TOP = 14
const FLOATING_LABEL_SCALE = 0.85
const FLOATING_LABEL_TRANSLATE_Y = -16
const INPUT_PADDING_TOP_FOCUSED = Platform.select({ web: 6, default: 16 })
const INPUT_PADDING_LEFT = 0 // Additional left padding for the input text
// ──────────────────────────────────────────────────────────────────────────────

const AnimatedText = createAnimatedComponent(Text)
const AnimatedView = createAnimatedComponent(View)

type ExpensifyTextInputProps = RNTextInput["props"] & {
    label?: string
    errorText?: string
    containerStyle?: any
    /**
     * When true, disables floating label behavior and uses fixed padding
     * optimized for inputs without labels (e.g., chat inputs)
     */
    disableFloatingLabel?: boolean
    /**
     * Height of the input (default: 56)
     */
    height?: number
}

const ExpensifyTextInput = React.forwardRef<
    RNTextInput,
    ExpensifyTextInputProps
>(
    (
        {
            label,
            errorText,
            containerStyle,
            style,
            onFocus,
            onBlur,
            onChangeText,
            value,
            disableFloatingLabel,
            height,
            ...props
        },
        ref,
    ) => {
        const styles = useThemeStyles()
        const theme = useTheme()
        const [isFocused, setIsFocused] = useState(false)
        const hasValue = value ? value.length > 0 : false
        const disableFloatingLabelProp = disableFloatingLabel ?? false

        // When disableFloatingLabel is true, we never show the floating label
        // Label floats only when focused or has a value (acts as placeholder when empty)
        const showFloatingLabel = disableFloatingLabelProp
            ? false
            : isFocused || hasValue

        const labelScale = useSharedValue(1)
        const labelTranslateY = useSharedValue(0)

        // Shared values for theme-dependent animations
        const labelColorShared = useSharedValue(theme.placeholderText)
        const borderColorShared = useSharedValue(theme.bordersBold)

        // Update shared values when theme or focus changes
        useEffect(() => {
            labelColorShared.value = isFocused
                ? theme.borderFocus
                : theme.placeholderText
        }, [isFocused, theme.borderFocus, theme.placeholderText])

        useEffect(() => {
            borderColorShared.value = isFocused
                ? theme.borderFocus
                : errorText
                  ? theme.danger
                  : theme.bordersBold
        }, [
            isFocused,
            theme.borderFocus,
            errorText,
            theme.borderFocus,
            theme.bordersBold,
            theme.danger,
        ])

        // Initialize label position for pre-filled values
        useEffect(() => {
            if (hasValue) {
                labelScale.value = FLOATING_LABEL_SCALE
                labelTranslateY.value = FLOATING_LABEL_TRANSLATE_Y
            }
        }, [])

        const updateLabelState = (
            focused: boolean,
            val: string | undefined,
        ) => {
            const hasVal = val ? val.length > 0 : false
            const shouldFloat = focused || hasVal

            labelScale.value = withTiming(shouldFloat ? FLOATING_LABEL_SCALE : 1, {
                duration: 150,
                easing: Easing.inOut(Easing.ease),
            })

            labelTranslateY.value = withTiming(shouldFloat ? FLOATING_LABEL_TRANSLATE_Y : 0, {
                duration: 150,
                easing: Easing.inOut(Easing.ease),
            })
        }

        const handleFocus = (e: any) => {
            setIsFocused(true)
            updateLabelState(true, value)
            onFocus?.(e)
        }

        const handleBlur = (e: any) => {
            setIsFocused(false)
            updateLabelState(false, value)
            onBlur?.(e)
        }

        const handleChangeText = (text: string) => {
            updateLabelState(isFocused, text)
            onChangeText?.(text)
        }

        const labelAnimatedStyle = useAnimatedStyle(() => ({
            transform: [
                { scale: labelScale.value },
                { translateY: labelTranslateY.value },
            ],
        }))

        const labelColorAnimatedStyle = useAnimatedStyle(() => ({
            color: labelColorShared.value,
        }))

        const containerAnimatedStyle = useAnimatedStyle(() => ({
            borderColor: borderColorShared.value,
        }))

        return (
            <View style={[styles.mb4, containerStyle]}>
                <AnimatedView
                    style={[
                        styles.inputContainer,
                        containerAnimatedStyle,
                        {
                            height: height ?? 56,
                            justifyContent: "center",
                            paddingHorizontal: 10,
                            backgroundColor: "transparent",
                        },
                    ]}
                >
                    {/* Label is always rendered - floats when focused/has value, centered when empty */}
                    {label ? (
                        <AnimatedView
                            style={[
                                styles.inputLabelContainer,
                                {
                                    position: "absolute",
                                    left: FLOATING_LABEL_LEFT,
                                    top: showFloatingLabel
                                        ? (height ?? 56) > 56
                                            ? 18
                                            : FLOATING_LABEL_TOP
                                        : (height ?? 56) > 56
                                          ? 20
                                          : 18,
                                    backgroundColor: "transparent",
                                },
                                labelAnimatedStyle,
                            ]}
                            pointerEvents="none"
                        >
                            <AnimatedText
                                style={[
                                    styles.inputLabel,
                                    labelColorAnimatedStyle,
                                    !showFloatingLabel && { fontSize: 16 },
                                ]}
                            >
                                {label}
                            </AnimatedText>
                        </AnimatedView>
                    ) : null}

                    <RNTextInput
                        ref={ref as React.RefObject<RNTextInput>}
                        style={[
                            styles.input,
                            { color: theme.text },
                            {
                                flex: 1,
                                margin: 0,
                                padding: 0,
                                paddingLeft: INPUT_PADDING_LEFT,
                                paddingTop:
                                    (height ?? 56) > 56
                                        ? 20
                                        : showFloatingLabel
                                          ? INPUT_PADDING_TOP_FOCUSED
                                          : 0,
                                fontSize: 16,
                                height: height ?? 56,
                                textAlignVertical:
                                    (height ?? 56) > 56 ? "top" : "center",
                                ...(Platform.OS === "web"
                                    ? ({ outlineStyle: "none" } as any)
                                    : {}),
                            },
                            style,
                        ]}
                        placeholder={showFloatingLabel ? "" : props.placeholder}
                        placeholderTextColor={theme.placeholderText}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onChangeText={handleChangeText}
                        value={value}
                        {...props}
                    />
                </AnimatedView>

                {errorText ? (
                    <Text
                        style={[
                            styles.errorText,
                            { color: theme.error || theme.danger },
                            styles.mt1,
                        ]}
                    >
                        {errorText}
                    </Text>
                ) : null}
            </View>
        )
    },
)

export { ExpensifyTextInput }

// For backward compatibility with default import
export default Object.assign(ExpensifyTextInput, {
    displayName: "ExpensifyTextInput",
})
