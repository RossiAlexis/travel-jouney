import React, { useState } from "react";
import { Form, Link, useNavigation, data, redirect } from "react-router";
import type { Route } from "./+types/memory-new";
import { parseWithZod } from "@conform-to/zod/v4";
import { useForm } from "@conform-to/react";
import { memorySchema } from "~/lib/validations";
import { requireAuth } from "~/lib/auth.server";
import { getTripById, createMemory } from "@repo/services";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function meta() {
  return [
    { title: "New Memory — Bitácora de Viaje" },
    { name: "description", content: "Create a new travel memory" },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const { tripId } = params;

  const trip = await getTripById(tripId, user.id);

  if (!trip) {
    throw new Response("Trip not found", { status: 404 });
  }

  return data({ trip });
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const { tripId } = params;
  const formData = await request.formData();

  if (!formData.get("rating")) formData.delete("rating");
  if (!formData.get("locationName")) formData.delete("locationName");
  if (!formData.get("locationAddress")) formData.delete("locationAddress");

  const submission = parseWithZod(formData, { schema: memorySchema });

  if (submission.status !== "success") {
    return data(
      { submission: submission.reply(), error: null },
      { status: 400 }
    );
  }

  try {
    const memory = await createMemory(tripId, user.id, {
      title: submission.value.title,
      content: submission.value.content,
      date: submission.value.date,
      category: submission.value.category,
      rating: submission.value.rating ?? null,
      locationName: submission.value.locationName ?? null,
      locationAddress: submission.value.locationAddress ?? null,
      latitude: submission.value.latitude ?? null,
      longitude: submission.value.longitude ?? null,
    });

    return redirect(`/trips/${tripId}/memories/${memory.id}`);
  } catch (error) {
    console.error("Error creating memory:", error);
    return data(
      {
        submission: submission.reply(),
        error: "Failed to create memory. Please try again.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// Constants
// ============================================================

const STEPS = [
  { number: 1, label: "Where & When" },
  { number: 2, label: "The Story" },
  { number: 3, label: "Details" },
];

const CATEGORIES = [
  { value: "OTHER", label: "Journal", icon: "✍️" },
  { value: "FOOD", label: "Food", icon: "🍽️" },
  { value: "ACTIVITY", label: "Activity", icon: "🏔️" },
  { value: "ACCOMMODATION", label: "Stay", icon: "🛏️" },
  { value: "TRANSPORT", label: "Transport", icon: "✈️" },
  { value: "REFLECTION", label: "Reflect", icon: "💭" },
] as const;

// ============================================================
// Sub-components
// ============================================================

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <React.Fragment key={step.number}>
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-200 ${
                currentStep > step.number
                  ? "bg-primary/20 text-primary"
                  : currentStep === step.number
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > step.number ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <span className="text-xs font-medium text-muted-foreground hidden sm:block">
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`flex-1 mx-2 h-0.5 transition-colors duration-200 ${
                currentStep > step.number + 1
                  ? "bg-primary"
                  : currentStep > step.number
                  ? "bg-primary/40"
                  : "bg-border"
              } min-w-[40px] max-w-[80px]`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function StarRating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? null : star)}
          className={`text-3xl transition-all duration-150 hover:scale-110 ${
            value !== null && value >= star
              ? "text-amber-400"
              : "text-muted hover:text-amber-300"
          }`}
        >
          ★
        </button>
      ))}
      {value !== null && (
        <span className="text-sm text-muted-foreground ml-2">{value}/5</span>
      )}
    </div>
  );
}

function Step1Content({
  fields,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: any;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    (fields.category.initialValue as string) ?? "OTHER"
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold mb-1">
          Where &amp; When
        </h2>
        <p className="text-sm text-muted-foreground">
          What was it, and when did it happen?
        </p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor={fields.title.id}>
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id={fields.title.id}
          name={fields.title.name}
          placeholder="e.g., First day in Tokyo"
          defaultValue={fields.title.initialValue}
          aria-invalid={!fields.title.valid || undefined}
          aria-describedby={
            !fields.title.valid ? fields.title.errorId : undefined
          }
        />
        {fields.title.errors && (
          <p id={fields.title.errorId} className="text-destructive text-sm">
            {fields.title.errors}
          </p>
        )}
      </div>

      {/* Category visual grid */}
      <div className="space-y-2">
        <Label>
          Category <span className="text-destructive">*</span>
        </Label>
        <input
          type="hidden"
          name={fields.category.name}
          value={selectedCategory}
        />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all duration-150 hover:border-primary/60 hover:bg-primary/5 ${
                selectedCategory === cat.value
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border bg-card"
              }`}
            >
              <span className="text-2xl leading-none">{cat.icon}</span>
              <span className="text-xs font-medium text-foreground/80">
                {cat.label}
              </span>
            </button>
          ))}
        </div>
        {fields.category.errors && (
          <p id={fields.category.errorId} className="text-destructive text-sm">
            {fields.category.errors}
          </p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor={fields.date.id}>
          Date <span className="text-destructive">*</span>
        </Label>
        <Input
          id={fields.date.id}
          name={fields.date.name}
          type="date"
          defaultValue={fields.date.initialValue}
          aria-invalid={!fields.date.valid || undefined}
          aria-describedby={
            !fields.date.valid ? fields.date.errorId : undefined
          }
        />
        {fields.date.errors && (
          <p id={fields.date.errorId} className="text-destructive text-sm">
            {fields.date.errors}
          </p>
        )}
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor={fields.locationName.id}>Location (optional)</Label>
        <Input
          id={fields.locationName.id}
          name={fields.locationName.name}
          placeholder="e.g., Shinjuku, Tokyo"
          defaultValue={fields.locationName.initialValue}
          aria-invalid={!fields.locationName.valid || undefined}
        />
        {fields.locationName.errors && (
          <p
            id={fields.locationName.errorId}
            className="text-destructive text-sm"
          >
            {fields.locationName.errors}
          </p>
        )}
      </div>
    </div>
  );
}

function Step2Content({
  fields,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: any;
}) {
  const [charCount, setCharCount] = useState<number>(
    (fields.content.initialValue as string)?.length ?? 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold mb-1">
          The Story
        </h2>
        <p className="text-sm text-muted-foreground">
          Capture the experience in your own words.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={fields.content.id}>
          Content <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Textarea
            id={fields.content.id}
            name={fields.content.name}
            placeholder="Write freely. What did you see, smell, feel? What will you want to remember in 10 years?"
            className="min-h-[280px] resize-none text-base leading-relaxed font-sans"
            defaultValue={fields.content.initialValue}
            onChange={(e) => setCharCount(e.target.value.length)}
            aria-invalid={!fields.content.valid || undefined}
            aria-describedby={
              !fields.content.valid ? fields.content.errorId : undefined
            }
          />
          <span className="absolute bottom-3 right-3 text-xs text-muted-foreground/60 pointer-events-none select-none">
            {charCount} characters
          </span>
        </div>
        {fields.content.errors && (
          <p id={fields.content.errorId} className="text-destructive text-sm">
            {fields.content.errors}
          </p>
        )}
      </div>
    </div>
  );
}

function Step3Content({
  localRating,
  onRatingChange,
  fields,
}: {
  localRating: number | null;
  onRatingChange: (v: number | null) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: any;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold mb-1">Details</h2>
        <p className="text-sm text-muted-foreground">
          How would you rate this experience?
        </p>
      </div>

      <div className="space-y-3">
        <Label>Rating (optional)</Label>
        <StarRating value={localRating} onChange={onRatingChange} />
        {fields.rating.errors && (
          <p id={fields.rating.errorId} className="text-destructive text-sm">
            {fields.rating.errors}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export default function MemoryNew({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [step, setStep] = useState(1);
  const [localRating, setLocalRating] = useState<number | null>(null);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    lastResult: actionData?.submission,
    onValidate({ formData }) {
      if (!formData.get("rating")) formData.delete("rating");
      if (!formData.get("locationName")) formData.delete("locationName");
      if (!formData.get("locationAddress")) formData.delete("locationAddress");
      return parseWithZod(formData, { schema: memorySchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    defaultValue: {
      category: "OTHER",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const canAdvanceStep1 =
    !fields.title.errors &&
    (fields.title.value as string | undefined) &&
    !fields.date.errors &&
    (fields.date.value as string | undefined);

  const canAdvanceStep2 =
    !fields.content.errors &&
    (fields.content.value as string | undefined);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Back link */}
      <Link
        to={`/trips/${loaderData.trip.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {loaderData.trip.title}
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-md">
        <StepIndicator currentStep={step} />

        {actionData?.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{actionData.error}</AlertDescription>
          </Alert>
        )}

        <Form method="post" id={form.id} onSubmit={form.onSubmit}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                <Step1Content fields={fields} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                <Step2Content fields={fields} />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                <Step3Content
                  localRating={localRating}
                  onRatingChange={setLocalRating}
                  fields={fields}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden rating input for form submission */}
          {localRating !== null && (
            <input
              type="hidden"
              name={fields.rating.name}
              value={localRating}
            />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {step === 1 ? (
              <Button type="button" variant="ghost" asChild>
                <Link to={`/trips/${loaderData.trip.id}`}>Cancel</Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
              >
                ← Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  step === 1 ? !canAdvanceStep1 : !canAdvanceStep2
                }
              >
                Next →
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Memory"}
              </Button>
            )}
          </div>
        </Form>
      </div>
    </div>
  );
}
