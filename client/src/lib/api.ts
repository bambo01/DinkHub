const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

// Matches AuthContext's STORAGE_KEY — duplicated as a literal rather than
// imported, since importing a "use client" context module here would pull
// React context machinery into a plain fetch helper for no reason.
const AUTH_STORAGE_KEY = "dinkhub-auth";

// A 401 here only ever means requireAuth rejected the token — missing,
// malformed, or expired. There's no legitimate non-session reason for it,
// so treat every one as "you're logged out": clear the stale session and
// send the user home rather than leaving them on a page that'll just keep
// failing the same way on every subsequent request.
function handleUnauthorized() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore inaccessible storage — the redirect below still gets them out.
  }
  // A hard navigation, not router.push() — this plain helper has no
  // component tree to call useRouter() from, and a full reload guarantees
  // every bit of in-memory app state gets wiped along with the session,
  // not just the URL.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = "/";
}

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
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new ApiError(body.message ?? "Request failed", response.status);
  }

  return body.data as T;
}
