"use client";

import { useEffect, useState } from "react";

import { claimsApi } from "@/lib/api/claims";
import type { Claim } from "@/types/claims";

export function ReceivedClaims({
  foundPostId,
  refreshKey,
  onDecision,
}: {
  foundPostId: string;
  refreshKey: number;
  onDecision?: () => void;
}) {
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
    if (action === "approve") {
      const confirmed = window.confirm(
        "Approve this claim? This will mark both your found post and their lost post as resolved. This cannot be undone."
      );
      if (!confirmed) return;
    }

    setActingOn(claimId);
    setError(null);
    try {
      await (action === "approve" ? claimsApi.approve(claimId) : claimsApi.reject(claimId));
      reload();
      onDecision?.();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Action failed.");
    } finally {
      setActingOn(null);
    }
  }

  if (claims === null) return <p className="mt-4 text-sm text-ink/50">Loading claims…</p>;
  if (error) return <p className="mt-4 text-sm text-flag-rust">{error}</p>;
  if (claims.length === 0) return <p className="mt-4 text-sm text-ink/50">No claims yet.</p>;

  return (
    <ul className="mt-4 space-y-3">
      {claims.map((claim) => (
        <li key={claim.id} className="border border-line p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-medium text-ink/60">{claim.status}</span>
            <span className="text-xs text-ink/40">
              {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(claim.created_at))}
            </span>
          </div>

          <p className="mt-2 text-sm text-ink/80">
            Claimed by <span className="font-medium text-ink">{claim.claimant.email}</span>
          </p>

          <div className="mt-2 bg-paper p-3">
            <p className="text-xs text-ink/50">Their lost post</p>
            <p className="mt-1 text-sm font-medium text-ink">{claim.related_lost_post.category}</p>
            <p className="text-sm text-ink/70">{claim.related_lost_post.description}</p>
            <p className="mt-1 text-xs text-ink/50">{claim.related_lost_post.location}</p>
          </div>

          {claim.message && (
            <div className="mt-2">
              <p className="text-xs text-ink/50">Message</p>
              <p className="mt-1 text-sm text-ink/80">{claim.message}</p>
            </div>
          )}

          {claim.status === "PENDING" && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => act(claim.id, "approve")}
                disabled={actingOn === claim.id}
                className="bg-blueprint px-3 py-1.5 text-sm font-semibold text-white hover:bg-blueprint-deep disabled:opacity-50"
              >
                {actingOn === claim.id ? "Working…" : "Approve"}
              </button>
              <button
                onClick={() => act(claim.id, "reject")}
                disabled={actingOn === claim.id}
                className="border border-flag-rust px-3 py-1.5 text-sm font-semibold text-flag-rust disabled:opacity-50"
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
