import React from "react";
import { TouchableOpacity, StyleSheet, type ViewStyle } from "react-native";
import { Body } from "./Typography";
import { lightColors } from "../theme/colors";
import { spacing } from "../theme/spacing";

interface FABProps {
  onPress: () => void;
  icon?: string;
  style?: ViewStyle;
}

export function FAB({ onPress, icon = "+", style }: FABProps) {
  return (
    <TouchableOpacity
      style={[styles.fab, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Body style={styles.icon}>{icon}</Body>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: spacing[6],
    right: spacing[4],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: lightColors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 28,
  },
});
