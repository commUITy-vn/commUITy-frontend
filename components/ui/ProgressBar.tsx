import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type ProgressBarProps = {
  /**
   * Progress percentage, from 0 to 100.
   */
  progress: number;
  /**
   * Height of the bar in pixels. Defaults to 8.
   */
  height?: number;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, height = 8 }) => {
  const theme = useTheme();

  // Clamp progress between 0 and 100
  const clamped = Math.max(0, Math.min(100, progress));

  // Animated width for smooth updates
  const widthAnim = React.useRef(new Animated.Value(clamped)).current;

  React.useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: clamped,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [clamped, widthAnim]);

  const containerStyle = {
    height,
    backgroundColor: theme.border,
    borderRadius: height / 2,
    overflow: 'hidden' as const,
  };

  const fillStyle = {
    backgroundColor: theme.primary,
    height,
    borderRadius: height / 2,
  };

  const widthInterpolation = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={containerStyle}>
      <Animated.View style={[fillStyle, { width: widthInterpolation }]} />
    </View>
  );
};
