import { Link, Form, useNavigation } from "react-router";
import { data } from "react-router";
import type { Route } from "./+types/forgot-password";
import { parseWithZod } from "@conform-to/zod/v4";
import { useForm } from "@conform-to/react";
import { forgotPasswordSchema } from "~/lib/validations";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { MapPin, CheckCircle } from "lucide-react";

export function meta() {
  return [
    { title: "Forgot Password - Travel Journal" },
    { name: "description", content: "Reset your Travel Journal password" },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: forgotPasswordSchema });

  if (submission.status !== "success") {
    return data(
      { submission: submission.reply(), success: false },
      { status: 400 }
    );
  }

  // TODO: Implement password reset email sending
  // For now, we'll just simulate success
  // In production, generate token, store in DB, and send email

  return data({ submission: submission.reply(), success: true });
}

export default function ForgotPassword({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    lastResult: actionData?.submission,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: forgotPasswordSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <main className="from-background to-muted flex min-h-screen items-center justify-center bg-gradient-to-b px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <Link
            to="/"
            className="mb-4 flex justify-center"
            aria-label="Go to home"
          >
            <MapPin className="text-primary h-10 w-10" />
          </Link>
          <h1 className="text-2xl font-medium">Forgot password?</h1>
          <CardDescription>
            Enter your email and we&apos;ll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actionData?.success ? (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                If an account exists with that email, we&apos;ve sent you a
                password reset link. Check your inbox!
              </AlertDescription>
            </Alert>
          ) : (
            <Form method="post" id={form.id} onSubmit={form.onSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={fields.email.id}>Email</Label>
                  <Input
                    id={fields.email.id}
                    name={fields.email.name}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    defaultValue={fields.email.initialValue}
                    aria-invalid={!fields.email.valid || undefined}
                    aria-describedby={
                      !fields.email.valid ? fields.email.errorId : undefined
                    }
                  />
                  {fields.email.errors && (
                    <p
                      id={fields.email.errorId}
                      className="text-destructive text-sm"
                    >
                      {fields.email.errors}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </Button>
              </div>
            </Form>
          )}
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
