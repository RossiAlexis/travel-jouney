import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

export function meta() {
  return [
    { title: "Edit Memory - Travel Journal" },
    { name: "description", content: "Edit your travel memory" },
  ];
}

export default function MemoryEdit() {
  // Placeholder - will be implemented in Phase 4
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">Edit Memory</h1>
      <Card>
        <CardContent className="space-y-4 py-6">
          <p className="text-muted-foreground">
            Memory editing will be implemented in Phase 4
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
