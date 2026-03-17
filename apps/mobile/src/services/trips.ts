import type { Trip, Memory } from "@repo/types";
import { apiRequest } from "./api";

export type TripStatus = "PLANNED" | "ONGOING" | "COMPLETED";

export interface TripWithCount extends Trip {
  status: TripStatus;
  memories: number;
  _count?: { memories: number; expenses: number };
}

export async function fetchTrips(token: string): Promise<TripWithCount[]> {
  const data = await apiRequest<TripWithCount[]>("/trips", {}, token);
  return data.map((trip) => ({
    ...trip,
    memories: trip._count?.memories ?? 0,
  }));
}

export async function fetchTripById(
  id: string,
  token: string,
): Promise<Trip | null> {
  return apiRequest<Trip>(`/trips/${id}`, {}, token);
}

export async function createTrip(
  trip: Omit<Trip, "id" | "createdAt" | "updatedAt">,
  token: string,
): Promise<Trip> {
  return apiRequest<Trip>("/trips", { method: "POST", body: JSON.stringify(trip) }, token);
}

export async function updateTrip(
  id: string,
  updates: Partial<Omit<Trip, "id" | "createdAt" | "updatedAt">>,
  token: string,
): Promise<Trip> {
  return apiRequest<Trip>(
    `/trips/${id}`,
    { method: "PUT", body: JSON.stringify(updates) },
    token,
  );
}

export async function deleteTrip(id: string, token: string): Promise<void> {
  await apiRequest(`/trips/${id}`, { method: "DELETE" }, token);
}

export async function fetchMemoriesByTrip(
  tripId: string,
  token: string,
): Promise<Memory[]> {
  return apiRequest<Memory[]>(`/trips/${tripId}/memories`, {}, token);
}

export async function createMemory(
  memory: Omit<Memory, "id" | "createdAt" | "updatedAt">,
  token: string,
): Promise<Memory> {
  return apiRequest<Memory>(
    `/trips/${memory.tripId}/memories`,
    { method: "POST", body: JSON.stringify(memory) },
    token,
  );
}
