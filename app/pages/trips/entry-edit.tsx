import type { Route } from "./+types/entry-edit";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Edit Entry - Travel Journal" },
    { name: "description", content: "Edit your journal entry" },
  ];
}

export default function EntryEdit() {
  // Placeholder - will be implemented in Phase 4
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">Edit Entry</h1>
      <Card>
        <CardContent className="space-y-4 py-6">
          <p className="text-muted-foreground">
            Entry editing will be implemented in Phase 4: Journal Entries
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

