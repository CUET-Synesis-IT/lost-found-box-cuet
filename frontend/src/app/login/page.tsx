"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { isCuetEmail } from "@/lib/auth/email";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const errorMessages: Record<string, string> = {
  oauth_failed: "Google sign-in could not be completed. Please try again.",
  unauthorized_email: "Please sign in with a CUET institutional Google account.",
  auth_required: "You must log in to access this page.",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (errorCode) {
      setError(errorMessages[errorCode] ?? "Sign-in could not be completed.");
    }

    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user && isCuetEmail(data.user.email)) {
        const next = searchParams.get("next");
        const destination = next?.startsWith("/") ? next : "/dashboard";
        router.replace(destination);
      } else if (data.user) {
        await supabase.auth.signOut();
        setError(errorMessages.unauthorized_email);
      }
    });
  }, [router, searchParams]);

  async function handleGoogleLogin() {
    setError(null);
    setIsLoading(true);

    const next = searchParams.get("next");
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (next) {
      callbackUrl.searchParams.set("next", next);
    }

    const { error: signInError } = await getSupabaseBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl.toString() },
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-20">
      <h1 className="text-2xl font-semibold text-ink">Log in</h1>
      <p className="mt-3 text-ink/70">
        Use your CUET Google account ending in @student.cuet.ac.bd or
        @cuet.ac.bd.
      </p>

      {error ? (
        <p className="mt-5 border-l-4 border-flag-rust bg-flag-rust-soft/40 px-3 py-2 text-sm text-ink">
          {error}
        </p>
      ) : null}

      <button
        className="mt-6 w-full bg-blueprint px-4 py-3 font-semibold text-white hover:bg-blueprint-deep disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoading}
        onClick={handleGoogleLogin}
        type="button"
      >
        {isLoading ? "Redirecting to Google…" : "Continue with Google"}
      </button>

      <Link className="mt-6 block text-sm font-medium text-blueprint hover:text-blueprint-deep" href="/">
        Back to home
      </Link>
    </main>
  );
}