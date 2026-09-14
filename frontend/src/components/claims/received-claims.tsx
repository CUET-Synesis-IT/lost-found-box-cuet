"use client";

import { useEffect, useState } from "react";

import { claimsApi } from "@/lib/api/claims";
import type { Claim } from "@/types/claims";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-slate-200 text-slate-600",
  CANCELLED: "bg-slate-200 text-slate-600",
};

export function ReceivedClaims({ foundPostId, refreshKey }: { foundPostId: string; refreshKey: number }) {
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    claimsApi
      .forPost(foundPostId)
      .then(setClaims)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Could not load claims."));
  }

  useEffect(reload, [foundPostId, refreshKey]);

  async function act(claimId: string, action: "approve" | "reject") {
    setActingOn(claimId);
    setError(null);
    try {
      await (action === "approve" ? claimsApi.approve(claimId) : claimsApi.reject(claimId));
      reload();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Action failed.");
    } finally {
      setActingOn(null);
    }
  }

  if (claims === null) return <p className="mt-4 text-sm text-slate-500">Loading claims…</p>;
  if (error) return <p className="mt-4 text-sm text-red-600">{error}</p>;
  if (claims.length === 0) return <p className="mt-4 text-sm text-slate-500">No claims yet.</p>;

  return (
    <ul className="mt-4 space-y-3">
      {claims.map((claim) => (
        <li key={claim.id} className="rounded-md border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[claim.status]}`}>
              {claim.status}
            </span>
            <span className="text-xs text-slate-400">
              {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
                new Date(claim.created_at)
              )}
            </span>
          </div>
          {claim.message && <p className="mt-2 text-sm text-slate-700">{claim.message}</p>}

          {claim.status === "PENDING" && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => act(claim.id, "approve")}
                disabled={actingOn === claim.id}
                className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {actingOn === claim.id ? "Working…" : "Approve"}
              </button>
              <button
                onClick={() => act(claim.id, "reject")}
                disabled={actingOn === claim.id}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700 disabled:opacity-50"
              >
                {actingOn === claim.id ? "Working…" : "Reject"}
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
