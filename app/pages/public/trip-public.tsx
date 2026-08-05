import { data } from "react-router";
import type { Route } from "./+types/trip-public";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { MapPin, Calendar, BookOpen } from "lucide-react";
import { MEMORY_CATEGORY_ICONS, MEMORY_CATEGORY_LABELS } from "~/lib/constants";
import type { MemoryWithPhotos, Trip } from "~/lib/schemas";

export function meta({ data: loaderData }: Route.MetaArgs) {
  if (!loaderData?.trip) {
    return [{ title: "Trip Not Found" }];
  }
  const { trip, ownerName } = loaderData;
  return [
    { title: `${trip.title} — ${ownerName}` },
    {
      name: "description",
      content: trip.description || `${ownerName}'s travel journal`,
    },
  ];
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const { username, tripSlug } = params;

  const trip = await context.repos.trips.findPublicByUsernameAndSlug(
    username,
    tripSlug
  );

  // Return 404 indistinguishable from nonexistent trip — no information leakage
  if (!trip) {
    throw new Response(null, { status: 404 });
  }

  const [memories, owner] = await Promise.all([
    context.repos.memories.findByTripWithPhotos(trip.id),
    context.repos.users.findByUsername(username),
  ]);

  if (!owner) {
    throw new Response(null, { status: 404 });
  }

  return data({
    trip,
    memories,
    ownerName: owner.displayName,
    ownerUsername: owner.username,
  });
}

function formatDateRange(start: Date | string, end: Date | string | null) {
  const fmt = (d: Date | string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  if (!end) return fmt(start);
  return `${fmt(start)} – ${fmt(end)}`;
}

function MemoryCard({ memory }: { memory: MemoryWithPhotos }) {
  const icon = MEMORY_CATEGORY_ICONS[memory.category];
  const label = MEMORY_CATEGORY_LABELS[memory.category];
  const firstPhoto = memory.photos[0];

  return (
    <Card className="overflow-hidden">
      {firstPhoto && (
        <img
          src={firstPhoto.url}
          alt={memory.title}
          className="h-48 w-full object-cover"
        />
      )}
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{memory.title}</h3>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {icon} {label}
          </Badge>
        </div>
        <p className="text-muted-foreground mb-3 text-xs">
          {new Date(memory.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
        <p className="text-sm leading-relaxed">{memory.content}</p>
        {memory.locationName && (
          <p className="text-muted-foreground mt-3 flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3" />
            {memory.locationName}
          </p>
        )}
        {memory.rating !== null && (
          <p className="mt-1 text-xs">
            {"★".repeat(memory.rating)}{"☆".repeat(5 - memory.rating)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function TripPublic({ loaderData }: Route.ComponentProps) {
  const { trip, memories, ownerName, ownerUsername } = loaderData;

  return (
    <div className="min-h-screen">
      {/* Cover / Hero */}
      {trip.coverImage ? (
        <div className="relative h-64 w-full overflow-hidden sm:h-80">
          <img
            src={trip.coverImage}
            alt={trip.title}
            className="h-full w-full object-cover"
          />
          <div className="from-background/80 absolute inset-0 bg-gradient-to-t to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <TripHeader trip={trip} ownerName={ownerName} ownerUsername={ownerUsername} hero />
          </div>
        </div>
      ) : (
        <div className="bg-muted border-b px-4 py-8">
          <div className="mx-auto max-w-3xl">
            <TripHeader trip={trip} ownerName={ownerName} ownerUsername={ownerUsername} />
          </div>
        </div>
      )}

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        {trip.description && (
          <p className="text-muted-foreground mb-8 text-base leading-relaxed">
            {trip.description}
          </p>
        )}

        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <BookOpen className="h-5 w-5" />
          Memories
          <span className="text-muted-foreground text-sm font-normal">
            ({memories.length})
          </span>
        </h2>

        {memories.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No memories shared yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {memories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        )}
      </main>

      <footer className="text-muted-foreground border-t py-6 text-center text-xs">
        Shared with{" "}
        <a
          href="/"
          className="hover:text-foreground underline underline-offset-2"
        >
          Travel Journal
        </a>
      </footer>
    </div>
  );
}

function TripHeader({
  trip,
  ownerName,
  ownerUsername,
  hero = false,
}: {
  trip: Trip;
  ownerName: string;
  ownerUsername: string;
  hero?: boolean;
}) {
  return (
    <div className={hero ? "text-white" : ""}>
      <h1 className="mb-1 text-3xl font-bold">{trip.title}</h1>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <a
          href={`/${ownerUsername}`}
          className={`font-medium underline underline-offset-2 ${hero ? "hover:text-white/80" : "hover:text-foreground"}`}
        >
          {ownerName}
        </a>
        <span className={hero ? "text-white/60" : "text-muted-foreground"}>·</span>
        <span
          className={`flex items-center gap-1 ${hero ? "text-white/80" : "text-muted-foreground"}`}
        >
          <Calendar className="h-3.5 w-3.5" />
          {formatDateRange(trip.startDate, trip.endDate)}
        </span>
        <Badge variant="secondary" className="text-xs">
          {trip.status.charAt(0) + trip.status.slice(1).toLowerCase()}
        </Badge>
      </div>
    </div>
  );
}
