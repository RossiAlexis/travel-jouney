import { Form, Link, useNavigation, data, redirect } from "react-router";
import type { Route } from "./+types/destination-new";
import { parseWithZod } from "@conform-to/zod/v4";
import { useForm } from "@conform-to/react";
import { destinationSchema } from "~/lib/validations";
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
import { Alert, AlertDescription } from "~/components/ui/alert";
import { ArrowLeft, AlertCircle } from "lucide-react";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: "Add Destination - Travel Journal" },
    { name: "description", content: "Add a destination to your trip" },
  ];
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const user = await requireAuth(context.repos, request);
  const { tripId } = params;

  const trip = await context.repos.trips.findByIdForUser(tripId, user.id);
  if (!trip) {
    throw new Response("Trip not found", { status: 404 });
  }

  return data({ trip });
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const user = await requireAuth(context.repos, request);
  const { tripId } = params;

  // Verify ownership
  const trip = await context.repos.trips.findByIdForUser(tripId, user.id);
  if (!trip) {
    throw new Response("Trip not found", { status: 404 });
  }

  const formData = await request.formData();

  // Clean optional numeric fields to avoid coerce issues with empty strings
  if (!formData.get("latitude")) formData.delete("latitude");
  if (!formData.get("longitude")) formData.delete("longitude");

  const submission = parseWithZod(formData, { schema: destinationSchema });

  if (submission.status !== "success") {
    return data(
      { submission: submission.reply(), error: null },
      { status: 400 },
    );
  }

  try {
    const destination = await context.repos.destinations.create({
      tripId,
      name: submission.value.name,
      description: submission.value.description ?? null,
      startDate: submission.value.startDate ?? null,
      endDate: submission.value.endDate ?? null,
      latitude: submission.value.latitude ?? null,
      longitude: submission.value.longitude ?? null,
    });

    return redirect(`/trips/${tripId}/destinations/${destination.id}`);
  } catch (error) {
    console.error("Error creating destination:", error);
    return data(
      {
        submission: submission.reply(),
        error: "Failed to create destination. Please try again.",
      },
      { status: 500 },
    );
  }
}

export default function DestinationNew({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { trip } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    lastResult: actionData?.submission,
    onValidate({ formData }) {
      if (!formData.get("latitude")) formData.delete("latitude");
      if (!formData.get("longitude")) formData.delete("longitude");
      return parseWithZod(formData, { schema: destinationSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to={`/trips/${trip.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {trip.title}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Add Destination</h1>
        <p className="text-muted-foreground mt-1">
          Add a new destination to your trip
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Destination Details</CardTitle>
          <CardDescription>
            Enter the details for this destination. You can add memories once
            it's created.
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
            <div className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor={fields.name.id}>
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={fields.name.id}
                  name={fields.name.name}
                  placeholder="e.g., Toronto"
                  defaultValue={fields.name.initialValue}
                  aria-invalid={!fields.name.valid || undefined}
                  aria-describedby={
                    !fields.name.valid ? fields.name.errorId : undefined
                  }
                />
                {fields.name.errors && (
                  <p id={fields.name.errorId} className="text-destructive text-sm">
                    {fields.name.errors}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor={fields.description.id}>Description</Label>
                <Textarea
                  id={fields.description.id}
                  name={fields.description.name}
                  placeholder="What are you looking forward to in this destination?"
                  rows={3}
                  defaultValue={fields.description.initialValue}
                  aria-invalid={!fields.description.valid || undefined}
                  aria-describedby={
                    !fields.description.valid
                      ? fields.description.errorId
                      : undefined
                  }
                />
                {fields.description.errors && (
                  <p
                    id={fields.description.errorId}
                    className="text-destructive text-sm"
                  >
                    {fields.description.errors}
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={fields.startDate.id}>Start Date</Label>
                  <Input
                    id={fields.startDate.id}
                    name={fields.startDate.name}
                    type="date"
                    defaultValue={fields.startDate.initialValue}
                    aria-invalid={!fields.startDate.valid || undefined}
                    aria-describedby={
                      !fields.startDate.valid
                        ? fields.startDate.errorId
                        : undefined
                    }
                  />
                  {fields.startDate.errors && (
                    <p
                      id={fields.startDate.errorId}
                      className="text-destructive text-sm"
                    >
                      {fields.startDate.errors}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={fields.endDate.id}>End Date</Label>
                  <Input
                    id={fields.endDate.id}
                    name={fields.endDate.name}
                    type="date"
                    defaultValue={fields.endDate.initialValue}
                    aria-invalid={!fields.endDate.valid || undefined}
                    aria-describedby={
                      !fields.endDate.valid ? fields.endDate.errorId : undefined
                    }
                  />
                  {fields.endDate.errors && (
                    <p
                      id={fields.endDate.errorId}
                      className="text-destructive text-sm"
                    >
                      {fields.endDate.errors}
                    </p>
                  )}
                </div>
              </div>

              {/* Location Name */}
              <div className="space-y-2">
                <Label htmlFor={fields.locationName.id}>Location</Label>
                <Input
                  id={fields.locationName.id}
                  name={fields.locationName.name}
                  placeholder="e.g., Toronto, Ontario, Canada"
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
                  {isSubmitting ? "Creating..." : "Create Destination"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to={`/trips/${trip.id}`}>Cancel</Link>
                </Button>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
