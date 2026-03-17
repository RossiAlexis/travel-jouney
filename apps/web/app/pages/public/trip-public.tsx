import { Link, data } from "react-router";
import type { Route } from "./+types/trip-public";
import { db } from "~/lib/db.server";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.trip) {
    return [{ title: "Trip — Bitácora de Viaje" }];
  }
  const { trip, user } = data;
  const description =
    trip.description ||
    (trip.memories?.[0]?.content
      ? trip.memories[0].content.substring(0, 150) + "..."
      : `A travel journal by ${user.displayName}`);
  const ogImage =
    trip.memories?.find((m) => m.photos?.[0])?.photos?.[0]?.url ?? null;

  return [
    { title: `${trip.title} — ${user.displayName} | Bitácora de Viaje` },
    { name: "description", content: description },
    { property: "og:title", content: `${trip.title} — ${user.displayName}` },
    { property: "og:description", content: description },
    { property: "og:type", content: "article" },
    ...(ogImage ? [{ property: "og:image", content: ogImage }] : []),
    {
      property: "twitter:card",
      content: ogImage ? "summary_large_image" : "summary",
    },
    {
      property: "twitter:title",
      content: `${trip.title} — ${user.displayName}`,
    },
    { property: "twitter:description", content: description },
    ...(ogImage ? [{ property: "twitter:image", content: ogImage }] : []),
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

export default function TripPublicPage({
  loaderData,
}: Route.ComponentProps) {
  const { trip, user } = loaderData;

  const heroPhoto =
    trip.memories?.find((m) => m.photos?.[0])?.photos?.[0]?.url ?? null;

  return (
    <div className="min-h-screen bg-background">
      {/* Full-bleed hero */}
      <div
        className="relative w-full overflow-hidden"
        style={{ minHeight: "60vh", maxHeight: "80vh" }}
      >
        {heroPhoto ? (
          <img
            src={heroPhoto}
            alt={trip.title}
            className="w-full h-full object-cover"
            style={{ minHeight: "60vh", maxHeight: "80vh" }}
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/20 to-muted"
            style={{ minHeight: "60vh" }}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

        {/* Hero content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 lg:p-16">
          {/* Author row */}
          <div className="flex items-center justify-between mb-4">
            <Link
              to={`/${user.username}`}
              className="flex items-center gap-3 group"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.displayName}
                  className="w-9 h-9 rounded-full border-2 border-white/30"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/60 border-2 border-white/30 flex items-center justify-center text-white text-sm font-semibold">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-white/90 text-sm font-medium group-hover:text-white transition-colors">
                  {user.displayName}
                </p>
                <p className="text-white/50 text-xs">@{user.username}</p>
              </div>
            </Link>
            <ShareButton trip={trip} />
          </div>

          {/* Status label */}
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60 mb-2">
            {trip.status === "ONGOING"
              ? "Ongoing Journey"
              : trip.status === "PLANNED"
                ? "Upcoming"
                : "Travel Journal"}
          </p>

          {/* Title */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight max-w-3xl">
            {trip.title}
          </h1>

          {trip.description && (
            <p className="text-white/70 text-lg mt-3 max-w-2xl leading-relaxed line-clamp-2">
              {trip.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-4 text-white/50 text-sm">
            <span>
              {new Date(trip.startDate).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
              {trip.endDate
                ? ` — ${new Date(trip.endDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
                : ""}
            </span>
            <span>·</span>
            <span>{trip.memories?.length ?? 0} memories</span>
          </div>
        </div>
      </div>

      {/* Editorial body */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {trip.memories && trip.memories.length > 0 ? (
          <div className="space-y-16">
            {trip.memories.map((memory, index) => (
              <MemoryEditorialBlock
                key={memory.id}
                memory={memory}
                index={index}
                username={user.username}
                tripSlug={trip.slug!}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="font-display text-2xl font-semibold mb-2">
              No memories yet
            </p>
            <p className="text-muted-foreground">
              Check back soon — this story is still being written.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border py-8 mt-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Shared on{" "}
            <Link to="/" className="text-primary font-medium hover:underline">
              Bitácora de Viaje
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type MemoryShape = {
  id: string;
  title: string;
  content: string | null;
  date: Date | string;
  category: string;
  rating: number | null;
  locationName: string | null;
  slug: string | null;
  photos: { url: string; thumbnail: string | null }[];
};

function MemoryEditorialBlock({
  memory,
  index,
  username,
  tripSlug,
}: {
  memory: MemoryShape;
  index: number;
  username: string;
  tripSlug: string;
}) {
  const hasPhoto = memory.photos && memory.photos.length > 0;
  const isEven = index % 2 === 0;
  const isReflection = memory.category === "REFLECTION";
  const slug = memory.slug;

  const textBlock = (
    <Link
      to={`/${username}/${tripSlug}/${slug}`}
      className="group block"
      prefetch="intent"
    >
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {new Date(memory.date).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
          {memory.locationName ? ` · ${memory.locationName}` : ""}
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold leading-snug group-hover:text-primary transition-colors">
          {memory.title}
        </h2>
        {memory.content && (
          <p className="text-base leading-relaxed text-muted-foreground line-clamp-4">
            {memory.content}
          </p>
        )}
        <span className="text-sm text-primary font-medium group-hover:underline">
          Read more →
        </span>
      </div>
    </Link>
  );

  // REFLECTION category: centered pull-quote layout
  if (isReflection) {
    return (
      <div className="py-8 text-center border-y border-border">
        <p className="font-display text-3xl sm:text-4xl font-semibold leading-snug italic text-foreground/80 max-w-lg mx-auto">
          ❝ {memory.title} ❞
        </p>
        {memory.locationName && (
          <p className="text-sm text-muted-foreground mt-3">
            — {memory.locationName}
          </p>
        )}
        {slug && (
          <Link
            to={`/${username}/${tripSlug}/${slug}`}
            className="text-sm text-primary font-medium hover:underline mt-3 inline-block"
            prefetch="intent"
          >
            Read full entry →
          </Link>
        )}
      </div>
    );
  }

  // With photo: alternating image-text layout
  if (hasPhoto) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 items-start ${isEven ? "" : "sm:[&>*:first-child]:order-last"}`}
      >
        <div className="rounded-xl overflow-hidden aspect-[4/3]">
          <img
            src={memory.photos[0].thumbnail ?? memory.photos[0].url}
            alt={memory.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex items-center">{textBlock}</div>
      </div>
    );
  }

  // Text-forward: no photo
  return <div className="max-w-lg">{textBlock}</div>;
}

function ShareButton({
  trip,
}: {
  trip: { title: string; slug: string | null };
}) {
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: trip.title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-medium transition-colors"
      aria-label="Share this trip"
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
      Share
    </button>
  );
}
