"use client";

import { useEffect, useState } from "react";

import { claimsApi } from "@/lib/api/claims";
import { postsApi } from "@/lib/api/posts";
import type { Post } from "@/types/posts";

export function ClaimForm({
  foundPostId,
  currentUserId,
  onClaimed,
}: {
  foundPostId: string;
  currentUserId: string;
  onClaimed: () => void;
}) {
  const [myLostPosts, setMyLostPosts] = useState<Post[] | null>(null);
  const [selectedLostPostId, setSelectedLostPostId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The posts API doesn't filter by owner server-side yet, so fetch
    // active LOST posts and narrow to this user's own on the client.
    postsApi
      .list({ postType: "LOST", status: "ACTIVE", limit: 100 })
      .then((result) => setMyLostPosts(result.items.filter((post) => post.user_id === currentUserId)))
      .catch(() => setMyLostPosts([]));
  }, [currentUserId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedLostPostId) return;
    setSubmitting(true);
    setError(null);
    try {
      await claimsApi.create({
        found_post_id: foundPostId,
        related_lost_post_id: selectedLostPostId,
        message: message.trim() || null,
      });
      onClaimed();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not submit claim.");
    } finally {
      setSubmitting(false);
    }
  }

  if (myLostPosts === null) {
    return <p className="mt-4 text-sm text-slate-500">Loading your lost posts…</p>;
  }

  if (myLostPosts.length === 0) {
    return (
      <p className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
        You need an active LOST post to claim this item. Post what you lost first, then come back here.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-md border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900">Claim this item</h3>
      <div>
        <label className="block text-sm font-medium text-slate-700">Which of your lost posts is this?</label>
        <select
          required
          value={selectedLostPostId}
          onChange={(event) => setSelectedLostPostId(event.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a post…
          </option>
          {myLostPosts.map((post) => (
            <option key={post.id} value={post.id}>
              {post.category} — {post.description.slice(0, 60)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Message (optional)</label>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          placeholder="Anything that helps the finder confirm it's yours..."
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !selectedLostPostId}
        className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit claim"}
      </button>
    </form>
  );
}
