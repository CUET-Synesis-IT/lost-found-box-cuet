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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link className="text-sm font-semibold text-cyan-700" href="/">
          ← CUET Lost and Found Box
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Log in</h1>
        <p className="mt-3 text-slate-600">
          Use your CUET Google account ending in @student.cuet.ac.bd or @cuet.ac.bd.
        </p>
        {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <button
          className="mt-6 w-full rounded-md bg-cyan-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          onClick={handleGoogleLogin}
          type="button"
        >
          {isLoading ? "Redirecting to Google…" : "Continue with Google"}
        </button>
      </section>
    </main>
  );
}
