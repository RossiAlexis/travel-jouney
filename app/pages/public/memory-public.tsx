import { Link, data } from "react-router";
import type { Route } from "./+types/memory-public";
import { db } from "~/lib/db.server";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Calendar, MapPin, ArrowLeft, Star } from "lucide-react";
import type { MemoryCategory } from "~/types";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.memory) {
    return [{ title: "Memory Not Found - Travel Journal" }];
  }
  return [
    {
      title: `${data.memory.title} - ${data.trip.title} by ${data.user.displayName} - Travel Journal`,
    },
    { name: "description", content: data.memory.content.slice(0, 160) },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const { username, tripSlug, memorySlug } = params;

  const user = await db.user.findUnique({
    where: { username },
    select: { id: true, username: true, displayName: true, avatar: true },
  });

  if (!user) throw new Response("User not found", { status: 404 });

  const trip = await db.trip.findFirst({
    where: { userId: user.id, slug: tripSlug, isPublic: true },
    select: { id: true, title: true, slug: true },
  });

  if (!trip) throw new Response("Trip not found", { status: 404 });

  const memory = await db.memory.findFirst({
    where: { tripId: trip.id, slug: memorySlug },
    select: {
      id: true,
      title: true,
      content: true,
      date: true,
      category: true,
      rating: true,
      locationName: true,
      locationAddress: true,
      photos: {
        orderBy: { order: "asc" },
        select: { id: true, url: true, thumbnail: true, caption: true },
      },
    },
  });

  if (!memory) throw new Response("Memory not found", { status: 404 });

  return data({ user, trip, memory });
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

export default function MemoryPublic({ loaderData }: Route.ComponentProps) {
  const { user, trip, memory } = loaderData;

  const initials = user.displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formattedDate = new Date(memory.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Link
            to={`/${user.username}`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {user.displayName}
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link
            to={`/${user.username}/${trip.slug}`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {trip.title}
          </Link>
        </div>

        <Link
          to={`/${user.username}/${trip.slug}`}
          className="text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {trip.title}
        </Link>

        {/* Memory Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
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

          <div className="mt-4 flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.avatar ?? undefined} alt={user.displayName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <Link
              to={`/${user.username}`}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              by {user.displayName}
            </Link>
          </div>
        </div>

        {/* Photos */}
        {memory.photos.length > 0 && (
          <div className="mb-6">
            {memory.photos.length === 1 ? (
              <div className="overflow-hidden rounded-xl">
                <img
                  src={memory.photos[0].thumbnail || memory.photos[0].url}
                  alt={memory.photos[0].caption ?? ""}
                  className="w-full object-cover"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
            )}
          </div>
        )}

        {/* Content */}
        <Card>
          <CardContent className="py-6">
            <p className="whitespace-pre-wrap leading-relaxed">{memory.content}</p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            Powered by{" "}
            <Link to="/" className="text-primary hover:underline">
              Travel Journal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
