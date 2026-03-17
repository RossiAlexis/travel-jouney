import type { Trip } from '@repo/types'
import { serviceRequest } from './api.js'

export interface TripWithCount extends Trip {
  memories: number
}

export async function fetchTrips(token: string): Promise<TripWithCount[]> {
  return serviceRequest<TripWithCount[]>('/trips', {}, token)
}

export async function fetchTripById(id: string, token: string): Promise<Trip> {
  return serviceRequest<Trip>(`/trips/${id}`, {}, token)
}

export async function createTrip(
  trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'slug' | 'isPublic' | 'coverImage'>,
  token: string
): Promise<Trip> {
  return serviceRequest<Trip>('/trips', { method: 'POST', body: JSON.stringify(trip) }, token)
}

export async function updateTrip(
  id: string,
  updates: Partial<Omit<Trip, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>,
  token: string
): Promise<Trip> {
  return serviceRequest<Trip>(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(updates) }, token)
}

export async function deleteTrip(id: string, token: string): Promise<void> {
  await serviceRequest<void>(`/trips/${id}`, { method: 'DELETE' }, token)
}
