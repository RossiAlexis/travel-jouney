import React from "react";
import { Text, type TextProps, StyleSheet } from "react-native";
import { textStyles, fontFamilies } from "../theme/typography";
import { lightColors } from "../theme/colors";

interface TypographyProps extends TextProps {
  children: React.ReactNode;
}

const base = StyleSheet.create({
  text: {
    fontFamily: fontFamilies.mono,
    color: lightColors.foreground,
  },
});

export function Heading1({ style, ...props }: TypographyProps) {
  return <Text style={[base.text, styles.h1, style]} {...props} />;
}

export function Heading2({ style, ...props }: TypographyProps) {
  return <Text style={[base.text, styles.h2, style]} {...props} />;
}

export function Heading3({ style, ...props }: TypographyProps) {
  return <Text style={[base.text, styles.h3, style]} {...props} />;
}

export function Heading4({ style, ...props }: TypographyProps) {
  return <Text style={[base.text, styles.h4, style]} {...props} />;
}

export function Body({ style, ...props }: TypographyProps) {
  return <Text style={[base.text, styles.body, style]} {...props} />;
}

export function BodyLarge({ style, ...props }: TypographyProps) {
  return <Text style={[base.text, styles.bodyLarge, style]} {...props} />;
}

export function BodySmall({ style, ...props }: TypographyProps) {
  return <Text style={[base.text, styles.bodySmall, style]} {...props} />;
}

export function Caption({ style, ...props }: TypographyProps) {
  return <Text style={[base.text, styles.caption, style]} {...props} />;
}

export function Label({ style, ...props }: TypographyProps) {
  return <Text style={[base.text, styles.label, style]} {...props} />;
}

export function Muted({ style, ...props }: TypographyProps) {
  return <Text style={[base.text, styles.muted, style]} {...props} />;
}

const styles = StyleSheet.create({
  h1: {
    ...textStyles.h1,
    fontFamily: fontFamilies.monoBold,
  },
  h2: {
    ...textStyles.h2,
    fontFamily: fontFamilies.monoBold,
  },
  h3: {
    ...textStyles.h3,
    fontFamily: fontFamilies.monoMedium,
  },
  h4: {
    ...textStyles.h4,
    fontFamily: fontFamilies.monoMedium,
  },
  body: textStyles.body,
  bodyLarge: textStyles.bodyLarge,
  bodySmall: textStyles.bodySmall,
  caption: textStyles.caption,
  label: {
    ...textStyles.label,
    fontFamily: fontFamilies.monoMedium,
  },
  muted: {
    ...textStyles.body,
    color: lightColors.mutedForeground,
  },
});
