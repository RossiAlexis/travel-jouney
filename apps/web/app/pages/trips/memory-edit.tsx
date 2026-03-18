import { Form, Link, useNavigation, data, redirect } from "react-router";
import type { Route } from "./+types/memory-edit";
import { parseWithZod } from "@conform-to/zod/v4";
import { useForm } from "@conform-to/react";
import { memorySchema } from "~/lib/validations";
import { requireAuth } from "~/lib/auth.server";
import { getMemoryById, updateMemory, getTripById } from "@repo/services";
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
  if (!data?.memory) {
    return [{ title: "Edit Memory — Bitácora de Viaje" }];
  }
  return [
    { title: `Edit ${data.memory.title} — Bitácora de Viaje` },
    { name: "description", content: "Edit your travel memory" },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const { tripId, memoryId } = params;

  const memory = await getMemoryById(memoryId, tripId, user.id);

  if (!memory) {
    throw new Response("Memory not found", { status: 404 });
  }

  const trip = await getTripById(tripId, user.id);

  if (!trip) {
    throw new Response("Trip not found", { status: 404 });
  }

  return data({ memory, trip });
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const { tripId, memoryId } = params;
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
    await updateMemory(memoryId, user.id, {
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

    return redirect(`/trips/${tripId}/memories/${memoryId}`);
  } catch (error) {
    console.error("Error updating memory:", error);
    return data(
      {
        submission: submission.reply(),
        error: "Failed to update memory. Please try again.",
      },
      { status: 500 }
    );
  }
}

const CATEGORY_OPTIONS = [
  { value: "ACCOMMODATION", label: "🏨 Accommodation" },
  { value: "FOOD", label: "🍽️ Food & Dining" },
  { value: "ACTIVITY", label: "🎯 Activity" },
  { value: "TRANSPORT", label: "🚗 Transport" },
  { value: "REFLECTION", label: "💭 Reflection" },
  { value: "OTHER", label: "📝 Other" },
];

const RATING_OPTIONS = [
  { value: "1", label: "★ 1 - Poor" },
  { value: "2", label: "★★ 2 - Fair" },
  { value: "3", label: "★★★ 3 - Good" },
  { value: "4", label: "★★★★ 4 - Very Good" },
  { value: "5", label: "★★★★★ 5 - Excellent" },
];

const formatDateForInput = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
};

export default function MemoryEdit({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { memory, trip } = loaderData;
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
      title: memory.title,
      content: memory.content,
      date: formatDateForInput(memory.date),
      category: memory.category,
      rating: memory.rating?.toString() ?? "",
      locationName: memory.locationName ?? "",
      locationAddress: memory.locationAddress ?? "",
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to={`/trips/${trip.id}/memories/${memory.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Memory
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Memory</h1>
        <p className="text-muted-foreground mt-1">Update your travel memory</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Memory Details</CardTitle>
          <CardDescription>Make changes to your travel memory.</CardDescription>
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

              <div className="space-y-2">
                <Label htmlFor={fields.content.id}>
                  Content <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id={fields.content.id}
                  name={fields.content.name}
                  placeholder="Write about your experience..."
                  rows={8}
                  defaultValue={fields.content.initialValue}
                  aria-invalid={!fields.content.valid || undefined}
                  aria-describedby={
                    !fields.content.valid ? fields.content.errorId : undefined
                  }
                />
                {fields.content.errors && (
                  <p id={fields.content.errorId} className="text-destructive text-sm">
                    {fields.content.errors}
                  </p>
                )}
              </div>

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
                  />
                  {fields.date.errors && (
                    <p id={fields.date.errorId} className="text-destructive text-sm">
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
                    defaultValue={fields.category.initialValue}
                  >
                    <SelectTrigger id={fields.category.id} className="w-full">
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
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={fields.rating.id}>Rating (optional)</Label>
                <Select
                  name={fields.rating.name}
                  defaultValue={(fields.rating.initialValue as string) || ""}
                >
                  <SelectTrigger id={fields.rating.id} className="w-full">
                    <SelectValue placeholder="Rate your experience (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {RATING_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={fields.locationName.id}>
                  Location (optional)
                </Label>
                <Input
                  id={fields.locationName.id}
                  name={fields.locationName.name}
                  placeholder="e.g., Shinjuku, Tokyo"
                  defaultValue={fields.locationName.initialValue}
                />
              </div>

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
