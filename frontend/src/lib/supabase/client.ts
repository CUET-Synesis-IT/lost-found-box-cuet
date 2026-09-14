"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicConfig } from "./config";

let browserClient: SupabaseClient | undefined;

/**
 * Returns one browser-side Supabase client for Auth, database reads permitted
 * by RLS, and Storage. Session-aware helpers are added in the auth phase.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const { url, anonKey } = getSupabasePublicConfig();
    browserClient = createBrowserClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}
