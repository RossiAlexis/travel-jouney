import { Form, Link, useNavigation, data, redirect } from "react-router";
import type { Route } from "./+types/memory-edit";
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
import { ArrowLeft, AlertCircle } from "lucide-react";
import { MEMORY_CATEGORY_OPTIONS } from "~/lib/constants";

const CATEGORY_OPTIONS = MEMORY_CATEGORY_OPTIONS;

export function meta({ data: loaderData }: Route.MetaArgs) {
  return [
    {
      title: `Edit — ${loaderData?.memory?.title ?? "Memory"} - Travel Journal`,
    },
  ];
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const user = await requireAuth(context.repos, request);
  const { tripId, memoryId } = params;

  const trip = await context.repos.trips.findByIdForUser(tripId, user.id);
  if (!trip) throw new Response("Trip not found", { status: 404 });

  const memory = await context.repos.memories.findByIdForTrip(memoryId, tripId);
  if (!memory) throw new Response("Memory not found", { status: 404 });

  return data({ trip, memory });
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const user = await requireAuth(context.repos, request);
  const { tripId, memoryId } = params;

  const trip = await context.repos.trips.findByIdForUser(tripId, user.id);
  if (!trip) throw new Response("Trip not found", { status: 404 });

  const existing = await context.repos.memories.findByIdForTrip(
    memoryId,
    tripId
  );
  if (!existing) throw new Response("Memory not found", { status: 404 });

  const formData = await request.formData();

  if (!formData.get("rating")) formData.delete("rating");
  if (!formData.get("latitude")) formData.delete("latitude");
  if (!formData.get("longitude")) formData.delete("longitude");
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
    await context.repos.memories.update(memoryId, {
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

    return redirect(`/trips/${tripId}/memories/${memoryId}`);
  } catch {
    return data(
      {
        submission: submission.reply(),
        error: "Failed to update memory. Please try again.",
      },
      { status: 500 }
    );
  }
}

export default function MemoryEdit({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { trip, memory } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const dateValue =
    memory.date instanceof Date
      ? memory.date.toISOString().split("T")[0]
      : new Date(memory.date).toISOString().split("T")[0];

  const [form, fields] = useForm({
    lastResult: actionData?.submission,
    onValidate({ formData }) {
      if (!formData.get("rating")) formData.delete("rating");
      if (!formData.get("latitude")) formData.delete("latitude");
      if (!formData.get("longitude")) formData.delete("longitude");
      if (!formData.get("locationName")) formData.delete("locationName");
      if (!formData.get("locationAddress")) formData.delete("locationAddress");
      return parseWithZod(formData, { schema: memorySchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    defaultValue: {
      title: memory.title,
      content: memory.content,
      date: dateValue,
      category: memory.category,
      rating: memory.rating ? String(memory.rating) : undefined,
      locationName: memory.locationName ?? undefined,
      locationAddress: memory.locationAddress ?? undefined,
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to={`/trips/${trip.id}/memories/${memory.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to memory
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Memory</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Memory Details</CardTitle>
          <CardDescription>Update your memory details below.</CardDescription>
        </CardHeader>
        <CardContent>
          {actionData?.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{actionData.error}</AlertDescription>
            </Alert>
          )}

          <Form method="post" id={form.id} onSubmit={form.onSubmit}>
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor={fields.title.id}>
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={fields.title.id}
                  name={fields.title.name}
                  defaultValue={fields.title.initialValue}
                  aria-invalid={!fields.title.valid || undefined}
                  aria-describedby={
                    !fields.title.valid ? fields.title.errorId : undefined
                  }
                />
                {fields.title.errors && (
                  <p
                    id={fields.title.errorId}
                    className="text-destructive text-sm"
                  >
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
                  rows={8}
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
                    >
                      <SelectValue />
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
                  defaultValue={
                    fields.rating.initialValue as string | undefined
                  }
                >
                  <SelectTrigger id={fields.rating.id} className="w-full">
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

              {/* Location Address */}
              <div className="space-y-2">
                <Label htmlFor={fields.locationAddress.id}>
                  Address (optional)
                </Label>
                <Input
                  id={fields.locationAddress.id}
                  name={fields.locationAddress.name}
                  placeholder="e.g., 290 Bremner Blvd, Toronto, ON"
                  defaultValue={fields.locationAddress.initialValue}
                  aria-invalid={!fields.locationAddress.valid || undefined}
                />
                {fields.locationAddress.errors && (
                  <p
                    id={fields.locationAddress.errorId}
                    className="text-destructive text-sm"
                  >
                    {fields.locationAddress.errors}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to={`/trips/${trip.id}/memories/${memory.id}`}>
                    Cancel
                  </Link>
                </Button>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
