import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

export function meta() {
  return [
    { title: "Expenses - Travel Journal" },
    { name: "description", content: "Track your trip expenses" },
  ];
}

export default function Expenses() {
  // Placeholder - will be implemented in Phase 5
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Trip Expenses</h1>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Expense tracking will be implemented in Phase 5: Expense Tracking
          </p>
          <div className="mt-6 space-y-4">
            <Skeleton className="mx-auto h-32 w-32 rounded-full" />
            <Skeleton className="mx-auto h-4 w-48" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
