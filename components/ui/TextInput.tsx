import React, {useState, useCallback, useEffect} from 'react';
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

// ─── TextInput Layout Constants ─────────────────────────────────────────────
// These values control the floating label position and input padding on focus.
// Each value has an optional Platform override — uncomment to target a platform.
// Example: const FLOATING_LABEL_TOP = Platform.select({ web: 14, default: 14 });
// ─────────────────────────────────────────────────────────────────────────────
const FLOATING_LABEL_LEFT = 6;
const FLOATING_LABEL_TOP = 14;
const FLOATING_LABEL_SCALE = 0.85;
const FLOATING_LABEL_TRANSLATE_Y = -16;
const INPUT_PADDING_TOP_FOCUSED = Platform.select({ web: 6, default: 16 });
const INPUT_PADDING_LEFT = 0; // Additional left padding for the input text
// ─────────────────────────────────────────────────────────────────────────────

type TextInputProps = RNTextInput['props'] & {
  label?: string;
  errorText?: string;
  containerStyle?: any;
  disableFloatingLabel?: boolean;
  borderless?: boolean;
  height?: number;
};

const AnimatedText = createAnimatedComponent(Text);
const AnimatedView = createAnimatedComponent(View);

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  ({label, errorText, containerStyle, style, onFocus, onBlur, onChangeText, value, disableFloatingLabel, borderless, height, ...props}, ref) => {
    const styles = useThemeStyles();
    const theme = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value ? value.length > 0 : false;
    const disableFloatingLabelProp = disableFloatingLabel ?? false;

    const labelScale = useSharedValue(1);
    const labelTranslateY = useSharedValue(0);

    // Shared values for theme-dependent animations
    const labelColorShared = useSharedValue(theme.placeholderText);
    const borderColorShared = useSharedValue(theme.bordersBold);

    // Initialize label position for pre-filled values
    useEffect(() => {
      if (hasValue) {
        labelScale.value = FLOATING_LABEL_SCALE;
        labelTranslateY.value = FLOATING_LABEL_TRANSLATE_Y;
      }
    }, [hasValue, labelScale, labelTranslateY]);

    // Update shared values when theme or focus changes
    useEffect(() => {
      labelColorShared.value = isFocused ? theme.borderFocus : theme.placeholderText;
    }, [isFocused, theme.borderFocus, theme.placeholderText]);

    useEffect(() => {
      borderColorShared.value = isFocused
        ? theme.borderFocus
        : errorText
        ? theme.danger
        : theme.bordersBold;
    }, [isFocused, theme.borderFocus, errorText, theme.borderFocus, theme.bordersBold, theme.danger]);

    const showFloatingLabel = disableFloatingLabelProp ? false : (isFocused || hasValue || !!label);

    const updateLabelState = useCallback(
      (focused: boolean, val: string | undefined) => {
        if (disableFloatingLabelProp) return;
        const hasVal = val ? val.length > 0 : false;
        const shouldFloat = focused || hasVal;

        labelScale.value = withTiming(shouldFloat ? FLOATING_LABEL_SCALE : 1, {
          duration: 150,
          easing: Easing.inOut(Easing.ease),
        });

        labelTranslateY.value = withTiming(shouldFloat ? FLOATING_LABEL_TRANSLATE_Y : 0, {
          duration: 150,
          easing: Easing.inOut(Easing.ease),
        });
      },
      [labelScale, labelTranslateY, disableFloatingLabelProp],
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
      color: labelColorShared.value,
    }));

    const containerAnimatedStyle = useAnimatedStyle(() => ({
      borderColor: borderless ? 'transparent' : borderColorShared.value,
      borderWidth: borderless ? 0 : 1,
    }));

    return (
      <View style={[styles.mb4, containerStyle]}>
        <AnimatedView
          style={[
            styles.inputContainer,
            containerAnimatedStyle,
            {
              height: height ?? (props.multiline ? undefined : 56),
              justifyContent: 'center',
              paddingHorizontal: borderless ? 0 : 10,
              backgroundColor: 'transparent',
              ...(borderless ? { padding: 0, paddingBottom: 0, borderRadius: 0 } : {}),
            }
          ]}
        >
          {showFloatingLabel && label && (
            <AnimatedView
              style={[
                styles.inputLabelContainer,
                {
                  position: 'absolute',
                  left: FLOATING_LABEL_LEFT,
                  top: FLOATING_LABEL_TOP,
                  backgroundColor: 'transparent',
                },
                labelAnimatedStyle,
              ]}
              pointerEvents="none"
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
              // Move theme colors inline as per user instructions
              {color: theme.text},
              {
                flex: 1,
                margin: 0,
                padding: 0,
                paddingLeft: INPUT_PADDING_LEFT,
                paddingTop: showFloatingLabel ? INPUT_PADDING_TOP_FOCUSED : 0,
                fontSize: 16,
                ...(height ? { height } : {}),
                ...(Platform.OS === 'web' ? { outline: 'none', outlineStyle: 'none', borderStyle: 'none', borderWidth: 0 } as any : {}),
              },
              style,
            ]}
            placeholder={(!disableFloatingLabelProp && label) ? (isFocused ? props.placeholder : '') : props.placeholder}
            placeholderTextColor={theme.placeholderText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChangeText={handleChangeText}
            value={value}
            {...props}
          />
        </AnimatedView>

        {errorText ? <Text style={[styles.errorText, {color: theme.error || theme.danger}, styles.mt1]}>{errorText}</Text> : null}
      </View>
    );
  },
);

TextInput.displayName = 'TextInput';

export default Object.assign(TextInput, {
  displayName: 'TextInput',
});