import React, {useCallback, useState} from 'react';
import {StyleSheet, View, ActivityIndicator, Text, Pressable, type PressableProps} from 'react-native';
import * as Haptics from 'expo-haptics';
import {useTheme} from '@/hooks/useTheme';
import {useThemeStyles} from '@/hooks/useThemeStyles';
import {Colors} from '@/constants/theme';
import type {StyleProp, ViewStyle} from 'react-native';

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

    /** Custom font size for the button text */
    fontSize?: number;

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

const Button: React.FC<ButtonProps> = ({
    text = '',
    onPress,
    isLoading = false,
    isDisabled = false,
    primary = false,
    success = false,
    danger = false,
    size = 'medium',
    fontSize,
    style,
    shouldEnableHapticFeedback = true,
    children,
    ...rest
}) => {
    const theme = useTheme() || Colors.light;
    const themeStyles = useThemeStyles() || {};
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
            return theme.buttonDefaultBG || '#F5F5F5';
        }

        if (primary) {
            if (isPressed) return theme.primaryPressed || '#C2410C';
            if (isHovered) return theme.primaryHover || '#EA580C';
            return theme.primary || '#F97316';
        }

        if (success) {
            if (isPressed) return theme.successPressed || '#10B981';
            if (isHovered) return theme.successHover || '#34D399';
            return theme.success || '#10B981';
        }

        if (danger) {
            if (isPressed) return theme.dangerPressed || '#EF4444';
            if (isHovered) return theme.dangerHover || '#F87171';
            return theme.danger || '#EF4444';
        }

        if (isPressed) return theme.buttonPressedBG || '#E5E7EB';
        if (isHovered) return theme.buttonHoveredBG || '#D1D5DB';
        return theme.buttonDefaultBG || '#F5F5F5';
    };

    const getTextColor = () => {
        if (isDisabled) {
            return theme.textSupporting || '#6B7280';
        }

        if (primary || success || danger) {
            return theme.buttonSuccessText || '#FFFFFF';
        }

        return theme.text || '#111827';
    };

    return (
        <Pressable
            onPress={handlePress}
            disabled={isDisabled || isLoading}
            onHoverIn={() => !isDisabled && setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
            onPressIn={() => !isDisabled && setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            style={[
                styles.button,
                ...(themeStyles.button ? [themeStyles.button] : []),
                {
                    backgroundColor: getBackgroundColor(),
                    minHeight: config.minHeight,
                    borderRadius: 100, // Fully rounded like Expensify
                    paddingHorizontal: config.paddingHorizontal,
                },
                style,
            ]}
            {...rest}
        >
            {isLoading ? (
                <ActivityIndicator color={primary || success || danger ? theme.buttonSuccessText : theme.text} size={size === 'extraSmall' || size === 'small' ? 'small' : 'large'} />
            ) : (
                <Text style={[
                    styles.buttonText,
                    ...(themeStyles.buttonText ? [themeStyles.buttonText] : []),
                    {color: getTextColor(), fontSize: fontSize ?? config.fontSize, fontWeight: 'bold' as const},
                ]}>{children || text}</Text>
            )}
        </Pressable>
    );
};

// Export as named and default for compatibility
export { Button };
export default Button;