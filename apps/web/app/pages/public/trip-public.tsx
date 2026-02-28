import { Link, data } from "react-router";
import type { Route } from "./+types/trip-public";
import { db } from "~/lib/db.server";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Calendar,
  MapPin,
  ArrowLeft,
  BookOpen,
  Star,
} from "lucide-react";
import type { TripStatus, MemoryCategory } from "~/types";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.trip) {
    return [{ title: "Trip Not Found - Travel Journal" }];
  }
  return [
    { title: `${data.trip.title} by ${data.user.displayName} - Travel Journal` },
    {
      name: "description",
      content: data.trip.description || `${data.trip.title} travel journal`,
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const { username, tripSlug } = params;

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
    },
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  const trip = await db.trip.findFirst({
    where: {
      userId: user.id,
      slug: tripSlug,
      isPublic: true,
    },
    select: {
      id: true,
      title: true,
      description: true,
      startDate: true,
      endDate: true,
      status: true,
      slug: true,
      memories: {
        orderBy: { date: "asc" },
        select: {
          id: true,
          title: true,
          content: true,
          date: true,
          category: true,
          rating: true,
          locationName: true,
          slug: true,
          photos: {
            take: 1,
            orderBy: { order: "asc" },
            select: { url: true, thumbnail: true },
          },
        },
      },
    },
  });

  if (!trip) {
    throw new Response("Trip not found", { status: 404 });
  }

  return data({ user, trip });
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

export default function TripPublic({ loaderData }: Route.ComponentProps) {
  const { user, trip } = loaderData;

  const initials = user.displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatMonthYear = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Back link */}
        <Link
          to={`/${user.username}`}
          className="text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {user.displayName}&apos;s journal
        </Link>

        {/* Trip Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-bold">{trip.title}</h1>
            <Badge className={statusColors[trip.status]} variant="secondary">
              {statusLabels[trip.status]}
            </Badge>
          </div>

          {trip.description && (
            <p className="text-muted-foreground mb-4">{trip.description}</p>
          )}

          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatMonthYear(trip.startDate)}
              {trip.endDate && ` — ${formatMonthYear(trip.endDate)}`}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {trip.memories.length}{" "}
              {trip.memories.length !== 1 ? "memories" : "memory"}
            </span>
          </div>

          {/* Author */}
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

        {/* Memories Timeline */}
        {trip.memories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
              <p className="text-muted-foreground">No memories yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Travel Memories</h2>
            {trip.memories.map((memory) => {
              const memoryLink =
                memory.slug
                  ? `/${user.username}/${trip.slug}/${memory.slug}`
                  : undefined;

              const content = (
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex gap-4 py-4">
                    {memory.photos.length > 0 ? (
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <img
                          src={
                            memory.photos[0].thumbnail || memory.photos[0].url
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
                        {categoryIcons[memory.category]}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-1 font-semibold">
                          {memory.title}
                        </h3>
                        {memory.rating && (
                          <span className="flex shrink-0 items-center gap-0.5 text-yellow-500">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span className="text-xs">{memory.rating}/5</span>
                          </span>
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
                      <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                        {memory.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );

              return memoryLink ? (
                <Link key={memory.id} to={memoryLink}>
                  {content}
                </Link>
              ) : (
                <div key={memory.id}>{content}</div>
              );
            })}
          </div>
        )}

        {/* Footer */}
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
