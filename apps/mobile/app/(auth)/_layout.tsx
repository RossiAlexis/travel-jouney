import React from "react";
import { Stack } from "expo-router";
import { lightColors } from "../../src/theme/colors";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: lightColors.background },
        animation: "fade",
      }}
    />
  );
}
