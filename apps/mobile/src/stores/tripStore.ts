import { create } from "zustand";
import type { Trip } from "@repo/types";
import type { TripWithCount } from "../services/trips";

interface TripState {
  trips: TripWithCount[];
  selectedTrip: Trip | null;
  isLoading: boolean;

  // Actions
  setTrips: (trips: TripWithCount[]) => void;
  setSelectedTrip: (trip: Trip | null) => void;
  addTrip: (trip: TripWithCount) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  removeTrip: (id: string) => void;
}

export const useTripStore = create<TripState>((set) => ({
  trips: [],
  selectedTrip: null,
  isLoading: false,

  setTrips: (trips) => set({ trips }),

  setSelectedTrip: (trip) => set({ selectedTrip: trip }),

  addTrip: (trip) => set((state) => ({ trips: [trip, ...state.trips] })),

  updateTrip: (id, updates) =>
    set((state) => ({
      trips: state.trips.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      selectedTrip:
        state.selectedTrip?.id === id
          ? { ...state.selectedTrip, ...updates }
          : state.selectedTrip,
    })),

  removeTrip: (id) =>
    set((state) => ({
      trips: state.trips.filter((t) => t.id !== id),
      selectedTrip: state.selectedTrip?.id === id ? null : state.selectedTrip,
    })),
}));
