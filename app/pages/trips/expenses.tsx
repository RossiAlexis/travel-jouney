import {
  Form,
  Link,
  useFetcher,
  useNavigation,
  data,
  redirect,
} from "react-router";
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
import type { Route } from "./+types/expenses";
import { parseWithZod } from "@conform-to/zod/v4";
import { useForm } from "@conform-to/react";
import { expenseSchema } from "~/lib/validations";
import { requireAuth } from "~/lib/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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
import { Separator } from "~/components/ui/separator";
import { ArrowLeft, AlertCircle, Trash2, Receipt, Plus } from "lucide-react";
import type { ExpenseCategory } from "~/types";
import type { Expense } from "~/lib/schemas";
import {
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_CATEGORY_INFO,
} from "~/lib/constants";

const CATEGORY_OPTIONS = EXPENSE_CATEGORY_OPTIONS;

const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "MXN",
  "BRL",
  "CHF",
  "CNY",
];

const categoryInfo = EXPENSE_CATEGORY_INFO;

export function meta({ data: loaderData }: Route.MetaArgs) {
  return [
    {
      title: `Expenses — ${loaderData?.trip?.title ?? "Trip"} - Travel Journal`,
    },
  ];
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const user = await requireAuth(context.repos, request);
  const { tripId } = params;

  const trip = await context.repos.trips.findByIdForUser(tripId, user.id);
  if (!trip) throw new Response("Trip not found", { status: 404 });

  const expenses = await context.repos.expenses.findByTrip(tripId);
  const total = await context.repos.expenses.sumByTrip(tripId);

  return data({ trip, expenses, total });
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const user = await requireAuth(context.repos, request);
  const { tripId } = params;

  const trip = await context.repos.trips.findByIdForUser(tripId, user.id);
  if (!trip) throw new Response("Trip not found", { status: 404 });

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    if (!formData.get("amount")) formData.delete("amount");
    if (!formData.get("memoryId")) formData.delete("memoryId");

    const submission = parseWithZod(formData, { schema: expenseSchema });

    if (submission.status !== "success") {
      return data(
        { submission: submission.reply(), error: null },
        { status: 400 }
      );
    }

    await context.repos.expenses.create({
      tripId,
      userId: user.id,
      amount: submission.value.amount,
      currency: submission.value.currency,
      category: submission.value.category,
      description: submission.value.description,
      date: new Date(submission.value.date),
    });

    return redirect(new URL(request.url).pathname);
  }

  if (intent === "delete") {
    const expenseId = formData.get("expenseId") as string;
    await context.repos.expenses.deleteById(expenseId, user.id);
    return data({ deleted: true });
  }

  return data(
    { submission: undefined, error: "Invalid action" },
    { status: 400 }
  );
}

function ExpenseDeleteButton({ expenseId }: { expenseId: string }) {
  const fetcher = useFetcher();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={fetcher.state !== "idle"}
          className="text-muted-foreground hover:text-destructive h-8 w-8"
          aria-label="Delete expense"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Expense</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this expense? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <fetcher.Form method="post">
            <input type="hidden" name="intent" value="delete" />
            <input type="hidden" name="expenseId" value={expenseId} />
            <AlertDialogAction
              type="submit"
              disabled={fetcher.state !== "idle"}
              variant="destructive"
            >
              Delete
            </AlertDialogAction>
          </fetcher.Form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CategoryTotals({
  expenses,
  tripCurrency,
}: {
  expenses: Expense[];
  tripCurrency: string;
}) {
  const totals = expenses.reduce<Partial<Record<ExpenseCategory, number>>>(
    (acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    },
    {}
  );

  const entries = Object.entries(totals) as [ExpenseCategory, number][];
  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {entries
        .sort((a, b) => b[1] - a[1])
        .map(([cat, total]) => (
          <div
            key={cat}
            className="bg-card flex items-center gap-2 rounded-lg border p-3"
          >
            <span className="text-xl">{categoryInfo[cat].icon}</span>
            <div className="min-w-0">
              <p className="text-muted-foreground truncate text-xs">
                {categoryInfo[cat].label}
              </p>
              <p className="text-sm font-semibold">
                {formatCurrency(total, tripCurrency)}
              </p>
            </div>
          </div>
        ))}
    </div>
  );
}

export default function Expenses({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { trip, expenses, total } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const today = new Date().toISOString().split("T")[0];

  const submission =
    actionData && "submission" in actionData
      ? actionData.submission
      : undefined;

  const formError =
    actionData && "error" in actionData ? actionData.error : null;

  const [form, fields] = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastResult: submission as any,
    onValidate({ formData }) {
      if (!formData.get("amount")) formData.delete("amount");
      if (!formData.get("memoryId")) formData.delete("memoryId");
      return parseWithZod(formData, { schema: expenseSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    defaultValue: {
      currency: trip.currency,
      date: today,
      category: "OTHER",
    },
  });

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/trips/${trip.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {trip.title}
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground mt-1">
            {trip.title} · {expenses.length}{" "}
            {expenses.length === 1 ? "expense" : "expenses"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-sm">Total spent</p>
          <p className="text-2xl font-bold">
            {formatCurrency(total, trip.currency)}
          </p>
          {trip.budget && (
            <p
              className={`text-sm ${total > trip.budget ? "text-destructive" : "text-muted-foreground"}`}
            >
              of {formatCurrency(trip.budget, trip.currency)} budget
            </p>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      {expenses.length > 0 && (
        <CategoryTotals expenses={expenses} tripCurrency={trip.currency} />
      )}

      {/* Add expense form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Expense
          </CardTitle>
          <CardDescription>Record a new expense for this trip.</CardDescription>
        </CardHeader>
        <CardContent>
          {formError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <Form method="post" id={form.id} onSubmit={form.onSubmit}>
            <input type="hidden" name="intent" value="create" />
            <div className="space-y-4">
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor={fields.description.id}>
                  Description <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={fields.description.id}
                  name={fields.description.name}
                  placeholder="e.g., Dinner at local restaurant"
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

              {/* Amount, Currency, Category */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor={fields.amount.id}>
                    Amount <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={fields.amount.id}
                    name={fields.amount.name}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    defaultValue={
                      fields.amount.initialValue as string | undefined
                    }
                    aria-invalid={!fields.amount.valid || undefined}
                    aria-describedby={
                      !fields.amount.valid ? fields.amount.errorId : undefined
                    }
                  />
                  {fields.amount.errors && (
                    <p
                      id={fields.amount.errorId}
                      className="text-destructive text-sm"
                    >
                      {fields.amount.errors}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={fields.currency.id}>Currency</Label>
                  <Select
                    name={fields.currency.name}
                    defaultValue={fields.currency.initialValue || trip.currency}
                  >
                    <SelectTrigger id={fields.currency.id} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={fields.category.id}>Category</Label>
                  <Select
                    name={fields.category.name}
                    defaultValue={fields.category.initialValue || "OTHER"}
                  >
                    <SelectTrigger id={fields.category.id} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor={fields.date.id}>
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={fields.date.id}
                  name={fields.date.name}
                  type="date"
                  defaultValue={fields.date.initialValue}
                  className="w-full sm:w-48"
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

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Expense list */}
      {expenses.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <Receipt className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h2 className="mb-2 text-xl font-semibold">No expenses yet</h2>
            <p className="text-muted-foreground">
              Add your first expense using the form above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {expenses.map((expense: Expense, i: number) => (
              <div key={expense.id}>
                {i > 0 && <Separator />}
                <div className="flex items-center gap-4 px-6 py-4">
                  <span className="text-2xl" aria-hidden>
                    {categoryInfo[expense.category].icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {expense.description}
                    </p>
                    <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-sm">
                      <span>{formatDate(expense.date)}</span>
                      <Badge variant="outline" className="text-xs">
                        {categoryInfo[expense.category].label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(expense.amount, expense.currency)}
                    </span>
                    <ExpenseDeleteButton expenseId={expense.id} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
