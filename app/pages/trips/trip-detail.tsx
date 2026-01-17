import { useState } from "react";
import { Link, useFetcher, data, redirect } from "react-router";
import type { Route } from "./+types/trip-detail";
import { requireAuth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
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
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Edit,
  MapPin,
  Plus,
  Trash2,
  BookOpen,
  Image,
  Map,
  Receipt,
} from "lucide-react";
import type { TripStatus, EntryCategory } from "~/types";
import * as z from "zod";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData?.trip) {
    return [
      { title: "Trip Not Found - Travel Journal" },
      { name: "description", content: "Trip not found" },
    ];
  }
  return [
    { title: `${loaderData.trip.title} - Travel Journal` },
    {
      name: "description",
      content: loaderData.trip.description || "View trip details",
    },
  ];
}

const tripDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  coverImage: z.string().nullable(),
  startDate: z.date(),
  endDate: z.date().nullable(),
  status: z.enum(["PLANNED", "ONGOING", "COMPLETED"]),
  isPublic: z.boolean(),
  budget: z.number().nullable(),
  currency: z.string(),
  entries: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      date: z.date(),
      category: z.enum([
        "ACCOMMODATION",
        "FOOD",
        "ACTIVITY",
        "TRANSPORT",
        "REFLECTION",
        "OTHER",
      ]),
      locationName: z.string().nullable(),
      rating: z.number().nullable(),
      photos: z.array(
        z.object({
          id: z.string(),
          url: z.string(),
          thumbnail: z.string().nullable(),
        })
      ),
    })
  ),
  _count: z.object({
    entries: z.number(),
    expenses: z.number(),
  }),
  totalExpenses: z.number(),
});

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const { tripId } = params;

  const trip = await db.trip.findFirst({
    where: {
      id: tripId,
      userId: user.id,
    },
    include: {
      entries: {
        orderBy: { date: "desc" },
        include: {
          photos: {
            take: 3,
            orderBy: { order: "asc" },
          },
        },
      },
      _count: {
        select: {
          entries: true,
          expenses: true,
        },
      },
    },
  });

  if (!trip) {
    throw new Response("Trip not found", { status: 404 });
  }

  // Calculate total expenses
  const expenseTotal = await db.expense.aggregate({
    where: { tripId },
    _sum: { amount: true },
  });

  const tripWithExpenses = {
    ...trip,
    totalExpenses: expenseTotal._sum.amount || 0,
  };

  const parsed = tripDetailSchema.safeParse(tripWithExpenses);
  if (!parsed.success) {
    console.error("Error parsing trip:", parsed.error);
    throw new Response("Error loading trip data", { status: 500 });
  }

  return data({ trip: parsed.data, user });
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const { tripId } = params;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    // Verify ownership
    const trip = await db.trip.findFirst({
      where: { id: tripId, userId: user.id },
    });

    if (!trip) {
      throw new Response("Trip not found", { status: 404 });
    }

    await db.trip.delete({
      where: { id: tripId },
    });

    return redirect("/dashboard");
  }

  return data({ error: "Invalid action" }, { status: 400 });
}

const statusColors: Record<TripStatus, string> = {
  PLANNED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ONGOING: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  COMPLETED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const statusLabels: Record<TripStatus, string> = {
  PLANNED: "Planned",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
};

const categoryIcons: Record<EntryCategory, string> = {
  ACCOMMODATION: "🏨",
  FOOD: "🍽️",
  ACTIVITY: "🎯",
  TRANSPORT: "🚗",
  REFLECTION: "💭",
  OTHER: "📝",
};

const categoryLabels: Record<EntryCategory, string> = {
  ACCOMMODATION: "Accommodation",
  FOOD: "Food & Dining",
  ACTIVITY: "Activity",
  TRANSPORT: "Transport",
  REFLECTION: "Reflection",
  OTHER: "Other",
};

export default function TripDetail({ loaderData }: Route.ComponentProps) {
  const { trip } = loaderData;
  const deleteFetcher = useFetcher();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isDeleting = deleteFetcher.state === "submitting";

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const budgetProgress = trip.budget
    ? Math.min((trip.totalExpenses / trip.budget) * 100, 100)
    : 0;
  const isOverBudget = trip.budget && trip.totalExpenses > trip.budget;

  // Get all photos from entries
  const allPhotos = trip.entries.flatMap((entry) =>
    entry.photos.map((photo) => ({
      ...photo,
      entryId: entry.id,
      entryTitle: entry.title,
    }))
  );

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      {/* Trip Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{trip.title}</h1>
            <Badge className={statusColors[trip.status]} variant="secondary">
              {statusLabels[trip.status]}
            </Badge>
          </div>

          {trip.description && (
            <p className="text-muted-foreground max-w-2xl">
              {trip.description}
            </p>
          )}

          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(trip.startDate)}</span>
              {trip.endDate && <span> - {formatDate(trip.endDate)}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span>
                {trip._count.entries} entr
                {trip._count.entries === 1 ? "y" : "ies"}
              </span>
            </div>
            {trip.budget && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" />
                <span>
                  {formatCurrency(trip.totalExpenses, trip.currency)} /{" "}
                  {formatCurrency(trip.budget, trip.currency)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild>
            <Link to={`/trips/${trip.id}/entries/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/trips/${trip.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{trip.title}"? This will
                  permanently delete the trip and all its entries, photos, and
                  expenses. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <deleteFetcher.Form method="post">
                  <input type="hidden" name="intent" value="delete" />
                  <AlertDialogAction
                    type="submit"
                    disabled={isDeleting}
                    variant="destructive"
                  >
                    {isDeleting ? "Deleting..." : "Delete Trip"}
                  </AlertDialogAction>
                </deleteFetcher.Form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Budget Progress */}
      {trip.budget && (
        <Card>
          <CardContent className="py-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Budget</span>
              <span
                className={`text-sm font-medium ${
                  isOverBudget ? "text-destructive" : ""
                }`}
              >
                {formatCurrency(trip.totalExpenses, trip.currency)} of{" "}
                {formatCurrency(trip.budget, trip.currency)}
              </span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className={`h-full transition-all ${
                  isOverBudget ? "bg-destructive" : "bg-primary"
                }`}
                style={{ width: `${budgetProgress}%` }}
              />
            </div>
            {isOverBudget && (
              <p className="text-destructive mt-1 text-xs">
                Over budget by{" "}
                {formatCurrency(
                  trip.totalExpenses - trip.budget,
                  trip.currency
                )}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">
            <BookOpen className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="map">
            <Map className="mr-2 h-4 w-4" />
            Map
          </TabsTrigger>
          <TabsTrigger value="gallery">
            <Image className="mr-2 h-4 w-4" />
            Gallery
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <Receipt className="mr-2 h-4 w-4" />
            Expenses
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          {trip.entries.length === 0 ? (
            <Card className="py-12 text-center">
              <CardContent>
                <BookOpen className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h2 className="mb-2 text-xl font-semibold">No entries yet</h2>
                <p className="text-muted-foreground mb-6">
                  Start documenting your journey by adding your first entry
                </p>
                <Button asChild>
                  <Link to={`/trips/${trip.id}/entries/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Entry
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {trip.entries.map((entry) => (
                <Link
                  key={entry.id}
                  to={`/trips/${trip.id}/entries/${entry.id}`}
                >
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex gap-4 py-4">
                      {/* Entry Photo Preview */}
                      {entry.photos.length > 0 ? (
                        <div className="bg-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                          <img
                            src={
                              entry.photos[0].thumbnail || entry.photos[0].url
                            }
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          {entry.photos.length > 1 && (
                            <div className="absolute right-1 bottom-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                              +{entry.photos.length - 1}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-muted flex h-20 w-20 shrink-0 items-center justify-center rounded-lg text-2xl">
                          {categoryIcons[entry.category]}
                        </div>
                      )}

                      {/* Entry Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-1 font-semibold">
                            {entry.title}
                          </h3>
                          {entry.rating && (
                            <div className="flex items-center gap-0.5 text-yellow-500">
                              {"★".repeat(entry.rating)}
                              {"☆".repeat(5 - entry.rating)}
                            </div>
                          )}
                        </div>
                        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-sm">
                          <span>{formatDate(entry.date)}</span>
                          <Badge variant="outline" className="text-xs">
                            {categoryLabels[entry.category]}
                          </Badge>
                          {entry.locationName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {entry.locationName}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map">
          <Card className="py-12 text-center">
            <CardContent>
              <Map className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h2 className="mb-2 text-xl font-semibold">Map View</h2>
              <p className="text-muted-foreground">
                Interactive map showing your travel route will be available in a
                future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery">
          {allPhotos.length === 0 ? (
            <Card className="py-12 text-center">
              <CardContent>
                <Image className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h2 className="mb-2 text-xl font-semibold">No photos yet</h2>
                <p className="text-muted-foreground">
                  Add photos to your entries to see them here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {allPhotos.map((photo) => (
                <Link
                  key={photo.id}
                  to={`/trips/${trip.id}/entries/${photo.entryId}`}
                  className="group relative aspect-square overflow-hidden rounded-lg"
                >
                  <img
                    src={photo.thumbnail || photo.url}
                    alt={photo.entryTitle}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <Card className="py-8 text-center">
            <CardContent>
              <Receipt className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h2 className="mb-2 text-xl font-semibold">Expense Tracking</h2>
              <p className="text-muted-foreground mb-6">
                View and manage your trip expenses
              </p>
              <Button asChild>
                <Link to={`/trips/${trip.id}/expenses`}>View Expenses</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
