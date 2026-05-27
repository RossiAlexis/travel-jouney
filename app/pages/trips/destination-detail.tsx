import { Link, data } from "react-router";
import type { Route } from "./+types/destination-detail";
import { requireAuth } from "~/lib/auth.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Edit,
  MapPin,
  Plus,
  BookOpen,
} from "lucide-react";
import type { MemoryWithPhotos } from "~/lib/schemas";
import { MEMORY_CATEGORY_ICONS, MEMORY_CATEGORY_LABELS } from "~/lib/constants";

const categoryIcons = MEMORY_CATEGORY_ICONS;
const categoryLabels = MEMORY_CATEGORY_LABELS;

export function meta({ data: loaderData }: Route.MetaArgs) {
  if (!loaderData?.destination) {
    return [{ title: "Destination - Travel Journal" }];
  }
  return [
    { title: `${loaderData.destination.name} - Travel Journal` },
    {
      name: "description",
      content:
        loaderData.destination.description ||
        `Memories from ${loaderData.destination.name}`,
    },
  ];
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const user = await requireAuth(context.repos, request);
  const { tripId, destinationId } = params;

  const trip = await context.repos.trips.findByIdForUser(tripId, user.id);
  if (!trip) {
    throw new Response("Trip not found", { status: 404 });
  }

  const destination = await context.repos.destinations.findByIdForTrip(
    destinationId,
    tripId
  );
  if (!destination) {
    throw new Response("Destination not found", { status: 404 });
  }

  const memories = await context.repos.memories.findByDestinationWithPhotos(
    destinationId,
    3
  );

  return data({ trip, destination, memories });
}

export default function DestinationDetail({
  loaderData,
}: Route.ComponentProps) {
  const { trip, destination, memories } = loaderData;

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatMemoryDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const startLabel = formatDate(destination.startDate);
  const endLabel = formatDate(destination.endDate);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/trips/${trip.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {trip.title}
        </Link>
      </Button>

      {/* Destination Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="text-muted-foreground h-5 w-5" />
            <h1 className="text-3xl font-bold">{destination.name}</h1>
          </div>

          {destination.description && (
            <p className="text-muted-foreground max-w-2xl">
              {destination.description}
            </p>
          )}

          {(startLabel || endLabel) && (
            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Calendar className="h-4 w-4" />
              {startLabel && <span>{startLabel}</span>}
              {startLabel && endLabel && <span>—</span>}
              {endLabel && <span>{endLabel}</span>}
            </div>
          )}

          <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <BookOpen className="h-4 w-4" />
            <span>
              {memories.length} {memories.length === 1 ? "memory" : "memories"}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild>
            <Link
              to={`/trips/${trip.id}/destinations/${destination.id}/memories/new`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Memory
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/trips/${trip.id}/destinations/${destination.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Memories List */}
      {memories.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <BookOpen className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h2 className="mb-2 text-xl font-semibold">No memories yet</h2>
            <p className="text-muted-foreground mb-6">
              Start documenting your time in {destination.name}
            </p>
            <Button asChild>
              <Link
                to={`/trips/${trip.id}/destinations/${destination.id}/memories/new`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Memory
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {memories.map((memory: MemoryWithPhotos) => (
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
                        src={memory.photos[0].thumbnail || memory.photos[0].url}
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
                      <span>{formatMemoryDate(memory.date)}</span>
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
    </div>
  );
}
