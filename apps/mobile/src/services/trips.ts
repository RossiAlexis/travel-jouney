import { supabase } from "./supabase";
import type { Trip, Memory } from "@repo/types";

export type TripStatus = "PLANNED" | "ONGOING" | "COMPLETED";

export interface TripWithCount extends Trip {
  status: TripStatus;
  memories: number;
}

export async function fetchTrips(userId: string): Promise<TripWithCount[]> {
  const { data, error } = await supabase
    .from("Trip")
    .select(
      `
      *,
      Memory(count)
    `,
    )
    .eq("userId", userId)
    .order("createdAt", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((trip) => ({
    ...trip,
    memories: trip.Memory?.[0]?.count ?? 0,
  }));
}

export async function fetchTripById(id: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from("Trip")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createTrip(
  trip: Omit<Trip, "id" | "createdAt" | "updatedAt">,
): Promise<Trip> {
  const { data, error } = await supabase
    .from("Trip")
    .insert(trip)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTrip(
  id: string,
  updates: Partial<Omit<Trip, "id" | "createdAt" | "updatedAt">>,
): Promise<Trip> {
  const { data, error } = await supabase
    .from("Trip")
    .update({ ...updates, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from("Trip").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchMemoriesByTrip(tripId: string): Promise<Memory[]> {
  const { data, error } = await supabase
    .from("Memory")
    .select("*")
    .eq("tripId", tripId)
    .order("date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createMemory(
  memory: Omit<Memory, "id" | "createdAt" | "updatedAt">,
): Promise<Memory> {
  const { data, error } = await supabase
    .from("Memory")
    .insert(memory)
    .select()
    .single();

  if (error) throw error;
  return data;
}
