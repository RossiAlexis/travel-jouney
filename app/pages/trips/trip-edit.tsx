import { Form, Link, useNavigation, data, redirect } from "react-router";
import type { Route } from "./+types/trip-edit";
import { parseWithZod } from "@conform-to/zod/v4";
import { useForm } from "@conform-to/react";
import { tripSchemaWithDates } from "~/lib/validations";
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

export function meta({ data }: Route.MetaArgs) {
  if (!data?.trip) {
    return [
      { title: "Edit Trip - Travel Journal" },
      { name: "description", content: "Edit your trip" },
    ];
  }
  return [
    { title: `Edit ${data.trip.title} - Travel Journal` },
    { name: "description", content: "Edit your trip details" },
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
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: tripSchemaWithDates });

  if (submission.status !== "success") {
    return data(
      { submission: submission.reply(), error: null },
      { status: 400 }
    );
  }

  // Verify ownership
  const existingTrip = await context.repos.trips.findByIdForUser(tripId, user.id);

  if (!existingTrip) {
    throw new Response("Trip not found", { status: 404 });
  }

  try {
    await context.repos.trips.updateForUser(tripId, user.id, {
      title: submission.value.title,
      description: submission.value.description || null,
      startDate: new Date(submission.value.startDate),
      endDate: submission.value.endDate
        ? new Date(submission.value.endDate)
        : null,
      status: submission.value.status,
      budget: submission.value.budget || null,
      currency: submission.value.currency || "USD",
    });

    return redirect(`/trips/${tripId}`);
  } catch (error) {
    console.error("Error updating trip:", error);
    return data(
      {
        submission: submission.reply(),
        error: "Failed to update trip. Please try again.",
      },
      { status: 500 }
    );
  }
}

const STATUS_OPTIONS = [
  { value: "PLANNED", label: "Planned" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "CNY", label: "CNY - Chinese Yuan" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "MXN", label: "MXN - Mexican Peso" },
  { value: "BRL", label: "BRL - Brazilian Real" },
  { value: "KRW", label: "KRW - South Korean Won" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "THB", label: "THB - Thai Baht" },
  { value: "NZD", label: "NZD - New Zealand Dollar" },
];

const formatDateForInput = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
};

export default function TripEdit({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { trip } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    lastResult: actionData?.submission,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: tripSchemaWithDates });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    defaultValue: {
      title: trip.title,
      description: trip.description || "",
      startDate: formatDateForInput(trip.startDate),
      endDate: trip.endDate ? formatDateForInput(trip.endDate) : "",
      status: trip.status,
      budget: trip.budget?.toString() || "",
      currency: trip.currency,
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to={`/trips/${trip.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trip
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Trip</h1>
        <p className="text-muted-foreground mt-1">
          Update your trip details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trip Details</CardTitle>
          <CardDescription>
            Make changes to your trip information below.
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
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor={fields.title.id}>
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={fields.title.id}
                  name={fields.title.name}
                  placeholder="e.g., Southeast Asia Adventure 2026"
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

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor={fields.description.id}>Description</Label>
                <Textarea
                  id={fields.description.id}
                  name={fields.description.name}
                  placeholder="Describe your trip plans, goals, or what you're looking forward to..."
                  rows={4}
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
                  <Label htmlFor={fields.startDate.id}>
                    Start Date <span className="text-destructive">*</span>
                  </Label>
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
                  <p className="text-muted-foreground text-xs">
                    Leave blank for open-ended trips
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor={fields.status.id}>
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  name={fields.status.name}
                  defaultValue={fields.status.initialValue}
                >
                  <SelectTrigger
                    id={fields.status.id}
                    className="w-full"
                    aria-invalid={!fields.status.valid || undefined}
                    aria-describedby={
                      !fields.status.valid ? fields.status.errorId : undefined
                    }
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fields.status.errors && (
                  <p
                    id={fields.status.errorId}
                    className="text-destructive text-sm"
                  >
                    {fields.status.errors}
                  </p>
                )}
              </div>

              {/* Budget */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={fields.budget.id}>Budget</Label>
                  <Input
                    id={fields.budget.id}
                    name={fields.budget.name}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue={fields.budget.initialValue as string}
                    aria-invalid={!fields.budget.valid || undefined}
                    aria-describedby={
                      !fields.budget.valid ? fields.budget.errorId : undefined
                    }
                  />
                  {fields.budget.errors && (
                    <p
                      id={fields.budget.errorId}
                      className="text-destructive text-sm"
                    >
                      {fields.budget.errors}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={fields.currency.id}>Currency</Label>
                  <Select
                    name={fields.currency.name}
                    defaultValue={fields.currency.initialValue}
                  >
                    <SelectTrigger
                      id={fields.currency.id}
                      className="w-full"
                      aria-invalid={!fields.currency.valid || undefined}
                      aria-describedby={
                        !fields.currency.valid
                          ? fields.currency.errorId
                          : undefined
                      }
                    >
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fields.currency.errors && (
                    <p
                      id={fields.currency.errorId}
                      className="text-destructive text-sm"
                    >
                      {fields.currency.errors}
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
