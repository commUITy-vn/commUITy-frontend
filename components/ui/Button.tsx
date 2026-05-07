import React, {useCallback, useState} from 'react';
import {StyleSheet, View, ActivityIndicator, Text, StyleSheet as RNStyleSheet} from 'react-native';
import {Pressable, type PressableProps} from 'react-native';
import * as Haptics from 'expo-haptics';
import {useTheme} from '@/hooks/useTheme';
import {useThemeStyles} from '@/hooks/useThemeStyles';
import {spacing} from '@/constants/theme';
import type {StyleProp, ViewStyle} from 'react-native';

type ButtonSize = 'extraSmall' | 'small' | 'medium' | 'large';

type ButtonProps = PressableProps & {
    /** Text to display in the button */
    text?: string;

    /** Callback when button is pressed */
    onPress?: (event?: any) => void;

    /** Loading state */
    isLoading?: boolean;

    /** Disabled state */
    isDisabled?: boolean;

    /** Primary variant (orange brand) */
    primary?: boolean;

    /** Success variant (green) */
    success?: boolean;

    /** Danger variant (red) */
    danger?: boolean;

    /** Button size */
    size?: ButtonSize;

    /** Additional styles for button container */
    style?: StyleProp<ViewStyle>;

    /** Should enable haptic feedback */
    shouldEnableHapticFeedback?: boolean;

    /** Child components */
    children?: React.ReactNode;
};

const sizeConfig: Record<ButtonSize, {minHeight: number; paddingHorizontal: number; fontSize: number}> = {
    extraSmall: {minHeight: 24, paddingHorizontal: 8, fontSize: 12},
    small: {minHeight: 28, paddingHorizontal: 12, fontSize: 14},
    medium: {minHeight: 40, paddingHorizontal: 16, fontSize: 16},
    large: {minHeight: 52, paddingHorizontal: 20, fontSize: 18},
};

export const Button: React.FC<ButtonProps> = ({
    text = '',
    onPress,
    isLoading = false,
    isDisabled = false,
    primary = false,
    success = false,
    danger = false,
    size = 'medium',
    style,
    shouldEnableHapticFeedback = true,
    children,
    ...rest
}) => {
    const theme = useTheme();
    const styles = useThemeStyles();
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const config = sizeConfig[size];

    const handlePress = useCallback(
        async (event?: any) => {
            if (isDisabled || isLoading) return;

            if (shouldEnableHapticFeedback) {
                try {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                    // Haptics may not be available on all platforms
                }
            }

            onPress?.(event);
        },
        [isDisabled, isLoading, shouldEnableHapticFeedback, onPress],
    );

    const getBackgroundColor = () => {
        if (isDisabled) {
            return theme.buttonDefaultBG;
        }

        if (primary) {
            if (isPressed) return theme.primaryPressed || '#C2410C';
            if (isHovered) return theme.primaryHover || '#EA580C';
            return theme.primary || '#F97316';
        }

        if (success) {
            if (isPressed) return theme.successPressed;
            if (isHovered) return theme.successHover;
            return theme.success;
        }

        if (danger) {
            if (isPressed) return theme.dangerPressed;
            if (isHovered) return theme.dangerHover;
            return theme.danger;
        }

        if (isPressed) return theme.buttonPressedBG;
        if (isHovered) return theme.buttonHoveredBG;
        return theme.buttonDefaultBG;
    };

    const getTextColor = () => {
        if (isDisabled) {
            return theme.textSupporting;
        }

        if (primary || success || danger) {
            return theme.buttonSuccessText;
        }

        return theme.text;
    };

    const buttonStyles = [
        styles.button,
        {
            backgroundColor: getBackgroundColor(),
            minHeight: config.minHeight,
            borderRadius: 100, // Fully rounded like Expensify
            paddingHorizontal: config.paddingHorizontal,
        },
        style,
    ];

    const textStyles = {
        ...styles.buttonText,
        color: getTextColor(),
        fontSize: config.fontSize,
        fontWeight: 'bold' as const,
    };

    return (
        <Pressable
            onPress={handlePress}
            disabled={isDisabled || isLoading}
            onHoverIn={() => !isDisabled && setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
            onPressIn={() => !isDisabled && setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            style={buttonStyles}
            {...rest}
        >
            {isLoading ? (
                <ActivityIndicator color={primary || success || danger ? theme.buttonSuccessText : theme.text} size={size === 'extraSmall' || size === 'small' ? 'small' : 'large'} />
            ) : (
                <Text style={textStyles}>{children || text}</Text>
            )}
        </Pressable>
    );
};

// Base styles
const styles = StyleSheet.create({
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    buttonText: {
        textAlign: 'center',
        fontFamily: 'System',
        lineHeight: 24,
    },
});
