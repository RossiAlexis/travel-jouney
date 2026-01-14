import type { Route } from "./+types/entry-new";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New Entry - Travel Journal" },
    { name: "description", content: "Create a new journal entry" },
  ];
}

export default function EntryNew() {
  // Placeholder - will be implemented in Phase 4
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">Create Journal Entry</h1>
      <Card>
        <CardContent className="space-y-4 py-6">
          <p className="text-muted-foreground">
            Entry creation will be implemented in Phase 4: Journal Entries
          </p>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

