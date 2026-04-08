import { useState } from "react";
import { Link, useFetcher, data, redirect } from "react-router";
import type { Route } from "./+types/trip-detail";
import { requireAuth } from "~/lib/auth.server";
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
import type { TripStatus, MemoryCategory } from "~/types";
import type { MemoryWithPhotos, Photo, TripWithCounts } from "~/lib/schemas";

interface TripDetailData extends TripWithCounts {
  memories: MemoryWithPhotos[];
  totalExpenses: number;
}

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

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const user = await requireAuth(context.repos, request);
  const { tripId } = params;

  const trip = await context.repos.trips.findByIdWithCountsForUser(
    tripId,
    user.id
  );

  if (!trip) {
    throw new Response("Trip not found", { status: 404 });
  }

  const memories = await context.repos.memories.findByTripWithPhotos(tripId, 3);
  const totalExpenses = await context.repos.expenses.sumByTrip(tripId);

  return data({
    trip: {
      ...trip,
      memories,
      totalExpenses,
    },
    user,
  });
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const user = await requireAuth(context.repos, request);
  const { tripId } = params;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    // Verify ownership
    const trip = await context.repos.trips.findByIdForUser(tripId, user.id);

    if (!trip) {
      throw new Response("Trip not found", { status: 404 });
    }

    await context.repos.trips.deleteForUser(tripId, user.id);

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

const categoryIcons: Record<MemoryCategory, string> = {
  ACCOMMODATION: "🏨",
  FOOD: "🍽️",
  ACTIVITY: "🎯",
  TRANSPORT: "🚗",
  REFLECTION: "💭",
  OTHER: "📝",
};

const categoryLabels: Record<MemoryCategory, string> = {
  ACCOMMODATION: "Accommodation",
  FOOD: "Food & Dining",
  ACTIVITY: "Activity",
  TRANSPORT: "Transport",
  REFLECTION: "Reflection",
  OTHER: "Other",
};

export default function TripDetail({ loaderData }: Route.ComponentProps) {
  const trip = loaderData.trip as TripDetailData;
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

  // Get all photos from memories
  const allPhotos = trip.memories.flatMap((memory: MemoryWithPhotos) =>
    memory.photos.map((photo: Pick<Photo, "id" | "url" | "thumbnail">) => ({
      ...photo,
      memoryId: memory.id,
      memoryTitle: memory.title,
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
                {trip.memoriesCount}{" "}
                {trip.memoriesCount === 1 ? "memory" : "memories"}
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
            <Link to={`/trips/${trip.id}/memories/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Memory
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
              <Button
                variant="destructive"
                size="icon"
                aria-label={`Delete trip ${trip.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{trip.title}"? This will
                  permanently delete the trip and all its memories, photos, and
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
          {trip.memories.length === 0 ? (
            <Card className="py-12 text-center">
              <CardContent>
                <BookOpen className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h2 className="mb-2 text-xl font-semibold">No memories yet</h2>
                <p className="text-muted-foreground mb-6">
                  Start documenting your journey by adding your first memory
                </p>
                <Button asChild>
                  <Link to={`/trips/${trip.id}/memories/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Memory
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {trip.memories.map((memory: MemoryWithPhotos) => (
                <Link
                  key={memory.id}
                  to={`/trips/${trip.id}/memories/${memory.id}`}
                >
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex gap-4 py-4">
                      {/* Memory Photo Preview */}
                      {memory.photos.length > 0 ? (
                        <div className="bg-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                          <img
                            src={
                              memory.photos[0].thumbnail || memory.photos[0].url
                            }
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          {memory.photos.length > 1 && (
                            <div className="absolute right-1 bottom-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                              +{memory.photos.length - 1}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-muted flex h-20 w-20 shrink-0 items-center justify-center rounded-lg text-2xl">
                          {categoryIcons[memory.category]}
                        </div>
                      )}

                      {/* Memory Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="line-clamp-1 font-semibold">
                            {memory.title}
                          </h2>
                          {memory.rating && (
                            <div className="flex items-center gap-0.5 text-yellow-500">
                              {"★".repeat(memory.rating)}
                              {"☆".repeat(5 - memory.rating)}
                            </div>
                          )}
                        </div>
                        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-sm">
                          <span>{formatDate(memory.date)}</span>
                          <Badge variant="outline" className="text-xs">
                            {categoryLabels[memory.category]}
                          </Badge>
                          {memory.locationName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {memory.locationName}
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
                  Add photos to your memories to see them here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {allPhotos.map((photo: (typeof allPhotos)[number]) => (
                <Link
                  key={photo.id}
                  to={`/trips/${trip.id}/memories/${photo.memoryId}`}
                  className="group relative aspect-square overflow-hidden rounded-lg"
                >
                  <img
                    src={photo.thumbnail || photo.url}
                    alt={photo.memoryTitle}
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
