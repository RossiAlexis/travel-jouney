import { Form, Link, useNavigation, useFetcher, data, redirect } from "react-router";
import type { Route } from "./+types/destination-edit";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { ArrowLeft, AlertCircle, Trash2 } from "lucide-react";
import { useState } from "react";

export function meta({ data: loaderData }: Route.MetaArgs) {
  if (!loaderData?.destination) {
    return [{ title: "Edit Destination - Travel Journal" }];
  }
  return [
    { title: `Edit ${loaderData.destination.name} - Travel Journal` },
    { name: "description", content: "Edit destination details" },
  ];
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const user = await requireAuth(context.repos, request);
  const { tripId, destinationId } = params;

  const trip = await context.repos.trips.findByIdForUser(tripId, user.id);
  if (!trip) {
    throw new Response("Trip not found", { status: 404 });
  }

  const destination = await context.repos.destinations.findByIdForTrip(
    destinationId,
    tripId,
  );
  if (!destination) {
    throw new Response("Destination not found", { status: 404 });
  }

  return data({ trip, destination });
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const user = await requireAuth(context.repos, request);
  const { tripId, destinationId } = params;

  // Verify ownership
  const trip = await context.repos.trips.findByIdForUser(tripId, user.id);
  if (!trip) {
    throw new Response("Trip not found", { status: 404 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    await context.repos.destinations.delete(destinationId, tripId);
    return redirect(`/trips/${tripId}`);
  }

  // Clean optional numeric fields
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
    await context.repos.destinations.update(destinationId, tripId, {
      name: submission.value.name,
      description: submission.value.description ?? null,
      startDate: submission.value.startDate ?? null,
      endDate: submission.value.endDate ?? null,
      latitude: submission.value.latitude ?? null,
      longitude: submission.value.longitude ?? null,
    });

    return redirect(`/trips/${tripId}/destinations/${destinationId}`);
  } catch (error) {
    console.error("Error updating destination:", error);
    return data(
      {
        submission: submission.reply(),
        error: "Failed to update destination. Please try again.",
      },
      { status: 500 },
    );
  }
}

const formatDateForInput = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  // startDate/endDate on Destination are stored as plain date strings (YYYY-MM-DD)
  // or ISO strings — normalise to YYYY-MM-DD for the input
  return dateStr.length === 10 ? dateStr : dateStr.split("T")[0];
};

export default function DestinationEdit({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { trip, destination } = loaderData;
  const deleteFetcher = useFetcher();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [form, fields] = useForm({
    lastResult: actionData?.submission,
    onValidate({ formData }) {
      if (!formData.get("latitude")) formData.delete("latitude");
      if (!formData.get("longitude")) formData.delete("longitude");
      return parseWithZod(formData, { schema: destinationSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    defaultValue: {
      name: destination.name,
      description: destination.description ?? "",
      startDate: formatDateForInput(destination.startDate),
      endDate: formatDateForInput(destination.endDate),
      locationName: "",
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to={`/trips/${trip.id}/destinations/${destination.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {destination.name}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Destination</h1>
        <p className="text-muted-foreground mt-1">
          Update the details for this destination
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Destination Details</CardTitle>
          <CardDescription>
            Make changes to your destination information below.
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
                      !fields.endDate.valid
                        ? fields.endDate.errorId
                        : undefined
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

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to={`/trips/${trip.id}/destinations/${destination.id}`}>
                    Cancel
                  </Link>
                </Button>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="mt-6 border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Deleting a destination will also delete all memories associated with
            it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Destination
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Destination</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{destination.name}"? All
                  memories in this destination will be permanently deleted. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <deleteFetcher.Form method="post">
                  <input type="hidden" name="intent" value="delete" />
                  <AlertDialogAction
                    type="submit"
                    variant="destructive"
                    disabled={deleteFetcher.state === "submitting"}
                  >
                    {deleteFetcher.state === "submitting"
                      ? "Deleting..."
                      : "Delete Destination"}
                  </AlertDialogAction>
                </deleteFetcher.Form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
