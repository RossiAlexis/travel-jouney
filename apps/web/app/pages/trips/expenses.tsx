import { useState } from "react";
import { Form, Link, useFetcher, useNavigation, data, redirect } from "react-router";
import type { Route } from "./+types/expenses";
import { parseWithZod } from "@conform-to/zod/v4";
import { useForm } from "@conform-to/react";
import { expenseSchema } from "~/lib/validations";
import { requireAuth } from "~/lib/auth.server";
import { getTripById, listExpenses, createExpense, deleteExpense } from "@repo/services";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
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
import { Separator } from "~/components/ui/separator";
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  DollarSign,
  Receipt,
} from "lucide-react";
import type { ExpenseCategory } from "~/types";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.trip) {
    return [{ title: "Expenses — Bitácora de Viaje" }];
  }
  return [
    { title: `Expenses - ${data.trip.title} — Bitácora de Viaje` },
    { name: "description", content: "Track your trip expenses" },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const { tripId } = params;

  const trip = await getTripById(tripId, user.id);

  if (!trip) {
    throw new Response("Trip not found", { status: 404 });
  }

  const { expenses, totals: categoryTotals } = await listExpenses(tripId, user.id);

  // Add a grand total entry expected by the component
  const totals: Record<string, number> = {
    ...categoryTotals,
    total: expenses.reduce((sum, e) => sum + e.amount, 0),
  };

  return data({ trip, expenses, totals });
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const { tripId } = params;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const submission = parseWithZod(formData, { schema: expenseSchema });

    if (submission.status !== "success") {
      return data(
        { submission: submission.reply(), error: null },
        { status: 400 }
      );
    }

    try {
      await createExpense(tripId, user.id, {
        amount: submission.value.amount,
        currency: submission.value.currency,
        category: submission.value.category,
        description: submission.value.description,
        date: submission.value.date,
        memoryId: submission.value.memoryId || null,
      });

      return data({ submission: submission.reply(), error: null });
    } catch (error) {
      console.error("Error creating expense:", error);
      return data(
        {
          submission: submission.reply(),
          error: "Failed to add expense. Please try again.",
        },
        { status: 500 }
      );
    }
  }

  if (intent === "delete") {
    const expenseId = formData.get("expenseId") as string;
    await deleteExpense(expenseId, tripId, user.id);
    return data({ success: true });
  }

  return data({ error: "Invalid action" }, { status: 400 });
}

const CATEGORY_OPTIONS = [
  { value: "ACCOMMODATION", label: "🏨 Accommodation" },
  { value: "FOOD", label: "🍽️ Food" },
  { value: "TRANSPORT", label: "🚗 Transport" },
  { value: "ACTIVITIES", label: "🎯 Activities" },
  { value: "SHOPPING", label: "🛍️ Shopping" },
  { value: "OTHER", label: "📝 Other" },
];

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ACCOMMODATION: "Accommodation",
  FOOD: "Food",
  TRANSPORT: "Transport",
  ACTIVITIES: "Activities",
  SHOPPING: "Shopping",
  OTHER: "Other",
};

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  ACCOMMODATION: "🏨",
  FOOD: "🍽️",
  TRANSPORT: "🚗",
  ACTIVITIES: "🎯",
  SHOPPING: "🛍️",
  OTHER: "📝",
};

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "JPY", label: "JPY" },
  { value: "AUD", label: "AUD" },
  { value: "CAD", label: "CAD" },
  { value: "CHF", label: "CHF" },
  { value: "CNY", label: "CNY" },
  { value: "MXN", label: "MXN" },
  { value: "BRL", label: "BRL" },
];

export default function Expenses({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { trip, expenses, totals } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteFetcher = useFetcher();

  const today = new Date().toISOString().split("T")[0];

  const createActionData =
    actionData && "submission" in actionData ? actionData : undefined;
  const actionError =
    actionData && "error" in actionData && actionData.error
      ? actionData.error
      : null;

  const [form, fields] = useForm({
    lastResult: createActionData?.submission,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: expenseSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    defaultValue: {
      currency: trip.currency || "USD",
      date: today,
      category: "OTHER",
    },
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const categoryTotals = CATEGORY_OPTIONS.filter(
    (cat) => totals[cat.value] !== undefined
  );

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to={`/trips/${trip.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {trip.title}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Trip Expenses</h1>
        <p className="text-muted-foreground mt-1">
          Track spending for {trip.title}
        </p>
      </div>

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <DollarSign className="text-primary h-8 w-8" />
            <div>
              <p className="text-muted-foreground text-sm">Total Spent</p>
              <p className="text-xl font-bold">
                {formatCurrency(totals.total, trip.currency)}
              </p>
            </div>
          </CardContent>
        </Card>

        {trip.budget && (
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <Receipt className="text-primary h-8 w-8" />
              <div>
                <p className="text-muted-foreground text-sm">Budget</p>
                <p className="text-xl font-bold">
                  {formatCurrency(trip.budget, trip.currency)}
                </p>
                <p
                  className={`text-xs ${
                    totals.total > trip.budget
                      ? "text-destructive"
                      : "text-green-600"
                  }`}
                >
                  {totals.total > trip.budget
                    ? `Over by ${formatCurrency(totals.total - trip.budget, trip.currency)}`
                    : `${formatCurrency(trip.budget - totals.total, trip.currency)} remaining`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={trip.budget ? "" : "sm:col-span-2 lg:col-span-1"}>
          <CardContent className="py-4">
            <p className="text-muted-foreground mb-2 text-sm font-medium">
              By Category
            </p>
            {categoryTotals.length > 0 ? (
              <div className="space-y-1">
                {categoryTotals.map((cat) => (
                  <div key={cat.value} className="flex justify-between text-sm">
                    <span>
                      {CATEGORY_ICONS[cat.value as ExpenseCategory]}{" "}
                      {CATEGORY_LABELS[cat.value as ExpenseCategory]}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(totals[cat.value], trip.currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No expenses yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Expense Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Expense
          </CardTitle>
          <CardDescription>Record a new expense for this trip</CardDescription>
        </CardHeader>
        <CardContent>
          {actionError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{actionError}</AlertDescription>
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
                  placeholder="e.g., Hotel night, Lunch, Train ticket"
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

              {/* Amount + Currency */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={fields.amount.id}>
                    Amount <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={fields.amount.id}
                    name={fields.amount.name}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue={fields.amount.initialValue as string}
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
                    defaultValue={fields.currency.initialValue || trip.currency || "USD"}
                  >
                    <SelectTrigger id={fields.currency.id} className="w-full">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category + Date */}
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Expense List */}
      <Card>
        <CardHeader>
          <CardTitle>All Expenses ({expenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="py-8 text-center">
              <Receipt className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
              <p className="text-muted-foreground">No expenses recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {expenses.map((expense, index) => (
                <div key={expense.id}>
                  {index > 0 && <Separator className="my-1" />}
                  <div className="flex items-center justify-between py-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span>
                          {CATEGORY_ICONS[expense.category as ExpenseCategory]}
                        </span>
                        <span className="truncate font-medium">
                          {expense.description}
                        </span>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {CATEGORY_LABELS[expense.category as ExpenseCategory]}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-sm">
                        {formatDate(expense.date)}
                      </p>
                    </div>

                    <div className="ml-4 flex items-center gap-3">
                      <span className="font-semibold">
                        {formatCurrency(expense.amount, expense.currency)}
                      </span>

                      <AlertDialog
                        open={deleteId === expense.id}
                        onOpenChange={(open) =>
                          setDeleteId(open ? expense.id : null)
                        }
                      >
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                            <AlertDialogDescription>
                              Delete "{expense.description}" ({formatCurrency(expense.amount, expense.currency)})? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <deleteFetcher.Form method="post">
                              <input type="hidden" name="intent" value="delete" />
                              <input
                                type="hidden"
                                name="expenseId"
                                value={expense.id}
                              />
                              <AlertDialogAction
                                type="submit"
                                variant="destructive"
                              >
                                Delete
                              </AlertDialogAction>
                            </deleteFetcher.Form>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
