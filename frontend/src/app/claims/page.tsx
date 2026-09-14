"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { claimsApi } from "@/lib/api/claims";
import type { Claim } from "@/types/claims";

export default function MyClaimsPage() {
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    claimsApi
      .mine()
      .then(setClaims)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Could not load claims."));
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink">My submitted claims</h1>

      {error && <p className="mt-4 border-l-4 border-flag-rust bg-flag-rust-soft/30 p-4 text-sm text-ink">{error}</p>}
      {claims === null && !error && <p className="mt-4 text-sm text-ink/50">Loading…</p>}
      {claims?.length === 0 && <p className="mt-4 text-sm text-ink/50">You haven&apos;t claimed any items yet.</p>}

      <ul className="mt-6 space-y-3">
        {claims?.map((claim) => (
          <li key={claim.id} className="border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-ink/60">{claim.status}</span>
              <Link href={`/posts/${claim.found_post_id}`} className="text-sm font-medium text-blueprint hover:text-blueprint-deep">
                View found post
              </Link>
            </div>
            <p className="mt-2 text-sm text-ink/80">
              Using your &ldquo;{claim.related_lost_post.description}&rdquo; post
            </p>
            {claim.message && <p className="mt-2 text-sm text-ink/70">{claim.message}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
