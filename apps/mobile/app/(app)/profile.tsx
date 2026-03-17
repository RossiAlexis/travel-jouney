import React from "react";
import { View, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { Button } from "../../src/components/Button";
import { Heading2, Body, Muted, Caption } from "../../src/components/Typography";
import { useAuth } from "../../src/hooks/useAuth";
import { spacing } from "../../src/theme/spacing";
import { lightColors } from "../../src/theme/colors";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)/login");
          },
        },
      ],
    );
  };

  if (!user) return null;

  const avatarInitial =
    user.displayName?.charAt(0).toUpperCase() ??
    user.username?.charAt(0).toUpperCase() ??
    "?";

  return (
    <ScreenLayout scrollable contentStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Body style={styles.avatarText}>{avatarInitial}</Body>
        </View>
        <Heading2 style={styles.displayName}>{user.displayName}</Heading2>
        <Muted>@{user.username}</Muted>
      </View>

      {/* Info card */}
      <View style={styles.section}>
        <View style={styles.infoRow}>
          <Caption style={styles.infoLabel}>Email</Caption>
          <Body style={styles.infoValue}>{user.email}</Body>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          variant="destructive"
          onPress={handleSignOut}
          style={styles.actionButton}
        >
          Sign Out
        </Button>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[8],
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: spacing[8],
    gap: spacing[2],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: lightColors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "600",
  },
  displayName: {
    textAlign: "center",
  },
  section: {
    backgroundColor: lightColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: lightColors.border,
    padding: spacing[4],
    gap: spacing[3],
  },
  infoRow: {
    gap: spacing[1],
  },
  infoLabel: {
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  infoValue: {
    color: lightColors.foreground,
  },
  actions: {
    gap: spacing[3],
  },
  actionButton: {
    width: "100%",
  },
});
