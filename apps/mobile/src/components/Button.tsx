import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { lightColors } from "../theme/colors";
import { borderRadius, spacing } from "../theme/spacing";
import { fontFamilies, fontSizes } from "../theme/typography";

type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps extends Omit<PressableProps, "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  variant = "default",
  size = "default",
  loading = false,
  disabled = false,
  children,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "default" || variant === "destructive"
              ? lightColors.primaryForeground
              : lightColors.primary
          }
        />
      ) : typeof children === "string" ? (
        <Text
          style={[
            styles.text,
            styles[`text_${variant}`],
            styles[`textSize_${size}`],
            textStyle,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "transparent",
    gap: spacing[1.5],
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants
  variant_default: {
    backgroundColor: lightColors.primary,
    borderColor: lightColors.primary,
  },
  variant_outline: {
    backgroundColor: lightColors.background,
    borderColor: lightColors.border,
  },
  variant_secondary: {
    backgroundColor: lightColors.secondary,
    borderColor: "transparent",
  },
  variant_ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  variant_destructive: {
    backgroundColor: `${lightColors.destructive}1A`,
    borderColor: `${lightColors.destructive}33`,
  },
  variant_link: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    paddingHorizontal: 0,
  },

  // Sizes
  size_default: {
    height: 36,
    paddingHorizontal: spacing[2.5],
  },
  size_sm: {
    height: 32,
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.md,
  },
  size_lg: {
    height: 44,
    paddingHorizontal: spacing[3],
  },
  size_icon: {
    height: 36,
    width: 36,
    paddingHorizontal: 0,
  },

  // Text base
  text: {
    fontFamily: fontFamilies.monoMedium,
    fontSize: fontSizes.sm,
  },

  // Text variants
  text_default: {
    color: lightColors.primaryForeground,
  },
  text_outline: {
    color: lightColors.foreground,
  },
  text_secondary: {
    color: lightColors.secondaryForeground,
  },
  text_ghost: {
    color: lightColors.foreground,
  },
  text_destructive: {
    color: lightColors.destructive,
  },
  text_link: {
    color: lightColors.primary,
    textDecorationLine: "underline",
  },

  // Text sizes
  textSize_default: {
    fontSize: fontSizes.sm,
  },
  textSize_sm: {
    fontSize: fontSizes.xs,
  },
  textSize_lg: {
    fontSize: fontSizes.base,
  },
  textSize_icon: {
    fontSize: fontSizes.sm,
  },
});
