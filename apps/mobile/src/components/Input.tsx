import React, { useState } from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { lightColors } from "../theme/colors";
import { borderRadius, spacing } from "../theme/spacing";
import { fontFamilies, fontSizes } from "../theme/typography";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={lightColors.mutedForeground}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[1.5],
  },
  label: {
    fontFamily: fontFamilies.monoMedium,
    fontSize: fontSizes.sm,
    color: lightColors.foreground,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: lightColors.input,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    backgroundColor: lightColors.background,
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.base,
    color: lightColors.foreground,
  },
  inputFocused: {
    borderColor: lightColors.ring,
    borderWidth: 2,
  },
  inputError: {
    borderColor: lightColors.destructive,
  },
  error: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    color: lightColors.destructive,
  },
});
