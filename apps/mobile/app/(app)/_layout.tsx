import React from "react";
import { Tabs, Redirect } from "expo-router";
import { StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/hooks/useAuth";
import { lightColors } from "../../src/theme/colors";
import { fontFamilies } from "../../src/theme/typography";

export default function AppLayout() {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) return null;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: lightColors.primary,
        tabBarInactiveTintColor: lightColors.mutedForeground,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trips",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="journal-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="trip"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: lightColors.card,
    borderTopColor: lightColors.border,
    borderTopWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontFamily: fontFamilies.monoMedium,
    fontSize: 11,
  },
});
