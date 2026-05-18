import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import * as Haptics from 'expo-haptics';

type PressableWithAnimationProps = PressableProps & {
  /** Whether to use haptic feedback */
  useHaptics?: boolean;
  /** Animation scale factor when pressed (default: 0.95) */
  pressScale?: number;
  /** Animation duration in ms (default: 100) */
  animationDuration?: number;
  /** Custom style for the pressed state */
  pressedStyle?: StyleProp<ViewStyle>;
  /** Children to render */
  children: React.ReactNode;
};

const PressableWithAnimation = React.forwardRef<
  PressableWithAnimationProps,
  HTMLElement
>(({
  useHaptics = true,
  pressScale = 0.95,
  animationDuration = 100,
  pressedStyle,
  children,
  style,
  onPress,
  onLongPress,
  disabled,
  ...props
}, ref) => {
  const theme = useTheme();
  const styles = useThemeStyles();

  const scale = useSharedValue(1);

  const pressIn = () => {
    scale.value = withTiming(pressScale, {
      duration: animationDuration,
      easing: Easing.out(Easing.cubic),
    });

    if (useHaptics && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const pressOut = () => {
    scale.value = withTiming(1, {
      duration: animationDuration,
      easing: Easing.out(Easing.cubic),
    });
  };

  const pressStyle = [
    {
      transform: [{ scale }],
    },
    pressedStyle,
  ];

  return (
    <Pressable
      ref={ref}
      style={[styles.pressable, style, !disabled && pressStyle]}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPressCancel={pressOut}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      {...props}
    >
      {children}
    </Pressable>
  );
});

export default PressableWithAnimation;