import { Link, useLoaderData } from "react-router";
import { data } from "react-router";
import type { Route } from "./+types/profile";
import { requireAuth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Settings, MapPin, BookOpen, Calendar } from "lucide-react";

export function meta() {
  return [
    { title: "Profile — Bitácora de Viaje" },
    { name: "description", content: "View your profile" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);

  // Get user stats
  const stats = await db.user.findUnique({
    where: { id: user.id },
    include: {
      _count: {
        select: {
          trips: true,
          memories: true,
        },
      },
    },
  });

  return data({ user, stats });
}

export default function Profile() {
  const { user, stats } = useLoaderData<typeof loader>();

  const initials = user.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profile</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/profile/edit">
              <Settings className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={user.avatar ?? undefined}
                alt={user.displayName}
              />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>

            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold">{user.displayName}</h2>
              <p className="text-muted-foreground">@{user.username}</p>
              <p className="text-muted-foreground mt-1 text-sm">{user.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4 text-center">
              <MapPin className="text-primary mx-auto mb-2 h-6 w-6" />
              <p className="text-2xl font-bold">{stats?._count.trips ?? 0}</p>
              <p className="text-muted-foreground text-sm">Trips</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <BookOpen className="text-primary mx-auto mb-2 h-6 w-6" />
              <p className="text-2xl font-bold">{stats?._count.memories ?? 0}</p>
              <p className="text-muted-foreground text-sm">Memories</p>
            </div>
            <div className="col-span-2 rounded-lg border p-4 text-center sm:col-span-1">
              <Calendar className="text-primary mx-auto mb-2 h-6 w-6" />
              <p className="text-2xl font-bold">
                {new Date(stats?.createdAt ?? new Date()).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    year: "numeric",
                  }
                )}
              </p>
              <p className="text-muted-foreground text-sm">Member since</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
