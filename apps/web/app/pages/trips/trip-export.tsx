import type { Route } from "./+types/trip-export";
import { requireAuth } from "~/lib/auth.server";
import { exportTripAsJson } from "@repo/services";

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const { tripId } = params;

  const trip = await exportTripAsJson(tripId, user.id);

  const exportData = {
    exportedAt: new Date().toISOString(),
    trip: {
      title: trip.title,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      status: trip.status,
      currency: trip.currency,
      budget: trip.budget,
    },
    memories: trip.memories.map((m) => ({
      title: m.title,
      content: m.content,
      date: m.date,
      category: m.category,
      rating: m.rating,
      locationName: m.locationName,
      latitude: m.latitude,
      longitude: m.longitude,
      photos: m.photos.map((p) => ({ url: p.url, caption: p.caption })),
    })),
    expenses: trip.expenses.map((e) => ({
      amount: e.amount,
      currency: e.currency,
      category: e.category,
      description: e.description,
      date: e.date,
    })),
  };

  const filename = `${trip.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-export.json`;

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
