import { useState } from "react";
import { Link, useFetcher, data, redirect } from "react-router";
import type { Route } from "./+types/trip-detail";
import { requireAuth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
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
  DollarSign,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  BookOpen,
  Image,
  Map,
  Receipt,
} from "lucide-react";
import * as z from "zod";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData?.trip) {
    return [
      { title: "Trip Not Found — Bitácora de Viaje" },
      { name: "description", content: "Trip not found" },
    ];
  }
  return [
    { title: `${loaderData.trip.title} — Bitácora de Viaje` },
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
  memories: z.array(
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
    memories: z.number(),
    expenses: z.number(),
  }),
  totalExpenses: z.number(),
});

type TripMemory = z.infer<typeof tripDetailSchema>["memories"][number];

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const { tripId } = params;

  const trip = await db.trip.findFirst({
    where: {
      id: tripId,
      userId: user.id,
    },
    include: {
      memories: {
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
          memories: true,
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

export default function TripDetail({ loaderData }: Route.ComponentProps) {
  const { trip } = loaderData;
  const deleteFetcher = useFetcher();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isDeleting = deleteFetcher.state === "submitting";

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
  const allPhotos = trip.memories.flatMap((memory) =>
    memory.photos.map((photo) => ({
      ...photo,
      memoryId: memory.id,
      memoryTitle: memory.title,
    }))
  );

  // Group memories by calendar day
  const memoriesByDay = trip.memories.reduce(
    (acc, memory) => {
      const dayKey = new Date(memory.date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      if (!acc[dayKey]) acc[dayKey] = [];
      acc[dayKey].push(memory);
      return acc;
    },
    {} as Record<string, typeof trip.memories>
  );

  const dayGroups = Object.entries(memoriesByDay);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      {/* Hero */}
      <div
        className="relative w-full overflow-hidden rounded-2xl"
        style={{ minHeight: "280px", maxHeight: "420px" }}
      >
        {trip.coverImage ? (
          <img
            src={trip.coverImage}
            alt={trip.title}
            className="w-full h-full object-cover"
            style={{ minHeight: "280px", maxHeight: "420px" }}
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-muted"
            style={{ minHeight: "280px" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                trip.status === "ONGOING"
                  ? "bg-emerald-500/80 text-white"
                  : trip.status === "PLANNED"
                    ? "bg-sky-500/80 text-white"
                    : "bg-black/40 text-white/70"
              }`}
            >
              {trip.status === "ONGOING"
                ? "Ongoing"
                : trip.status === "PLANNED"
                  ? "Planned"
                  : "Completed"}
            </span>
            {trip.isPublic && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-black/40 text-white/70 backdrop-blur-sm">
                Public
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white leading-tight">
            {trip.title}
          </h1>
          {trip.description && (
            <p className="text-white/70 text-sm mt-2 line-clamp-2 max-w-xl">
              {trip.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 text-white/60 text-sm">
            <span>
              {new Date(trip.startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {trip.endDate && (
              <>
                <span>—</span>
                <span>
                  {new Date(trip.endDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </>
            )}
            <span>·</span>
            <span>
              {trip.memories.length}{" "}
              {trip.memories.length === 1 ? "memory" : "memories"}
            </span>
          </div>
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link to={`/trips/${trip.id}/memories/new`}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Memory
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/trips/${trip.id}/expenses`}>
              <DollarSign className="mr-1.5 h-3.5 w-3.5" />
              Expenses
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to={`/trips/${trip.id}/edit`}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
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
                className={`h-full transition-[width] duration-500 ${
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-20 mb-4 opacity-50">
                <svg
                  viewBox="0 0 96 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full text-muted-foreground"
                >
                  <rect
                    x="16"
                    y="12"
                    width="64"
                    height="56"
                    rx="4"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path d="M16 28h64" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M32 20v-8M64 20v-8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M32 44h32M32 54h20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="font-display text-xl font-semibold mb-1">
                This chapter is blank
              </p>
              <p className="text-muted-foreground text-sm max-w-xs mb-4">
                Start writing your adventure. Add your first memory — a meal, a
                view, a feeling worth keeping.
              </p>
              <Button asChild size="sm">
                <Link to={`/trips/${trip.id}/memories/new`}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add First Memory
                </Link>
              </Button>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical axis line */}
              <div className="absolute left-[19px] top-6 bottom-6 w-px bg-border" />

              <div className="space-y-8">
                {dayGroups.map(([day, dayMemories]) => (
                  <div key={day}>
                    {/* Date header */}
                    <div className="relative flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground bg-background px-3 py-1 rounded-full border border-border shrink-0">
                        {day}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Memories for this day */}
                    <div className="ml-10 space-y-4">
                      {dayMemories.map((memory) => (
                        <MemoryCard
                          key={memory.id}
                          memory={memory}
                          tripId={trip.id}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
              {allPhotos.map((photo) => (
                <Link
                  key={photo.id}
                  to={`/trips/${trip.id}/memories/${photo.memoryId}`}
                  className="group relative aspect-square overflow-hidden rounded-lg"
                >
                  <img
                    src={photo.thumbnail || photo.url}
                    alt={photo.memoryTitle}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/30" />
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

// ─── Sub-components ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  ACCOMMODATION: {
    label: "Accommodation",
    color:
      "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
  },
  FOOD: {
    label: "Food & Dining",
    color: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  },
  ACTIVITY: {
    label: "Activity",
    color:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  },
  TRANSPORT: {
    label: "Transport",
    color: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
  },
  REFLECTION: {
    label: "Reflection",
    color:
      "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  },
  OTHER: {
    label: "Journal",
    color:
      "bg-stone-50 text-stone-600 dark:bg-stone-900 dark:text-stone-400",
  },
} as const;

function MemoryCard({
  memory,
  tripId,
}: {
  memory: TripMemory;
  tripId: string;
}) {
  const category =
    CATEGORY_CONFIG[memory.category as keyof typeof CATEGORY_CONFIG] ??
    CATEGORY_CONFIG.OTHER;
  const hasPhoto = memory.photos && memory.photos.length > 0;

  return (
    <Link to={`/trips/${tripId}/memories/${memory.id}`} className="block group">
      <div className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors duration-200">
        {hasPhoto ? (
          /* Variant A: With photo — image left */
          <div className="grid grid-cols-[160px_1fr] sm:grid-cols-[200px_1fr]">
            <div className="relative overflow-hidden">
              <img
                src={memory.photos[0].thumbnail ?? memory.photos[0].url}
                alt={memory.title}
                className="w-full h-full object-cover min-h-[120px] transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${category.color}`}
              >
                {category.label}
              </span>
              <h3 className="font-display text-base font-semibold leading-snug group-hover:text-primary transition-colors duration-200">
                {memory.title}
              </h3>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {memory.rating && (
                  <span className="text-amber-400">
                    {"★".repeat(memory.rating)}
                    {"☆".repeat(5 - memory.rating)}
                  </span>
                )}
                {memory.locationName && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {memory.locationName}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Variant B: Text-forward */
          <div className="p-4">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${category.color}`}
            >
              {category.label}
            </span>
            <h3 className="font-display text-base font-semibold leading-snug group-hover:text-primary transition-colors duration-200">
              {memory.title}
            </h3>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {memory.rating && (
                <span className="text-amber-400">
                  {"★".repeat(memory.rating)}
                  {"☆".repeat(5 - memory.rating)}
                </span>
              )}
              {memory.locationName && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {memory.locationName}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
