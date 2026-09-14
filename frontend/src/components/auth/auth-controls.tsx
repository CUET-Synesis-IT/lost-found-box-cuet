"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { isCuetEmail } from "@/lib/auth/email";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthControls() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
      setIsLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    setIsLoading(true);
    await getSupabaseBrowserClient().auth.signOut();
    setEmail(null);
    router.replace("/");
    router.refresh();
  }

  if (isLoading) {
    return <span className="text-sm text-slate-500">Checking session…</span>;
  }

  if (!email || !isCuetEmail(email)) {
    return (
      <Link className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white" href="/login">
        Log in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-slate-600 sm:inline">{email}</span>
      <button
        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
        onClick={handleLogout}
        type="button"
      >
        Log out
      </button>
    </div>
  );
}
