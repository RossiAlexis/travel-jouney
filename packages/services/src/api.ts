const BASE_URL_DEFAULT = 'http://localhost:3001'

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export class ServiceError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

export async function serviceRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
  baseUrl = BASE_URL_DEFAULT
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers })
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText)
    throw new ServiceError(response.status, text)
  }
  return response.json() as Promise<T>
}
