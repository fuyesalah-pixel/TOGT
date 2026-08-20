// Central API client for the TOGT backend (togt-api).
//
// - Talks to `${NEXT_PUBLIC_API_URL}/api` (default http://localhost:4000/api)
// - Auth is cookie-based (httpOnly JWT access + refresh tokens set by the API)
// - On 401 the client automatically tries `POST /api/auth/refresh` once and
//   retries the original request.

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = Omit<RequestInit, "body"> & {
  /** JSON body — will be stringified and Content-Type set automatically */
  json?: unknown;
  /** FormData body (for file uploads) — do NOT set Content-Type manually */
  formData?: FormData;
  /** Skip the automatic refresh-and-retry on 401 */
  skipAuthRetry?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function rawFetch<T>(path: string, options: ApiOptions): Promise<T> {
  const { json, formData, headers, ...rest } = options;

  let body: BodyInit | undefined;
  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };

  if (json !== undefined) {
    body = JSON.stringify(json);
    finalHeaders["Content-Type"] = "application/json";
  } else if (formData !== undefined) {
    body = formData;
    // Browser sets multipart boundary automatically
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    credentials: "include",
    ...rest,
    headers: finalHeaders,
    body,
  });

  if (!res.ok) {
    let message = res.statusText;
    let data: unknown;
    try {
      data = await res.json();
      const d = data as { message?: string | string[] };
      if (Array.isArray(d?.message)) message = d.message.join(", ");
      else if (typeof d?.message === "string") message = d.message;
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new ApiError(res.status, message, data);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  try {
    return await rawFetch<T>(path, options);
  } catch (err) {
    if (
      err instanceof ApiError &&
      err.status === 401 &&
      !options.skipAuthRetry &&
      !path.startsWith("/auth/")
    ) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        return rawFetch<T>(path, { ...options, skipAuthRetry: true });
      }
    }
    throw err;
  }
}

/** Convenience helpers */
export const apiGet = <T>(path: string) => api<T>(path, { method: "GET" });
export const apiPost = <T>(path: string, json?: unknown) =>
  api<T>(path, { method: "POST", json });
export const apiPatch = <T>(path: string, json?: unknown) =>
  api<T>(path, { method: "PATCH", json });
export const apiDelete = <T>(path: string) => api<T>(path, { method: "DELETE" });
export const apiUpload = <T>(path: string, formData: FormData, method = "POST") =>
  api<T>(path, { method, formData });
