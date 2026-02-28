import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTrips,
  fetchTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  fetchMemoriesByTrip,
  createMemory,
} from "../services/trips";
import type { Trip, Memory } from "@repo/types";

export const tripKeys = {
  all: ["trips"] as const,
  byUser: (userId: string) => ["trips", "user", userId] as const,
  byId: (id: string) => ["trips", id] as const,
  memories: (tripId: string) => ["trips", tripId, "memories"] as const,
};

export function useTrips(userId: string) {
  return useQuery({
    queryKey: tripKeys.byUser(userId),
    queryFn: () => fetchTrips(userId),
    enabled: !!userId,
  });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: tripKeys.byId(id),
    queryFn: () => fetchTripById(id),
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trip: Omit<Trip, "id" | "createdAt" | "updatedAt">) =>
      createTrip(trip),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Trip, "id" | "createdAt" | "updatedAt">>;
    }) => updateTrip(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.byId(id) });
      queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTrip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

export function useMemories(tripId: string) {
  return useQuery({
    queryKey: tripKeys.memories(tripId),
    queryFn: () => fetchMemoriesByTrip(tripId),
    enabled: !!tripId,
  });
}

export function useCreateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memory: Omit<Memory, "id" | "createdAt" | "updatedAt">) =>
      createMemory(memory),
    onSuccess: (_, memory) => {
      queryClient.invalidateQueries({
        queryKey: tripKeys.memories(memory.tripId),
      });
      queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}
