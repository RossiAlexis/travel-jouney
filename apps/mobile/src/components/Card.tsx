import React from "react";
import {
  View,
  StyleSheet,
  type ViewProps,
  type StyleProp,
  type ViewStyle,
  type TextProps,
} from "react-native";
import { lightColors } from "../theme/colors";
import { borderRadius, spacing, shadows } from "../theme/spacing";
import { Heading4, Muted } from "./Typography";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style, ...props }: CardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

export function CardHeader({ children, style, ...props }: CardProps) {
  return (
    <View style={[styles.header, style]} {...props}>
      {children}
    </View>
  );
}

interface CardTextProps extends Omit<TextProps, "style"> {
  children: React.ReactNode;
  style?: TextProps["style"];
}

export function CardTitle({ children, style, ...props }: CardTextProps) {
  return (
    <Heading4 style={[styles.title, style]} {...props}>
      {children}
    </Heading4>
  );
}

export function CardDescription({ children, style, ...props }: CardTextProps) {
  return (
    <Muted style={[styles.description, style]} {...props}>
      {children}
    </Muted>
  );
}

export function CardContent({ children, style, ...props }: CardProps) {
  return (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );
}

export function CardFooter({ children, style, ...props }: CardProps) {
  return (
    <View style={[styles.footer, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: lightColors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: lightColors.border,
    overflow: "hidden",
    gap: spacing[4],
    paddingVertical: spacing[4],
    ...shadows.sm,
  },
  header: {
    paddingHorizontal: spacing[4],
    gap: spacing[1],
  },
  title: {
    color: lightColors.cardForeground,
  },
  description: {
    color: lightColors.mutedForeground,
  },
  content: {
    paddingHorizontal: spacing[4],
  },
  footer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    borderTopWidth: 1,
    borderTopColor: lightColors.border,
    backgroundColor: `${lightColors.muted}80`,
  },
});
