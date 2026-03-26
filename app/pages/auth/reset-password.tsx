import { Link, Form, useActionData, useNavigation } from "react-router";
import { data, redirect } from "react-router";
import type { Route } from "./+types/reset-password";
import { parseWithZod } from "@conform-to/zod/v4";
import { useForm } from "@conform-to/react";
import { resetPasswordSchema } from "~/lib/validations";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { MapPin, AlertCircle } from "lucide-react";

export function meta() {
  return [
    { title: "Reset Password - Travel Journal" },
    {
      name: "description",
      content: "Set a new password for your Travel Journal account",
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const { token } = params;

  // TODO: Validate token exists and is not expired
  // For now, we'll just check if token exists
  if (!token) {
    throw redirect("/forgot-password");
  }

  return data({ token });
}

export async function action({ request, params }: Route.ActionArgs) {
  const { token } = params;
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: resetPasswordSchema });

  if (submission.status !== "success") {
    return data(
      { submission: submission.reply(), error: null },
      { status: 400 }
    );
  }

  // TODO: Implement password reset
  // 1. Validate token
  // 2. Find user by token
  // 3. Update password
  // 4. Delete token
  // 5. Redirect to login

  // For now, simulate success
  if (!token) {
    return data(
      { submission: submission.reply(), error: "Invalid or expired token" },
      { status: 400 }
    );
  }

  throw redirect("/login?reset=success");
}

export default function ResetPassword() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    lastResult: actionData?.submission,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: resetPasswordSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <main className="from-background to-muted flex min-h-screen items-center justify-center bg-gradient-to-b px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <Link to="/" className="mb-4 flex justify-center" aria-label="Go to home">
            <MapPin className="text-primary h-10 w-10" />
          </Link>
          <h1 className="text-2xl font-medium">Reset password</h1>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          {actionData?.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{actionData.error}</AlertDescription>
            </Alert>
          )}

          <Form method="post" id={form.id} onSubmit={form.onSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={fields.password.id}>New Password</Label>
                <Input
                  id={fields.password.id}
                  name={fields.password.name}
                  type="password"
                  autoComplete="new-password"
                  defaultValue={fields.password.initialValue}
                  aria-invalid={!fields.password.valid || undefined}
                  aria-describedby={
                    !fields.password.valid ? fields.password.errorId : undefined
                  }
                />
                {fields.password.errors && (
                  <p
                    id={fields.password.errorId}
                    className="text-destructive text-sm"
                  >
                    {fields.password.errors}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={fields.confirmPassword.id}>
                  Confirm New Password
                </Label>
                <Input
                  id={fields.confirmPassword.id}
                  name={fields.confirmPassword.name}
                  type="password"
                  autoComplete="new-password"
                  defaultValue={fields.confirmPassword.initialValue}
                  aria-invalid={!fields.confirmPassword.valid || undefined}
                  aria-describedby={
                    !fields.confirmPassword.valid
                      ? fields.confirmPassword.errorId
                      : undefined
                  }
                />
                {fields.confirmPassword.errors && (
                  <p
                    id={fields.confirmPassword.errorId}
                    className="text-destructive text-sm"
                  >
                    {fields.confirmPassword.errors}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Resetting..." : "Reset password"}
              </Button>
            </div>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-muted-foreground text-sm">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-primary underline underline-offset-4 hover:no-underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
