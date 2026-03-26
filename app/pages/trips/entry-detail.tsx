import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

export function meta() {
  return [
    { title: "Entry Details - Travel Journal" },
    { name: "description", content: "View your journal entry" },
  ];
}

export default function EntryDetail() {
  // Placeholder - will be implemented in Phase 4
  return (
    <div>
      <h1 className="sr-only">Entry Details</h1>
      <div className="mb-6">
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Entry detail view will be implemented in Phase 4: Journal Entries
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
