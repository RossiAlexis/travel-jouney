import React from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ScreenLayout } from "../../../src/components/ScreenLayout";
import { Button } from "../../../src/components/Button";
import { Input } from "../../../src/components/Input";
import { Heading2, Muted } from "../../../src/components/Typography";
import { useAuth } from "../../../src/hooks/useAuth";
import { useCreateTrip } from "../../../src/hooks/useTrips";
import { spacing } from "../../../src/theme/spacing";

const newTripSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type NewTripForm = z.infer<typeof newTripSchema>;

export default function NewTripScreen() {
  const { user } = useAuth();
  const createTrip = useCreateTrip();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NewTripForm>({
    resolver: zodResolver(newTripSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
    },
  });

  async function onSubmit(data: NewTripForm) {
    if (!user) return;

    try {
      const trip = await createTrip.mutateAsync({
        title: data.title,
        description: data.description ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        userId: user.id,
        isPublic: false,
        slug: null,
        coverImage: null,
      });
      router.replace(`/(app)/trip/${trip.id}`);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to create trip. Please try again.",
      );
    }
  }

  return (
    <ScreenLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Button variant="ghost" onPress={() => router.back()}>
              ← Cancel
            </Button>
            <Heading2>New trip</Heading2>
            <Muted>Document your next adventure</Muted>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Title *"
                  placeholder="e.g. Summer in Japan"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.title?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Description"
                  placeholder="What's this trip about?"
                  multiline
                  numberOfLines={3}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.description?.message}
                  style={styles.textarea}
                />
              )}
            />

            <Controller
              control={control}
              name="startDate"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Start date"
                  placeholder="YYYY-MM-DD"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.startDate?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="endDate"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="End date"
                  placeholder="YYYY-MM-DD"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.endDate?.message}
                />
              )}
            />

            <Button
              onPress={handleSubmit(onSubmit)}
              loading={createTrip.isPending}
              size="lg"
              style={styles.submitButton}
            >
              Create trip
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[8],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[8],
  },
  header: {
    gap: spacing[2],
  },
  form: {
    gap: spacing[4],
  },
  textarea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: spacing[2],
  },
  submitButton: {
    marginTop: spacing[2],
  },
});
