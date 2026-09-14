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
    return <span className="text-sm text-ink/40">…</span>;
  }

  if (!email || !isCuetEmail(email)) {
    return (
      <Link className="bg-blueprint px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-blueprint-deep" href="/login">
        Log in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden font-mono text-xs text-ink/50 sm:inline">{email}</span>
      <button className="border border-line px-3.5 py-1.5 text-sm font-medium text-ink hover:border-ink/40" onClick={handleLogout} type="button">
        Log out
      </button>
    </div>
  );
}
