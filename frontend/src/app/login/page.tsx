"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { isCuetEmail } from "@/lib/auth/email";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const errorMessages: Record<string, string> = {
  oauth_failed: "Google sign-in could not be completed. Please try again.",
  unauthorized_email: "Please sign in with a CUET institutional Google account.",
};

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const errorCode = new URLSearchParams(window.location.search).get("error");
    if (errorCode) {
      setError(errorMessages[errorCode] ?? "Sign-in could not be completed.");
    }

    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user && isCuetEmail(data.user.email)) {
        router.replace("/dashboard");
      } else if (data.user) {
        await supabase.auth.signOut();
        setError(errorMessages.unauthorized_email);
      }
    });
  }, [router]);

  async function handleGoogleLogin() {
    setError(null);
    setIsLoading(true);

    const redirectTo = new URL("/auth/callback", window.location.origin).toString();
    const { error: signInError } = await getSupabaseBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
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
