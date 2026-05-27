import { useState, useRef } from "react";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
import { Link, Form, useFetcher, data, redirect } from "react-router";
import type { Route } from "./+types/memory-detail";
import { requireAuth } from "~/lib/auth.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Upload,
  X,
  Star,
  Image,
} from "lucide-react";
import { MEMORY_CATEGORY_ICONS, MEMORY_CATEGORY_LABELS } from "~/lib/constants";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const categoryIcons = MEMORY_CATEGORY_ICONS;
const categoryLabels = MEMORY_CATEGORY_LABELS;

export function meta({ data: loaderData }: Route.MetaArgs) {
  if (!loaderData?.memory) {
    return [{ title: "Memory - Travel Journal" }];
  }
  return [
    { title: `${loaderData.memory.title} - Travel Journal` },
    { name: "description", content: loaderData.memory.content.slice(0, 150) },
  ];
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const user = await requireAuth(context.repos, request);
  const { tripId, memoryId } = params;

  const trip = await context.repos.trips.findByIdForUser(tripId, user.id);
  if (!trip) throw new Response("Trip not found", { status: 404 });

  const memory = await context.repos.memories.findByIdForTrip(memoryId, tripId);
  if (!memory) throw new Response("Memory not found", { status: 404 });

  let destination = null;
  if (memory.destinationId) {
    destination = await context.repos.destinations.findByIdForTrip(
      memory.destinationId,
      tripId
    );
  }

  return data({ trip, memory, destination });
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const user = await requireAuth(context.repos, request);
  const { tripId, memoryId } = params;

  const trip = await context.repos.trips.findByIdForUser(tripId, user.id);
  if (!trip) throw new Response("Trip not found", { status: 404 });

  const memory = await context.repos.memories.findByIdForTrip(memoryId, tripId);
  if (!memory) throw new Response("Memory not found", { status: 404 });

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "upload-photos") {
    const bucket = context.cloudflare.env.PHOTOS;
    if (!bucket) {
      return data({ error: "Photo storage not configured" }, { status: 500 });
    }

    const files = formData.getAll("photos");
    for (const file of files) {
      if (!(file instanceof File) || file.size === 0) continue;
      if (!ALLOWED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_FILE_SIZE) continue;

      const ext = MIME_TO_EXT[file.type] ?? "jpg";
      const key = `photos/${memoryId}/${crypto.randomUUID()}.${ext}`;

      await bucket.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
      });

      try {
        await context.repos.photos.create({ memoryId, url: `/${key}` });
      } catch {
        await bucket.delete(key);
      }
    }

    return redirect(`/trips/${tripId}/memories/${memoryId}`);
  }

  if (intent === "delete-photo") {
    const photoId = formData.get("photoId") as string;
    const photo = await context.repos.photos.findById(photoId);

    if (photo && photo.memoryId === memoryId) {
      const bucket = context.cloudflare.env.PHOTOS;
      if (bucket) {
        await bucket.delete(photo.url.slice(1));
      }
      await context.repos.photos.deleteById(photoId, memoryId);
    }

    return redirect(`/trips/${tripId}/memories/${memoryId}`);
  }

  if (intent === "delete") {
    const photos = await context.repos.photos.findByMemory(memoryId);
    const bucket = context.cloudflare.env.PHOTOS;

    if (bucket && photos.length > 0) {
      await Promise.all(photos.map((p) => bucket.delete(p.url.slice(1))));
    }

    await context.repos.memories.deleteById(memoryId, tripId);

    if (memory.destinationId) {
      return redirect(`/trips/${tripId}/destinations/${memory.destinationId}`);
    }
    return redirect(`/trips/${tripId}`);
  }

  return data({ error: "Invalid action" }, { status: 400 });
}

function PhotoDeleteButton({ photoId }: { photoId: string }) {
  const fetcher = useFetcher();

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="delete-photo" />
      <input type="hidden" name="photoId" value={photoId} />
      <button
        type="submit"
        disabled={fetcher.state !== "idle"}
        className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 disabled:cursor-not-allowed"
        aria-label="Delete photo"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </fetcher.Form>
  );
}

export default function MemoryDetail({ loaderData }: Route.ComponentProps) {
  const { trip, memory, destination } = loaderData;
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedFileCount, setSelectedFileCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const backHref = destination
    ? `/trips/${trip.id}/destinations/${destination.id}`
    : `/trips/${trip.id}`;

  const backLabel = destination ? destination.name : trip.title;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild>
        <Link to={backHref}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {backLabel}
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{memory.title}</h1>

          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(memory.date)}
            </span>
            <Badge variant="outline" className="flex items-center gap-1">
              <span>{categoryIcons[memory.category]}</span>
              {categoryLabels[memory.category]}
            </Badge>
            {memory.locationName && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {memory.locationName}
              </span>
            )}
          </div>

          {memory.rating && (
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < memory.rating! ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                />
              ))}
              <span className="text-muted-foreground ml-1 text-sm">
                {memory.rating} / 5
              </span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/trips/${trip.id}/memories/${memory.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Memory</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{memory.title}"? This will
                  also remove all photos attached to this memory. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Form method="post">
                  <input type="hidden" name="intent" value="delete" />
                  <AlertDialogAction type="submit" variant="destructive">
                    Delete Memory
                  </AlertDialogAction>
                </Form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          <p className="leading-relaxed whitespace-pre-wrap">
            {memory.content}
          </p>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Photos
            {memory.photos.length > 0 && (
              <span className="text-muted-foreground text-sm font-normal">
                ({memory.photos.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {memory.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {memory.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group bg-muted relative aspect-square overflow-hidden rounded-lg"
                >
                  <img
                    src={photo.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <PhotoDeleteButton photoId={photo.id} />
                </div>
              ))}
            </div>
          )}

          {memory.photos.length === 0 && (
            <p className="text-muted-foreground text-sm">No photos yet.</p>
          )}

          <Form
            method="post"
            encType="multipart/form-data"
            className="flex flex-wrap items-center gap-3"
          >
            <input type="hidden" name="intent" value="upload-photos" />
            <input
              ref={fileInputRef}
              type="file"
              name="photos"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              id="photo-upload"
              onChange={(e) =>
                setSelectedFileCount(e.target.files?.length ?? 0)
              }
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose Photos
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              disabled={selectedFileCount === 0}
            >
              Upload
            </Button>
            {selectedFileCount > 0 ? (
              <span className="text-muted-foreground text-xs">
                {selectedFileCount} {selectedFileCount === 1 ? "file" : "files"}{" "}
                selected
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">
                JPG, PNG, WebP, GIF · max 10 MB each
              </span>
            )}
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
