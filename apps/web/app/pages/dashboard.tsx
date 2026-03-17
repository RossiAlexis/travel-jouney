import { Link, data } from "react-router";
import type { Route } from "./+types/dashboard";
import { requireAuth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Plus, MapPin, Calendar, BookOpen } from "lucide-react";
import type { TripStatus } from "~/types";
import z from "zod";
export function meta() {
  return [
    { title: "Dashboard — Bitácora de Viaje" },
    { name: "description", content: "View and manage your travel journals" },
  ];
}

const tripsSchema = z
  .array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      coverImage: z.string().nullable(),
      startDate: z.date(),
      endDate: z.date().nullable().optional(),
      status: z.enum(["PLANNED", "ONGOING", "COMPLETED"]),
      _count: z.object({
        memories: z.number(),
      }),
    })
  )
  .transform((data) => {
    return data.map((trip) => {
      return {
        id: trip.id,
        title: trip.title,
        description: trip.description,
        coverImage: trip.coverImage,
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status,
        memories: trip._count.memories,
      };
    });
  });

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const unparsedTrips = await db.trip.findMany({
    where: { userId: user.id },
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
    include: {
      _count: {
        select: {
          memories: true,
        },
      },
    },
  });

  const trips = tripsSchema.safeParse(unparsedTrips);
  if (!trips.success) {
    console.error("Error parsing trips", trips.error);
    throw new Error("Error parsing trips");
  }

  return data({ user, trips: trips.data });
}

const statusColors: Record<TripStatus, string> = {
  PLANNED: "bg-blue-100 text-blue-800",
  ONGOING: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<TripStatus, string> = {
  PLANNED: "Planned",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
};

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { user, trips } = loaderData;

  const ongoingTrips = trips.filter((t) => t.status === "ONGOING");
  const plannedTrips = trips.filter((t) => t.status === "PLANNED");
  const completedTrips = trips.filter((t) => t.status === "COMPLETED");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user.displayName}!
          </h1>
          <p className="text-muted-foreground">
            {trips.length === 0
              ? "Start documenting your travel adventures"
              : `You have ${trips.length} trip${trips.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button asChild>
          <Link to="/trips/new">
            <Plus className="mr-2 h-4 w-4" />
            New Trip
          </Link>
        </Button>
      </div>

      {/* Empty State */}
      {trips.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <MapPin className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h2 className="mb-2 text-xl font-semibold">No trips yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first trip to start documenting your adventures
            </p>
            <Button asChild>
              <Link to="/trips/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Trip
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ongoing Trips */}
      {ongoingTrips.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Ongoing Adventures</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ongoingTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {/* Planned Trips */}
      {plannedTrips.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Upcoming Trips</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plannedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Trips */}
      {completedTrips.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Past Adventures</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

interface TripCardProps {
  trip: {
    id: string;
    title: string;
    description: string | null;
    coverImage: string | null;
    startDate: Date;
    endDate: Date | null | undefined;
    status: TripStatus;
    memories: number;
  };
}

function TripCard({ trip }: TripCardProps) {
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Link to={`/trips/${trip.id}`}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
        {/* Cover Image */}
        <div className="bg-muted relative h-40">
          {trip.coverImage ? (
            <img
              src={trip.coverImage}
              alt={trip.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <MapPin className="text-muted-foreground h-12 w-12" />
            </div>
          )}
          <Badge
            className={`absolute top-2 right-2 ${statusColors[trip.status]}`}
            variant="secondary"
          >
            {statusLabels[trip.status]}
          </Badge>
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="line-clamp-1">{trip.title}</CardTitle>
        </CardHeader>

        <CardContent>
          {trip.description && (
            <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
              {trip.description}
            </p>
          )}

          <div className="text-muted-foreground flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(trip.startDate)}</span>
              {trip.endDate && <span>- {formatDate(trip.endDate)}</span>}
            </div>
          </div>

          <div className="text-muted-foreground mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>
                {trip.memories}{" "}
                {trip.memories === 1 ? "memory" : "memories"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
