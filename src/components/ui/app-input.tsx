import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColor } from '@/constants/colors';
import { Tokens } from '@/constants/tokens';

export interface AppInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string | null;
  keyboardType?: KeyboardTypeOptions;
  numeric?: boolean;
  placeholder?: string;
  secureTextEntry?: boolean;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppInput({
  label,
  value,
  onChangeText,
  error,
  keyboardType,
  numeric = false,
  placeholder,
  secureTextEntry = false,
  editable = true,
  style,
}: AppInputProps) {
  const colors = useThemeColor();
  const [isFocused, setIsFocused] = useState(false);

  const isFloating = isFocused || Boolean(value && value.length > 0);
  const floatAnim = useSharedValue(isFloating ? 1 : 0);

  useEffect(() => {
    floatAnim.value = withTiming(isFloating ? 1 : 0, { duration: 180 });
  }, [floatAnim, isFloating]);

  const labelAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(floatAnim.value, [0, 1], [0, -12]);
    const fontSize = interpolate(
      floatAnim.value,
      [0, 1],
      [Tokens.typography.bodyLg.fontSize, Tokens.typography.caption.fontSize]
    );

    return {
      transform: [{ translateY }],
      fontSize,
    };
  });

  const resolvedKeyboardType: KeyboardTypeOptions =
    keyboardType ?? (numeric ? 'decimal-pad' : 'default');

  const getBorderColor = (): string => {
    if (error) return colors.danger;
    if (isFocused) return colors.primary;
    return colors.border;
  };

  const dynamicBoxStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderColor: getBorderColor(),
  };

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.container, dynamicBoxStyle]}>
        <View style={styles.inputArea}>
          <Animated.Text
            numberOfLines={1}
            style={[
              styles.floatingLabel,
              {
                color: error
                  ? colors.danger
                  : isFocused
                    ? colors.primary
                    : colors.textMuted,
              },
              labelAnimatedStyle,
            ]}>
            {label}
          </Animated.Text>
          <TextInput
            editable={editable}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFloating ? placeholder : undefined}
            placeholderTextColor={colors.textDisabled}
            keyboardType={resolvedKeyboardType}
            secureTextEntry={secureTextEntry}
            style={[
              styles.input,
              { color: colors.text },
              isFloating && styles.inputWithFloatingLabel,
            ]}
          />
        </View>
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: Tokens.spacing.xs,
  },
  container: {
    minHeight: 56,
    borderRadius: Tokens.radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Tokens.spacing.lg,
    justifyContent: 'center',
  },
  inputArea: {
    justifyContent: 'center',
    paddingVertical: Tokens.spacing.xs,
  },
  floatingLabel: {
    position: 'absolute',
    left: 0,
    fontWeight: '600',
  },
  input: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    padding: 0,
    margin: 0,
    fontWeight: '600',
    minHeight: 24,
  },
  inputWithFloatingLabel: {
    marginTop: Tokens.spacing.md,
  },
  errorText: {
    fontSize: Tokens.typography.caption.fontSize,
    lineHeight: Tokens.typography.caption.lineHeight,
    fontWeight: '600',
    paddingHorizontal: Tokens.spacing.xs,
  },
});
