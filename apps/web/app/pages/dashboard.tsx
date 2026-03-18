import { Link, data, useNavigation } from "react-router";
import type { Route } from "./+types/dashboard";
import { requireAuth } from "~/lib/auth.server";
import { listTrips } from "@repo/services";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import type { TripStatus } from "~/types";
import { motion } from "framer-motion";
import z from "zod";

export function meta() {
  return [
    { title: "Dashboard — Bitácora de Viaje" },
    { name: "description", content: "Your travel journals and memories" },
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
  const unparsedTrips = await listTrips(user.id);

  const trips = tripsSchema.safeParse(unparsedTrips);
  if (!trips.success) {
    console.error("Error parsing trips", trips.error);
    throw new Error("Error parsing trips");
  }

  return data({ user, trips: trips.data });
}

// ─── Local type matching the transformed loader shape ────────────────────────
interface TripItem {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  startDate: Date;
  endDate: Date | null | undefined;
  status: TripStatus;
  memories: number;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function TripSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden">
      <div className="aspect-[4/3] bg-muted animate-pulse" />
      <div className="pt-3 space-y-2">
        <div
          className="h-5 bg-muted rounded-md w-3/5 animate-pulse"
          style={{ animationDelay: "100ms" }}
        />
        <div
          className="h-3.5 bg-muted rounded-md w-2/5 animate-pulse"
          style={{ animationDelay: "200ms" }}
        />
      </div>
    </div>
  );
}

// ─── Trip Card ────────────────────────────────────────────────────────────────
function TripCard({ trip }: { trip: TripItem }) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ y: 0, scale: 0.98 }}
      className="group"
    >
      <Link to={`/trips/${trip.id}`} className="block">
        <div className="relative overflow-hidden rounded-xl aspect-[4/3] bg-muted">
          {trip.coverImage ? (
            <img
              src={trip.coverImage}
              alt={trip.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-muted" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {/* Status badge — top left */}
          <div className="absolute top-3 left-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                trip.status === "ONGOING"
                  ? "bg-emerald-500/80 text-white"
                  : trip.status === "PLANNED"
                  ? "bg-sky-500/80 text-white"
                  : "bg-black/40 text-white/80"
              }`}
            >
              {trip.status === "ONGOING"
                ? "Ongoing"
                : trip.status === "PLANNED"
                ? "Planned"
                : "Completed"}
            </span>
          </div>
          {/* Content — bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display text-lg font-semibold text-white leading-tight line-clamp-2">
              {trip.title}
            </h3>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-white/70 text-xs">
                {new Date(trip.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
                {trip.endDate
                  ? ` — ${new Date(trip.endDate).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}`
                  : ""}
              </span>
              <span className="text-white/50">·</span>
              <span className="text-white/70 text-xs">
                {trip.memories} {trip.memories === 1 ? "memory" : "memories"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Trip Section ─────────────────────────────────────────────────────────────
function TripSection({
  title,
  trips,
  highlight,
}: {
  title: string;
  trips: TripItem[];
  highlight?: boolean;
}) {
  if (trips.length === 0) return null;
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {title}
      </h2>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.06 } },
        }}
      >
        {trips.map((trip) => (
          <motion.div
            key={trip.id}
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.3, ease: "easeOut" },
              },
            }}
            className={
              highlight ? "ring-2 ring-primary ring-offset-2 rounded-xl" : ""
            }
          >
            <TripCard trip={trip} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { user, trips } = loaderData;
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const ongoingTrips = trips.filter((t) => t.status === "ONGOING");
  const plannedTrips = trips.filter((t) => t.status === "PLANNED");
  const completedTrips = trips.filter((t) => t.status === "COMPLETED");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            {user.displayName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {trips.length === 0
              ? "Start documenting your travel adventures"
              : `${trips.length} trip${trips.length === 1 ? "" : "s"} in your journal`}
          </p>
        </div>
        <Button asChild>
          <Link to="/trips/new">
            <Plus className="mr-2 h-4 w-4" />
            New Trip
          </Link>
        </Button>
      </div>

      {/* Skeleton loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <TripSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && trips.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-40 h-32 mb-6 opacity-60">
            <svg
              viewBox="0 0 160 130"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <circle
                cx="80"
                cy="65"
                r="40"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted-foreground"
                strokeDasharray="6 4"
              />
              <path
                d="M80 25 L80 105 M40 65 L120 65"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted-foreground"
              />
              <circle
                cx="80"
                cy="65"
                r="6"
                fill="currentColor"
                className="text-primary"
              />
              <path
                d="M80 65 L95 50"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="text-primary"
              />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <circle
                  key={i}
                  cx={80 + 52 * Math.cos((angle * Math.PI) / 180)}
                  cy={65 + 52 * Math.sin((angle * Math.PI) / 180)}
                  r="2"
                  fill="currentColor"
                  className="text-muted-foreground"
                />
              ))}
            </svg>
          </div>
          <h2 className="font-display text-2xl font-semibold mb-2">
            Your first journey awaits
          </h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-6">
            Every great explorer starts somewhere. Document where the world
            takes you.
          </p>
          <Button asChild size="lg">
            <Link to="/trips/new">
              <Plus className="mr-2 h-4 w-4" />
              Plan Your First Trip
            </Link>
          </Button>
        </div>
      )}

      {/* Trip sections */}
      {!isLoading && trips.length > 0 && (
        <div className="space-y-10">
          <TripSection
            title="Right Now"
            trips={ongoingTrips}
            highlight={true}
          />
          <TripSection title="Coming Up" trips={plannedTrips} />
          <TripSection title="Journals" trips={completedTrips} />
        </div>
      )}
    </div>
  );
}
