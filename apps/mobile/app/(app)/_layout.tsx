import React from "react";
import { View } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { StyleSheet } from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { lightColors } from "../../src/theme/colors";
import { fontFamilies } from "../../src/theme/typography";

function TabIcon({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: color,
      }}
    />
  );
}

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
          tabBarIcon: ({ color }) => <TabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => <TabIcon color={color} />,
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
