import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function getApiBaseUrl(): string {
  if (!apiBaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL in frontend/.env.local.");
  }
  return apiBaseUrl.replace(/\/$/, "");
}

async function getAccessToken(): Promise<string> {
  const { data, error } = await getSupabaseBrowserClient().auth.getSession();
  if (error || !data.session?.access_token) {
    throw new ApiError(401, "You must log in to perform this action.");
  }
  return data.session.access_token;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = false,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (requiresAuth) {
    headers.set("Authorization", `Bearer ${await getAccessToken()}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null;
    throw new ApiError(response.status, body?.detail ?? "The request could not be completed.");
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}
