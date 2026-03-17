import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../src/components/Card";
import { Button } from "../../src/components/Button";
import {
  Heading2,
  Body,
  Muted,
  Caption,
} from "../../src/components/Typography";
import { useAuth } from "../../src/hooks/useAuth";
import { useTrips } from "../../src/hooks/useTrips";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { lightColors } from "../../src/theme/colors";
import { formatDateRange } from "../../src/utils";
import type { TripWithCount } from "../../src/services/trips";

export default function HomeScreen() {
  const { user } = useAuth();
  const { data: trips, isLoading, error } = useTrips(user?.id ?? "");

  const ongoingTrips = trips?.filter((t) => t.status === "ONGOING") ?? [];
  const plannedTrips = trips?.filter((t) => t.status === "PLANNED") ?? [];
  const completedTrips = trips?.filter((t) => t.status === "COMPLETED") ?? [];

  function renderSection(title: string, data: TripWithCount[]) {
    if (data.length === 0) return null;
    return (
      <View style={styles.section}>
        <Heading2 style={styles.sectionTitle}>{title}</Heading2>
        {data.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </View>
    );
  }

  if (isLoading) {
    return (
      <ScreenLayout style={styles.centered}>
        <Muted>Loading your trips…</Muted>
      </ScreenLayout>
    );
  }

  if (error) {
    return (
      <ScreenLayout style={styles.centered}>
        <Muted>Failed to load trips. Pull down to retry.</Muted>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scrollable contentStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Heading2>
            {user?.user_metadata?.displayName
              ? `Welcome, ${user.user_metadata.displayName}`
              : "Your Journeys"}
          </Heading2>
          <Muted>
            {trips?.length === 0
              ? "Start documenting your adventures"
              : `${trips?.length} trip${trips?.length === 1 ? "" : "s"} recorded`}
          </Muted>
        </View>
        <Button size="sm" onPress={() => router.push("/(app)/trip/new")}>
          + New Trip
        </Button>
      </View>

      {/* Empty state */}
      {trips?.length === 0 && (
        <Card style={styles.emptyCard}>
          <CardContent>
            <View style={styles.emptyContent}>
              <Body style={styles.emptyText}>No trips yet</Body>
              <Muted style={styles.emptySubtext}>
                Create your first trip to start documenting your adventures
              </Muted>
              <Button
                onPress={() => router.push("/(app)/trip/new")}
                style={styles.emptyButton}
              >
                Create Your First Trip
              </Button>
            </View>
          </CardContent>
        </Card>
      )}

      {renderSection("Ongoing Adventures", ongoingTrips)}
      {renderSection("Upcoming Trips", plannedTrips)}
      {renderSection("Past Adventures", completedTrips)}
    </ScreenLayout>
  );
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PLANNED: {
    bg: lightColors.statusPlannedBg,
    text: lightColors.statusPlannedText,
  },
  ONGOING: {
    bg: lightColors.statusOngoingBg,
    text: lightColors.statusOngoingText,
  },
  COMPLETED: {
    bg: lightColors.statusCompletedBg,
    text: lightColors.statusCompletedText,
  },
};

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planned",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
};

function TripCard({ trip }: { trip: TripWithCount }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        router.push(`/(app)/trip/${trip.id}`)
      }}
    >
      <Card style={styles.tripCard}>
        {/* Cover image */}
        <View style={styles.coverImage}>
          {trip.coverImage ? (
            <Image
              source={{ uri: trip.coverImage }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.coverPlaceholder} />
          )}
          {/* Status badge */}
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  STATUS_COLORS[trip.status]?.bg ?? lightColors.muted,
              },
            ]}
          >
            <Caption
              style={{
                color:
                  STATUS_COLORS[trip.status]?.text ?? lightColors.foreground,
              }}
            >
              {STATUS_LABELS[trip.status] ?? trip.status}
            </Caption>
          </View>
        </View>

        <CardHeader>
          <CardTitle>{trip.title}</CardTitle>
          {trip.description && (
            <CardDescription numberOfLines={2}>
              {trip.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          <Muted>{formatDateRange(trip.startDate, trip.endDate)}</Muted>
          <Muted>
            {trip.memories} {trip.memories === 1 ? "memory" : "memories"}
          </Muted>
        </CardContent>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[8],
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing[4],
  },
  section: {
    gap: spacing[3],
  },
  sectionTitle: {
    fontSize: 18,
  },
  emptyCard: {
    marginTop: spacing[4],
  },
  emptyContent: {
    alignItems: "center",
    paddingVertical: spacing[8],
    gap: spacing[3],
  },
  emptyText: {
    fontWeight: "600",
    fontSize: 18,
  },
  emptySubtext: {
    textAlign: "center",
  },
  emptyButton: {
    marginTop: spacing[2],
  },
  tripCard: {
    gap: 0,
    paddingVertical: 0,
  },
  coverImage: {
    height: 160,
    backgroundColor: lightColors.muted,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: "hidden",
    position: "relative",
  },
  coverPlaceholder: {
    flex: 1,
    backgroundColor: lightColors.muted,
  },
  badge: {
    position: "absolute",
    top: spacing[2],
    right: spacing[2],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.md,
  },
});
