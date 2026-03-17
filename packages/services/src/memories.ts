import type { Memory } from '@repo/types'
import { serviceRequest } from './api.js'

export async function fetchMemoriesByTrip(tripId: string, token: string): Promise<Memory[]> {
  return serviceRequest<Memory[]>(`/trips/${tripId}/memories`, {}, token)
}

export async function createMemory(
  tripId: string,
  memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'tripId' | 'slug' | 'photos'>,
  token: string
): Promise<Memory> {
  return serviceRequest<Memory>(`/trips/${tripId}/memories`, {
    method: 'POST',
    body: JSON.stringify(memory),
  }, token)
}
