import React from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Haptics from 'expo-haptics'
import { ScreenLayout } from '../../../../src/components/ScreenLayout'
import { Button } from '../../../../src/components/Button'
import { Input } from '../../../../src/components/Input'
import {
  Heading2,
  Body,
  Muted,
  Caption,
} from '../../../../src/components/Typography'
import { useCreateMemory } from '../../../../src/hooks/useTrips'
import { spacing, borderRadius } from '../../../../src/theme/spacing'
import { lightColors } from '../../../../src/theme/colors'

const createMemorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Story is required'),
  date: z.string().min(1, 'Date is required'),
  locationName: z.string().optional(),
  category: z.enum([
    'ACCOMMODATION',
    'FOOD',
    'ACTIVITY',
    'TRANSPORT',
    'REFLECTION',
    'OTHER',
  ]),
  rating: z.number().int().min(1).max(5).optional(),
})

type CreateMemoryForm = z.infer<typeof createMemorySchema>

const CATEGORIES = [
  { value: 'OTHER', label: 'General' },
  { value: 'FOOD', label: 'Food' },
  { value: 'ACTIVITY', label: 'Activity' },
  { value: 'ACCOMMODATION', label: 'Stay' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'REFLECTION', label: 'Reflection' },
] as const

const today = new Date().toISOString().split('T')[0]

export default function NewMemoryScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()
  const createMemory = useCreateMemory()

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateMemoryForm>({
    resolver: zodResolver(createMemorySchema),
    defaultValues: {
      title: '',
      content: '',
      date: today,
      locationName: '',
      category: 'OTHER',
      rating: undefined,
    },
  })

  const selectedCategory = watch('category')
  const selectedRating = watch('rating')

  async function onSubmit(data: CreateMemoryForm) {
    if (!tripId) {
      Alert.alert('Error', 'Trip ID is missing.')
      return
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await createMemory.mutateAsync({
        tripId,
        title: data.title,
        content: data.content,
        date: data.date,
        locationName: data.locationName,
        category: data.category,
        rating: data.rating,
        slug: null,
      } as any)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.back()
    } catch (error) {
      Alert.alert(
        'Failed to save memory',
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.',
      )
    }
  }

  return (
    <ScreenLayout scrollable contentStyle={styles.content}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Body style={styles.backText}>← Back</Body>
          </TouchableOpacity>
          <Heading2>New Memory</Heading2>
          <Muted>Capture a moment from your trip</Muted>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Title */}
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Title"
                placeholder="What happened?"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.title?.message}
              />
            )}
          />

          {/* Story / Content */}
          <Controller
            control={control}
            name="content"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Story"
                placeholder="Tell the story of this memory…"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.content?.message}
                multiline
                numberOfLines={5}
                style={styles.textarea}
              />
            )}
          />

          {/* Date */}
          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Date (YYYY-MM-DD)"
                placeholder={today}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.date?.message}
                keyboardType="numeric"
              />
            )}
          />

          {/* Location */}
          <Controller
            control={control}
            name="locationName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Location (optional)"
                placeholder="Where were you?"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.locationName?.message}
              />
            )}
          />

          {/* Category picker */}
          <View style={styles.fieldGroup}>
            <Body style={styles.fieldLabel}>Category</Body>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.value
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipSelected,
                    ]}
                    onPress={() => setValue('category', cat.value)}
                    activeOpacity={0.7}
                  >
                    <Caption
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Caption>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
            {errors.category?.message && (
              <Caption style={styles.errorText}>
                {errors.category.message}
              </Caption>
            )}
          </View>

          {/* Rating */}
          <View style={styles.fieldGroup}>
            <Body style={styles.fieldLabel}>Rating (optional)</Body>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isSelected =
                  selectedRating !== undefined && star <= selectedRating
                return (
                  <TouchableOpacity
                    key={star}
                    onPress={() => {
                      if (selectedRating === star) {
                        setValue('rating', undefined)
                      } else {
                        setValue('rating', star)
                      }
                    }}
                    activeOpacity={0.7}
                    style={styles.starBtn}
                  >
                    <Body style={isSelected ? styles.starFilled : styles.starEmpty}>
                      {isSelected ? '★' : '☆'}
                    </Body>
                  </TouchableOpacity>
                )
              })}
              {selectedRating && (
                <Muted style={styles.ratingLabel}>{selectedRating}/5</Muted>
              )}
            </View>
          </View>

          {/* Submit */}
          <Button
            onPress={handleSubmit(onSubmit)}
            loading={createMemory.isPending}
            size="lg"
            style={styles.submitButton}
          >
            Save Memory
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  keyboard: {
    flex: 1,
    gap: spacing[6],
  },
  header: {
    gap: spacing[2],
  },
  backBtn: {
    paddingVertical: spacing[2],
  },
  backText: {
    color: lightColors.primary,
  },
  form: {
    gap: spacing[4],
  },
  textarea: {
    height: 120,
    paddingTop: spacing[2],
    textAlignVertical: 'top',
  },
  fieldGroup: {
    gap: spacing[2],
  },
  fieldLabel: {
    fontWeight: '500',
  },
  categoryList: {
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  categoryChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: lightColors.border,
    backgroundColor: lightColors.background,
  },
  categoryChipSelected: {
    backgroundColor: lightColors.primary,
    borderColor: lightColors.primary,
  },
  categoryChipText: {
    color: lightColors.foreground,
  },
  categoryChipTextSelected: {
    color: lightColors.primaryForeground,
  },
  errorText: {
    color: lightColors.destructive,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  starBtn: {
    padding: spacing[1],
  },
  starFilled: {
    fontSize: 24,
    color: lightColors.chart1,
  },
  starEmpty: {
    fontSize: 24,
    color: lightColors.mutedForeground,
  },
  ratingLabel: {
    marginLeft: spacing[2],
  },
  submitButton: {
    marginTop: spacing[2],
  },
})
