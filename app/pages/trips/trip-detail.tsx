import type { Route } from "./+types/trip-detail";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Trip Details - Travel Journal" },
    { name: "description", content: "View your trip details" },
  ];
}

export default function TripDetail() {
  // Placeholder - will be implemented in Phase 3
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Trip detail view will be implemented in Phase 3: Trip Management
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

