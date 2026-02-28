import { useState } from "react";
import { Link, useFetcher, data, redirect } from "react-router";
import type { Route } from "./+types/memory-detail";
import { requireAuth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
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
import { ArrowLeft, Edit, Trash2, MapPin, Calendar, Star } from "lucide-react";
import type { MemoryCategory } from "~/types";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.memory) {
    return [{ title: "Memory - Travel Journal" }];
  }
  return [
    { title: `${data.memory.title} - Travel Journal` },
    { name: "description", content: data.memory.content.slice(0, 160) },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const { tripId, memoryId } = params;

  const memory = await db.memory.findFirst({
    where: { id: memoryId, tripId, userId: user.id },
    include: { photos: { orderBy: { order: "asc" } } },
  });

  if (!memory) {
    throw new Response("Memory not found", { status: 404 });
  }

  const trip = await db.trip.findFirst({
    where: { id: tripId, userId: user.id },
    select: { id: true, title: true },
  });

  return data({ memory, trip });
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const { tripId, memoryId } = params;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const memory = await db.memory.findFirst({
      where: { id: memoryId, tripId, userId: user.id },
    });

    if (!memory) {
      throw new Response("Memory not found", { status: 404 });
    }

    await db.memory.delete({ where: { id: memoryId } });
    return redirect(`/trips/${tripId}`);
  }

  return data({ error: "Invalid action" }, { status: 400 });
}

const categoryLabels: Record<MemoryCategory, string> = {
  ACCOMMODATION: "Accommodation",
  FOOD: "Food & Dining",
  ACTIVITY: "Activity",
  TRANSPORT: "Transport",
  REFLECTION: "Reflection",
  OTHER: "Other",
};

const categoryIcons: Record<MemoryCategory, string> = {
  ACCOMMODATION: "🏨",
  FOOD: "🍽️",
  ACTIVITY: "🎯",
  TRANSPORT: "🚗",
  REFLECTION: "💭",
  OTHER: "📝",
};

export default function MemoryDetail({ loaderData }: Route.ComponentProps) {
  const { memory, trip } = loaderData;
  const deleteFetcher = useFetcher();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isDeleting = deleteFetcher.state === "submitting";

  const formattedDate = new Date(memory.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link to={`/trips/${trip?.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {trip?.title ?? "Trip"}
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{categoryIcons[memory.category]}</span>
            <h1 className="text-3xl font-bold">{memory.title}</h1>
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
            <Badge variant="secondary">{categoryLabels[memory.category]}</Badge>

            {memory.rating && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{memory.rating}/5</span>
              </span>
            )}

            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </span>

            {memory.locationName && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {memory.locationName}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/trips/${trip?.id}/memories/${memory.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>

          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Memory</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{memory.title}"? This action
                  cannot be undone.
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
                    {isDeleting ? "Deleting..." : "Delete Memory"}
                  </AlertDialogAction>
                </deleteFetcher.Form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="py-6">
          <p className="whitespace-pre-wrap leading-relaxed">{memory.content}</p>
        </CardContent>
      </Card>

      {/* Photos */}
      {memory.photos.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Photos</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {memory.photos.map((photo) => (
              <div key={photo.id} className="aspect-square overflow-hidden rounded-lg">
                <img
                  src={photo.thumbnail || photo.url}
                  alt={photo.caption ?? ""}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
