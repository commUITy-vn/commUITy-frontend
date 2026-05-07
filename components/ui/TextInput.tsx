import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  Platform,
} from 'react-native';
import {useTheme} from '@/hooks/useTheme';
import {useThemeStyles} from '@/hooks/useThemeStyles';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  createAnimatedComponent,
} from 'react-native-reanimated';

type TextInputProps = RNTextInput['props'] & {
  label?: string;
  errorText?: string;
  containerStyle?: any;
};

const AnimatedText = createAnimatedComponent(Text);
const AnimatedView = createAnimatedComponent(View);

const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  ({label, errorText, containerStyle, style, onFocus, onBlur, onChangeText, value, ...props}, ref) => {
    const styles = useThemeStyles();
    const theme = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value ? value.length > 0 : false;

    const labelScale = useSharedValue(1);
    const labelTranslateY = useSharedValue(0);

    const showFloatingLabel = isFocused || hasValue || !!label;

    const updateLabelState = useCallback(
      (focused: boolean, val: string | undefined) => {
        const hasVal = val ? val.length > 0 : false;
        const shouldFloat = focused || hasVal;

        labelScale.value = withTiming(shouldFloat ? 0.85 : 1, {
          duration: 150,
          easing: Easing.inOut(Easing.ease),
        });
        
        labelTranslateY.value = withTiming(shouldFloat ? -16 : 0, {
          duration: 150,
          easing: Easing.inOut(Easing.ease),
        });
      },
      [labelScale, labelTranslateY],
    );

    const handleFocus = (e: any) => {
      setIsFocused(true);
      updateLabelState(true, value);
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      updateLabelState(false, value);
      onBlur?.(e);
    };

    const handleChangeText = (text: string) => {
      updateLabelState(isFocused, text);
      onChangeText?.(text);
    };

    const labelAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{scale: labelScale.value}, {translateY: labelTranslateY.value}],
    }));

    const labelColorAnimatedStyle = useAnimatedStyle(() => ({
      color: isFocused ? theme.borderFocus : theme.placeholderText,
    }));

    const containerAnimatedStyle = useAnimatedStyle(() => {
      const borderColor = isFocused
        ? theme.borderFocus
        : errorText
        ? '#EF4444'
        : theme.bordersBold;

      return {
        borderColor,
      };
    });

    return (
      <View style={[styles.mb4, containerStyle]}>
        <AnimatedView
          style={[
            styles.inputContainer,
            containerAnimatedStyle,
            {
              height: 56,
              justifyContent: 'center',
              paddingHorizontal: 10,
              backgroundColor: 'transparent',
            }
          ]}
        >
          {showFloatingLabel && (
            <AnimatedView
              style={[
                styles.inputLabelContainer,
                {
                  position: 'absolute',
                  left: 6,
                  top: 14,
                  backgroundColor: 'transparent',
                },
                labelAnimatedStyle,
              ]}
            >
              <AnimatedText style={[styles.inputLabel, labelColorAnimatedStyle]}>
                {label}
              </AnimatedText>
            </AnimatedView>
          )}

          <RNTextInput
            ref={ref as React.RefObject<RNTextInput>}
            style={[
              styles.input,
              {
                color: theme.text,
                flex: 1,
                margin: 0,
                padding: 0,
                paddingTop: showFloatingLabel ? 6 : 0,
                fontSize: 16,
                ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
              },
              style,
            ]}
            placeholder={showFloatingLabel ? '' : props.placeholder}
            placeholderTextColor={theme.placeholderText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChangeText={handleChangeText}
            value={value}
            {...props}
          />
        </AnimatedView>

        {errorText ? <Text style={[styles.errorText, styles.mt1]}>{errorText}</Text> : null}
      </View>
    );
  },
);

export default Object.assign(TextInput, {
  displayName: 'TextInput',
});