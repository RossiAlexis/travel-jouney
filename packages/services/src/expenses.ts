import { serviceRequest } from './api.js'

export interface Expense {
  id: string
  tripId: string
  userId: string
  amount: number
  currency: string
  category: string
  description: string
  date: Date | string
  createdAt: Date | string
  updatedAt: Date | string
}

export async function fetchExpensesByTrip(tripId: string, token: string): Promise<Expense[]> {
  return serviceRequest<Expense[]>(`/trips/${tripId}/expenses`, {}, token)
}
