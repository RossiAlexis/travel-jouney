import { Form, Link, useNavigation, data, redirect } from "react-router";
import type { Route } from "./+types/memory-new";
import { parseWithZod } from "@conform-to/zod/v4";
import { useForm } from "@conform-to/react";
import { memorySchema } from "~/lib/validations";
import { requireAuth } from "~/lib/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { ArrowLeft, AlertCircle, MapPin } from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "ACCOMMODATION", label: "Accommodation" },
  { value: "FOOD", label: "Food & Dining" },
  { value: "ACTIVITY", label: "Activity" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "REFLECTION", label: "Reflection" },
  { value: "OTHER", label: "Other" },
];

export function meta({ data: loaderData }: Route.MetaArgs) {
  return [
    { title: "Add Memory - Travel Journal" },
    { name: "description", content: "Add a new memory to your trip" },
  ];
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const user = await requireAuth(context.repos, request);
  const { tripId } = params;
  // destinationId may come from URL params (destination-scoped route) or query param
  const destinationIdFromParams = (params as Record<string, string | undefined>).destinationId ?? null;

  const trip = await context.repos.trips.findByIdForUser(tripId, user.id);
  if (!trip) {
    throw new Response("Trip not found", { status: 404 });
  }

  const url = new URL(request.url);
  const destinationId =
    destinationIdFromParams ?? url.searchParams.get("destinationId") ?? null;

  let destination = null;
  if (destinationId) {
    destination = await context.repos.destinations.findByIdForTrip(
      destinationId,
      tripId,
    );
    if (!destination) {
      throw new Response("Destination not found", { status: 404 });
    }
  }

  // Default date to today
  const today = new Date().toISOString().split("T")[0];

  return data({ trip, destination, today });
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const user = await requireAuth(context.repos, request);
  const { tripId } = params;

  // Verify trip ownership
  const trip = await context.repos.trips.findByIdForUser(tripId, user.id);
  if (!trip) {
    throw new Response("Trip not found", { status: 404 });
  }

  const formData = await request.formData();

  // Clean optional numeric/text fields before parsing
  if (!formData.get("rating")) formData.delete("rating");
  if (!formData.get("latitude")) formData.delete("latitude");
  if (!formData.get("longitude")) formData.delete("longitude");
  if (!formData.get("locationName")) formData.delete("locationName");
  if (!formData.get("locationAddress")) formData.delete("locationAddress");
  if (!formData.get("destinationId")) formData.delete("destinationId");

  const submission = parseWithZod(formData, { schema: memorySchema });

  if (submission.status !== "success") {
    return data(
      { submission: submission.reply(), error: null },
      { status: 400 },
    );
  }

  // If destinationId provided, verify it belongs to this trip
  const destinationId = submission.value.destinationId ?? null;
  if (destinationId) {
    const destination = await context.repos.destinations.findByIdForTrip(
      destinationId,
      tripId,
    );
    if (!destination) {
      throw new Response("Destination not found", { status: 404 });
    }
  }

  try {
    const memory = await context.repos.memories.create({
      tripId,
      userId: user.id,
      destinationId,
      title: submission.value.title,
      content: submission.value.content,
      date: new Date(submission.value.date),
      category: submission.value.category,
      rating: submission.value.rating ?? null,
      locationName: submission.value.locationName ?? null,
      locationAddress: submission.value.locationAddress ?? null,
      latitude: submission.value.latitude ?? null,
      longitude: submission.value.longitude ?? null,
    });

    if (destinationId) {
      return redirect(
        `/trips/${tripId}/destinations/${destinationId}`,
      );
    }

    return redirect(`/trips/${tripId}`);
  } catch (error) {
    console.error("Error creating memory:", error);
    return data(
      {
        submission: submission.reply(),
        error: "Failed to create memory. Please try again.",
      },
      { status: 500 },
    );
  }
}

export default function MemoryNew({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { trip, destination, today } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    lastResult: actionData?.submission,
    onValidate({ formData }) {
      if (!formData.get("rating")) formData.delete("rating");
      if (!formData.get("latitude")) formData.delete("latitude");
      if (!formData.get("longitude")) formData.delete("longitude");
      if (!formData.get("locationName")) formData.delete("locationName");
      if (!formData.get("locationAddress")) formData.delete("locationAddress");
      if (!formData.get("destinationId")) formData.delete("destinationId");
      return parseWithZod(formData, { schema: memorySchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    defaultValue: {
      date: today,
      category: "OTHER",
    },
  });

  const backHref = destination
    ? `/trips/${trip.id}/destinations/${destination.id}`
    : `/trips/${trip.id}`;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {destination ? destination.name : trip.title}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Add Memory</h1>
        <p className="text-muted-foreground mt-1">
          Capture a moment from your journey
        </p>
      </div>

      {/* Destination context badge */}
      {destination && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Adding to:</span>
          <Badge variant="secondary" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {destination.name}
          </Badge>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Memory Details</CardTitle>
          <CardDescription>
            Describe what happened, where you were, and how it felt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actionData?.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{actionData.error}</AlertDescription>
            </Alert>
          )}

          <Form method="post" id={form.id} onSubmit={form.onSubmit}>
            {/* Hidden destinationId */}
            {destination && (
              <input
                type="hidden"
                name={fields.destinationId.name}
                value={destination.id}
              />
            )}

            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor={fields.title.id}>
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={fields.title.id}
                  name={fields.title.name}
                  placeholder="e.g., Sunset at CN Tower"
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

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor={fields.content.id}>
                  Memory <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id={fields.content.id}
                  name={fields.content.name}
                  placeholder="Write about what happened, what you saw, how you felt..."
                  rows={6}
                  defaultValue={fields.content.initialValue}
                  aria-invalid={!fields.content.valid || undefined}
                  aria-describedby={
                    !fields.content.valid ? fields.content.errorId : undefined
                  }
                />
                {fields.content.errors && (
                  <p
                    id={fields.content.errorId}
                    className="text-destructive text-sm"
                  >
                    {fields.content.errors}
                  </p>
                )}
              </div>

              {/* Date & Category */}
              <div className="grid gap-4 sm:grid-cols-2">
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
                    <p
                      id={fields.date.errorId}
                      className="text-destructive text-sm"
                    >
                      {fields.date.errors}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={fields.category.id}>
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    name={fields.category.name}
                    defaultValue={fields.category.initialValue || "OTHER"}
                  >
                    <SelectTrigger
                      id={fields.category.id}
                      className="w-full"
                      aria-invalid={!fields.category.valid || undefined}
                      aria-describedby={
                        !fields.category.valid
                          ? fields.category.errorId
                          : undefined
                      }
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fields.category.errors && (
                    <p
                      id={fields.category.errorId}
                      className="text-destructive text-sm"
                    >
                      {fields.category.errors}
                    </p>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <Label htmlFor={fields.rating.id}>Rating (optional)</Label>
                <Select
                  name={fields.rating.name}
                  defaultValue={fields.rating.initialValue as string | undefined}
                >
                  <SelectTrigger
                    id={fields.rating.id}
                    className="w-full"
                    aria-invalid={!fields.rating.valid || undefined}
                    aria-describedby={
                      !fields.rating.valid ? fields.rating.errorId : undefined
                    }
                  >
                    <SelectValue placeholder="No rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">★ 1 — Poor</SelectItem>
                    <SelectItem value="2">★★ 2 — Fair</SelectItem>
                    <SelectItem value="3">★★★ 3 — Good</SelectItem>
                    <SelectItem value="4">★★★★ 4 — Great</SelectItem>
                    <SelectItem value="5">★★★★★ 5 — Excellent</SelectItem>
                  </SelectContent>
                </Select>
                {fields.rating.errors && (
                  <p
                    id={fields.rating.errorId}
                    className="text-destructive text-sm"
                  >
                    {fields.rating.errors}
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor={fields.locationName.id}>
                  Location (optional)
                </Label>
                <Input
                  id={fields.locationName.id}
                  name={fields.locationName.name}
                  placeholder="e.g., CN Tower, Toronto"
                  defaultValue={fields.locationName.initialValue}
                  aria-invalid={!fields.locationName.valid || undefined}
                  aria-describedby={
                    !fields.locationName.valid
                      ? fields.locationName.errorId
                      : undefined
                  }
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

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Memory"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to={backHref}>Cancel</Link>
                </Button>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
