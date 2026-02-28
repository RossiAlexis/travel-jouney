import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { lightColors } from "../theme/colors";
import { spacing } from "../theme/spacing";

interface ScreenLayoutProps {
  children: React.ReactNode;
  /** Wrap content in a ScrollView (default: false) */
  scrollable?: boolean;
  /** Remove horizontal padding (e.g. for full-width content) */
  noPadding?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  scrollViewProps?: ScrollViewProps;
}

/**
 * Consistent screen wrapper with safe area insets.
 * Use this as the root component in every screen.
 */
export function ScreenLayout({
  children,
  scrollable = false,
  noPadding = false,
  style,
  contentStyle,
  scrollViewProps,
}: ScreenLayoutProps) {
  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        !noPadding && styles.padded,
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, !noPadding && styles.padded, contentStyle]}>
      {children}
    </View>
  );

  return <SafeAreaView style={[styles.safe, style]}>{content}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: lightColors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: spacing[4],
  },
});
