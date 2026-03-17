import React from "react";
import { View, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenLayout } from "../../../src/components/ScreenLayout";
import { FAB } from "../../../src/components/FAB";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../src/components/Card";
import { Button } from "../../../src/components/Button";
import {
  Heading2,
  Heading4,
  Body,
  Muted,
  Caption,
} from "../../../src/components/Typography";
import {
  useTrip,
  useMemories,
  useDeleteTrip,
} from "../../../src/hooks/useTrips";
import { spacing } from "../../../src/theme/spacing";
import { lightColors } from "../../../src/theme/colors";
import { formatDate } from "../../../src/utils";
import type { Memory } from "@repo/types";

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip, isLoading: tripLoading } = useTrip(id);
  const { data: memories, isLoading: memoriesLoading } = useMemories(id);
  const deleteTrip = useDeleteTrip();

  async function handleDelete() {
    Alert.alert(
      "Delete trip",
      "Are you sure? This will also delete all memories in this trip.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTrip.mutateAsync(id);
              router.back();
            } catch {
              Alert.alert("Error", "Failed to delete trip. Please try again.");
            }
          },
        },
      ],
    );
  }

  if (tripLoading) {
    return (
      <ScreenLayout style={styles.centered}>
        <Muted>Loading trip…</Muted>
      </ScreenLayout>
    );
  }

  if (!trip) {
    return (
      <ScreenLayout style={styles.centered}>
        <Muted>Trip not found.</Muted>
        <Button
          onPress={() => router.back()}
          variant="ghost"
          style={{ marginTop: spacing[4] }}
        >
          Go back
        </Button>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout noPadding style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Body style={{ color: lightColors.primary }}>← Back</Body>
        </Pressable>

        {/* Trip header */}
        <View style={styles.tripHeader}>
          <Heading2>{trip.title}</Heading2>
          {trip.description && <Muted>{trip.description}</Muted>}
          <Muted>
            {formatDate(trip.startDate)}
            {trip.endDate ? ` – ${formatDate(trip.endDate)}` : ""}
          </Muted>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button variant="destructive" size="sm" onPress={handleDelete}>
            Delete
          </Button>
        </View>

        {/* Memories section */}
        <View style={styles.memoriesSection}>
          <View style={styles.memoriesHeader}>
            <Heading4>Memories</Heading4>
          </View>

          {memoriesLoading && <Muted>Loading memories…</Muted>}

          {!memoriesLoading && memories?.length === 0 && (
            <Card>
              <CardContent>
                <View style={styles.emptyMemories}>
                  <Muted>No memories yet</Muted>
                  <Caption>Capture your first memory from this trip</Caption>
                </View>
              </CardContent>
            </Card>
          )}

          {memories?.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </View>
      </ScrollView>
      <FAB
        onPress={() =>
          router.push({
            pathname: "/(app)/trip/memory/new",
            params: { tripId: id },
          })
        }
      />
    </ScreenLayout>
  );
}

function MemoryCard({ memory }: { memory: Memory }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{memory.title}</CardTitle>
        {memory.date && (
          <CardDescription>{formatDate(memory.date)}</CardDescription>
        )}
      </CardHeader>
      {memory.content && (
        <CardContent>
          <Body numberOfLines={3}>{memory.content}</Body>
        </CardContent>
      )}
      {memory.rating && (
        <CardContent>
          <Caption>
            Rating: {"★".repeat(memory.rating)}
            {"☆".repeat(5 - memory.rating)}
          </Caption>
        </CardContent>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: "relative",
  },
  content: {
    gap: spacing[6],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[20],
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  back: {
    paddingVertical: spacing[2],
  },
  tripHeader: {
    gap: spacing[2],
  },
  actions: {
    flexDirection: "row",
    gap: spacing[2],
  },
  memoriesSection: {
    gap: spacing[3],
  },
  memoriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emptyMemories: {
    alignItems: "center",
    paddingVertical: spacing[6],
    gap: spacing[2],
  },
});
