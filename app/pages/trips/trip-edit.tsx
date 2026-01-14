import type { Route } from "./+types/trip-edit";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Edit Trip - Travel Journal" },
    { name: "description", content: "Edit your trip" },
  ];
}

export default function TripEdit() {
  // Placeholder - will be implemented in Phase 3
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">Edit Trip</h1>
      <Card>
        <CardContent className="space-y-4 py-6">
          <p className="text-muted-foreground">
            Trip editing will be implemented in Phase 3: Trip Management
          </p>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

