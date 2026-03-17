import { Link, data } from "react-router";
import type { Route } from "./+types/user-profile";
import { db } from "~/lib/db.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { MapPin, Calendar, Globe } from "lucide-react";
import type { TripStatus } from "~/types";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.user) {
    return [{ title: "Profile Not Found - Bitácora de Viaje" }];
  }
  return [
    { title: `${data.user.displayName} - Bitácora de Viaje` },
    {
      name: "description",
      content: data.user.bio || `Travel journal of ${data.user.displayName}`,
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const { username } = params;

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  const publicTrips = await db.trip.findMany({
    where: {
      userId: user.id,
      isPublic: true,
      slug: { not: null },
    },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      startDate: true,
      endDate: true,
      status: true,
      slug: true,
      _count: {
        select: { memories: true },
      },
    },
  });

  return data({ user, publicTrips });
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

export default function UserProfile({ loaderData }: Route.ComponentProps) {
  const { user, publicTrips } = loaderData;

  const initials = user.displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={user.avatar ?? undefined}
                  alt={user.displayName}
                />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>

              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold">{user.displayName}</h1>
                <p className="text-muted-foreground">@{user.username}</p>
                {user.bio && (
                  <p className="mt-2 text-sm">{user.bio}</p>
                )}
                <div className="text-muted-foreground mt-3 flex items-center justify-center gap-4 text-sm sm:justify-start">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {publicTrips.length} public trip
                    {publicTrips.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Since {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Public Trips */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Globe className="h-5 w-5" />
            Public Trips
          </h2>

          {publicTrips.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
                <p className="text-muted-foreground">
                  No public trips yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {publicTrips.map((trip) => (
                <Link
                  key={trip.id}
                  to={`/${user.username}/${trip.slug}`}
                >
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate font-semibold">
                              {trip.title}
                            </h3>
                            <Badge
                              className={statusColors[trip.status]}
                              variant="secondary"
                            >
                              {statusLabels[trip.status]}
                            </Badge>
                          </div>
                          {trip.description && (
                            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                              {trip.description}
                            </p>
                          )}
                          <div className="text-muted-foreground mt-2 flex items-center gap-3 text-sm">
                            <span>
                              {formatDate(trip.startDate)}
                              {trip.endDate &&
                                ` — ${formatDate(trip.endDate)}`}
                            </span>
                            <span>
                              {trip._count.memories}{" "}
                              {trip._count.memories === 1 ? "memory" : "memories"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer link */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            Powered by{" "}
            <Link to="/" className="text-primary hover:underline">
              Bitácora de Viaje
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
