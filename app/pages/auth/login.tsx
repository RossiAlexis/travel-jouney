import { Link, Form, useActionData, useNavigation } from "react-router";
import { data, redirect } from "react-router";
import type { Route } from "./+types/login";
import { parseWithZod } from "@conform-to/zod/v4";
import { useForm } from "@conform-to/react";
import { loginSchema } from "~/lib/validations";
import {
  loginWithPassword,
  createUserSession,
  getUser,
} from "~/lib/auth.server";
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
    { title: "Login - Travel Journal" },
    { name: "description", content: "Log in to your Travel Journal account" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Redirect to dashboard if already logged in
  const user = await getUser(request);
  if (user) {
    throw redirect("/dashboard");
  }
  return data({});
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: loginSchema });

  if (submission.status !== "success") {
    return data(
      { submission: submission.reply(), error: null },
      { status: 400 }
    );
  }

  const result = await loginWithPassword(submission.value);

  if ("error" in result) {
    return data(
      { submission: submission.reply(), error: result.error },
      { status: 400 }
    );
  }

  return createUserSession(result.user.id, "/dashboard");
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    lastResult: actionData?.submission,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: loginSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <div className="from-background to-muted flex min-h-screen items-center justify-center bg-gradient-to-b px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <Link to="/" className="mb-4 flex justify-center">
            <MapPin className="text-primary h-10 w-10" />
          </Link>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access your journal
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={fields.password.id}>Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-primary text-sm hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id={fields.password.id}
                  name={fields.password.name}
                  type="password"
                  autoComplete="current-password"
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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </Form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card text-muted-foreground px-2">
                Or continue with
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full" asChild>
            <Link to="/auth/google">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Link>
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-muted-foreground text-sm">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
