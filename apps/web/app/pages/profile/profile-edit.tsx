import { Form, Link, useNavigation, data, redirect } from "react-router";
import type { Route } from "./+types/profile-edit";
import { parseWithZod } from "@conform-to/zod/v4";
import { useForm } from "@conform-to/react";
import { profileSchema } from "~/lib/validations";
import { requireAuth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
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

export function meta() {
  return [
    { title: "Edit Profile — Bitácora de Viaje" },
    { name: "description", content: "Edit your profile settings" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      bio: true,
    },
  });

  if (!profile) {
    throw new Response("User not found", { status: 404 });
  }

  return data({ profile });
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();

  if (!formData.get("bio")) formData.delete("bio");

  const submission = parseWithZod(formData, { schema: profileSchema });

  if (submission.status !== "success") {
    return data(
      { submission: submission.reply(), error: null },
      { status: 400 }
    );
  }

  try {
    await db.user.update({
      where: { id: user.id },
      data: {
        displayName: submission.value.displayName,
        bio: submission.value.bio ?? null,
      },
    });

    return redirect("/profile");
  } catch (error) {
    console.error("Error updating profile:", error);
    return data(
      {
        submission: submission.reply(),
        error: "Failed to update profile. Please try again.",
      },
      { status: 500 }
    );
  }
}

export default function ProfileEdit({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { profile } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    lastResult: actionData?.submission,
    onValidate({ formData }) {
      if (!formData.get("bio")) formData.delete("bio");
      return parseWithZod(formData, { schema: profileSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    defaultValue: {
      displayName: profile.displayName,
      bio: profile.bio ?? "",
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/profile">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <p className="text-muted-foreground mt-1">
          Update your profile information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Update how you appear to others on the platform.
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
              {/* Read-only info */}
              <div className="space-y-4 rounded-lg border p-4">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Username
                  </p>
                  <p className="font-medium">@{profile.username}</p>
                  <p className="text-muted-foreground text-xs">
                    Username cannot be changed
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Email
                  </p>
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor={fields.displayName.id}>
                  Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={fields.displayName.id}
                  name={fields.displayName.name}
                  placeholder="Your display name"
                  defaultValue={fields.displayName.initialValue}
                  aria-invalid={!fields.displayName.valid || undefined}
                  aria-describedby={
                    !fields.displayName.valid
                      ? fields.displayName.errorId
                      : undefined
                  }
                />
                {fields.displayName.errors && (
                  <p
                    id={fields.displayName.errorId}
                    className="text-destructive text-sm"
                  >
                    {fields.displayName.errors}
                  </p>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor={fields.bio.id}>Bio (optional)</Label>
                <Textarea
                  id={fields.bio.id}
                  name={fields.bio.name}
                  placeholder="Tell people a bit about yourself and your travels..."
                  rows={4}
                  defaultValue={fields.bio.initialValue}
                  aria-invalid={!fields.bio.valid || undefined}
                  aria-describedby={
                    !fields.bio.valid ? fields.bio.errorId : undefined
                  }
                />
                {fields.bio.errors && (
                  <p id={fields.bio.errorId} className="text-destructive text-sm">
                    {fields.bio.errors}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">Max 500 characters</p>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/profile">Cancel</Link>
                </Button>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
