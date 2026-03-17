import { db } from "@repo/db";
import type { TripStatus } from "@prisma/client";
import { ServiceError } from "./api.js";

type CreateTripInput = {
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  status?: string;
  budget?: number | null;
  currency?: string;
  coverImage?: string | null;
};

type UpdateTripInput = Partial<CreateTripInput> & { isPublic?: boolean; slug?: string | null };

export async function listTrips(userId: string) {
  return db.trip.findMany({
    where: { userId },
    include: {
      _count: { select: { memories: true, expenses: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTripById(tripId: string, userId: string) {
  return db.trip.findFirst({
    where: { id: tripId, userId },
    include: {
      memories: {
        include: {
          photos: { orderBy: { order: "asc" }, take: 3 },
        },
        orderBy: { date: "desc" },
      },
      _count: { select: { expenses: true } },
    },
  });
}

export async function createTrip(userId: string, data: CreateTripInput) {
  return db.trip.create({
    data: {
      userId,
      title: data.title,
      description: data.description ?? null,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: (data.status ?? "PLANNED") as TripStatus,
      budget: data.budget ?? null,
      currency: data.currency ?? "USD",
      coverImage: data.coverImage ?? null,
    },
  });
}

export async function updateTrip(tripId: string, userId: string, data: UpdateTripInput) {
  const trip = await db.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) throw new ServiceError(404, "Trip not found");

  return db.trip.update({
    where: { id: tripId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      ...(data.status !== undefined && { status: data.status as TripStatus }),
      ...(data.budget !== undefined && { budget: data.budget }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      ...(data.slug !== undefined && { slug: data.slug }),
    },
  });
}

export async function deleteTrip(tripId: string, userId: string) {
  const trip = await db.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) throw new ServiceError(404, "Trip not found");
  return db.trip.delete({ where: { id: tripId } });
}

export async function getTripStats(tripId: string, userId: string) {
  const trip = await db.trip.findFirst({
    where: { id: tripId, userId },
    include: {
      memories: {
        include: { photos: true },
      },
      expenses: true,
    },
  });
  if (!trip) throw new ServiceError(404, "Trip not found");

  const totalMemories = trip.memories.length;
  const memoriesWithPhotos = trip.memories.filter((m) => m.photos.length > 0).length;

  let totalDays = 0;
  if (trip.startDate && trip.endDate) {
    totalDays = Math.ceil(
      (trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  } else if (trip.memories.length > 0) {
    const dates = trip.memories.map((m) => m.date.getTime());
    totalDays = Math.ceil(
      (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24)
    ) + 1;
  }

  const totalExpenses = trip.expenses.reduce((sum, e) => sum + e.amount, 0);

  const expensesByCategory = trip.expenses.reduce<Record<string, number>>((acc, e) => {
    const cat = e.category ?? "other";
    acc[cat] = (acc[cat] ?? 0) + e.amount;
    return acc;
  }, {});

  const memoriesByCategory = trip.memories.reduce<Record<string, number>>((acc, m) => {
    const cat = m.category ?? "general";
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  const locationSet = new Set(
    trip.memories
      .map((m) => m.locationName)
      .filter((l): l is string => l != null && l.length > 0)
  );
  const uniqueLocations = locationSet.size;

  return {
    totalMemories,
    memoriesWithPhotos,
    totalDays,
    totalExpenses,
    expensesByCategory,
    memoriesByCategory,
    uniqueLocations,
  };
}

export async function exportTripAsJson(tripId: string, userId: string) {
  const trip = await db.trip.findFirst({
    where: { id: tripId, userId },
    include: {
      memories: {
        include: { photos: true },
        orderBy: { date: "asc" },
      },
      expenses: {
        orderBy: { date: "desc" },
      },
    },
  });
  if (!trip) throw new ServiceError(404, "Trip not found");
  return trip;
}
