import {
  clearAccessToken,
  getAccessToken,
} from './auth-storage';

interface ApiErrorBody {
  statusCode?: number;
  error?: string;
  message?: string;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api'
).replace(/\/$/, '');

function createHeaders(
  options: RequestInit,
): Headers {
  const headers = new Headers(
    options.headers,
  );

  const isFormData =
    typeof FormData !== 'undefined' &&
    options.body instanceof FormData;

  if (
    options.body &&
    !isFormData &&
    !headers.has('Content-Type')
  ) {
    headers.set(
      'Content-Type',
      'application/json',
    );
  }

  const token = getAccessToken();

  if (token) {
    headers.set(
      'Authorization',
      `Bearer ${token}`,
    );
  }

  return headers;
}

async function throwApiError(
  response: Response,
): Promise<never> {
  const errorBody =
    await readErrorBody(response);

  if (response.status === 401) {
    clearAccessToken();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new Event(
          'taskflow:unauthorized',
        ),
      );
    }
  }

  throw new ApiError(
    response.status,
    errorBody.message ??
      `Request failed with status ${response.status}`,
    errorBody.details,
  );
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${apiUrl}${path}`,
    {
      ...options,
      headers: createHeaders(options),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    return throwApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiRequestBlob(
  path: string,
  options: RequestInit = {},
): Promise<Blob> {
  const response = await fetch(
    `${apiUrl}${path}`,
    {
      ...options,
      headers: createHeaders(options),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.blob();
}

async function readErrorBody(
  response: Response,
): Promise<ApiErrorBody> {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return {
      statusCode: response.status,
      message:
        response.statusText ||
        'Request failed',
    };
  }
}