const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Returns the public configuration required by the Supabase browser client.
 * The anon key is safe to expose; authorization is enforced with Supabase RLS.
 */
export function getSupabasePublicConfig(): {
  url: string;
  anonKey: string;
} {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copy frontend/.env.example to frontend/.env.local and configure Supabase.",
    );
  }

  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}
