import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Constants from "expo-constants";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { Heading2, Body, Muted } from "../../src/components/Typography";
import { useAuth } from "../../src/hooks/useAuth";
import { useTrips } from "../../src/hooks/useTrips";
import { lightColors } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";

// react-native-maps requires a native module (RNMapsAirModule) that is not
// pre-compiled in Expo Go. Guard the import so the screen degrades gracefully
// instead of crashing the whole navigator.
const IS_EXPO_GO = Constants.executionEnvironment === "storeClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MapView: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Marker: any = null;

if (!IS_EXPO_GO) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const maps = require("react-native-maps");
    MapView = maps.default;
    Marker = maps.Marker;
  } catch {
    // native module unavailable — placeholder will render below
  }
}

const DEFAULT_REGION = {
  latitude: 20,
  longitude: 0,
  latitudeDelta: 80,
  longitudeDelta: 120,
};

export default function MapScreen() {
  const { user } = useAuth();
  const { data: trips } = useTrips(user?.id ?? "");

  const pins = useMemo(() => {
    if (!trips) return [];
    return trips
      .filter((t) => t.isPublic)
      .map((t) => ({
        id: t.id,
        title: t.title,
        coordinate: { latitude: 0, longitude: 0 },
      }));
  }, [trips]);

  if (!MapView) {
    return (
      <ScreenLayout>
        <View style={styles.placeholder}>
          <Heading2>Map unavailable</Heading2>
          <Body style={styles.placeholderText}>
            Maps require a development build and are not available in Expo Go.
          </Body>
          <Muted>Run &quot;eas build --profile development&quot; to enable maps.</Muted>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout noPadding>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton
      >
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={pin.coordinate}
            title={pin.title}
            pinColor={lightColors.primary}
          />
        ))}
      </MapView>

      <View style={styles.header} pointerEvents="none">
        <Heading2 style={styles.headerText}>Visited Places</Heading2>
        <Muted style={styles.headerText}>
          {pins.length > 0
            ? `${pins.length} location${pins.length === 1 ? "" : "s"} mapped`
            : "Your visited places will appear here"}
        </Muted>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[6],
  },
  placeholderText: {
    textAlign: "center",
  },
  header: {
    position: "absolute",
    top: spacing[4],
    left: spacing[4],
    right: spacing[4],
    backgroundColor: `${lightColors.card}F0`,
    borderRadius: 12,
    padding: spacing[4],
    gap: spacing[1],
  },
  headerText: {
    color: lightColors.foreground,
  },
});
