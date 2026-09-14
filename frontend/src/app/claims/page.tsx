"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { claimsApi } from "@/lib/api/claims";
import type { Claim } from "@/types/claims";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-slate-200 text-slate-600",
  CANCELLED: "bg-slate-200 text-slate-600",
};

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
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10">
      <h1 className="text-2xl font-bold text-slate-900">My submitted claims</h1>

      {error && <p className="mt-4 rounded-md bg-red-50 p-4 text-red-700">{error}</p>}
      {claims === null && !error && <p className="mt-4 text-slate-500">Loading…</p>}
      {claims?.length === 0 && <p className="mt-4 text-slate-500">You haven&apos;t claimed any items yet.</p>}

      <ul className="mt-6 space-y-3">
        {claims?.map((claim) => (
          <li key={claim.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[claim.status]}`}>
                {claim.status}
              </span>
              <Link href={`/posts/${claim.found_post_id}`} className="text-sm font-semibold text-cyan-700">
                View found post →
              </Link>
            </div>
            {claim.message && <p className="mt-2 text-sm text-slate-700">{claim.message}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
