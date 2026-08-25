const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

// Most error responses are the API's `{ success, message }` JSON shape, but
// some (e.g. the rate limiter's 429) come back as plain text — parsing those
// with response.json() throws a raw SyntaxError instead of a usable message.
async function parseResponseBody(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    if (response.status === 429) {
      throw new ApiError("Too many attempts. Please wait a moment and try again.");
    }
    throw new ApiError("Something went wrong. Please try again.");
  }
}

export async function apiFetch<T>(
  path: string,
  accessToken: string | null,
  init?: RequestInit,
): Promise<T> {
  // FormData bodies (file uploads) need the browser to set their own
  // multipart Content-Type with the correct boundary — forcing JSON here
  // would break the upload.
  const isFormData = init?.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });

  const body = await parseResponseBody(response);

  if (!response.ok || !body.success) {
    throw new ApiError(body.message ?? "Request failed", response.status);
  }

  return body.data as T;
}
