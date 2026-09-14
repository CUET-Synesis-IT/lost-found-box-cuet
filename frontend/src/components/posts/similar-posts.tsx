"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { postsApi } from "@/lib/api/posts";
import type { PostType, SimilarPost } from "@/types/posts";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
}

function truncate(value: string, length = 115) {
  return value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;
}

export function SimilarPosts({ postId, postType }: { postId: string; postType: PostType }) {
  const [matches, setMatches] = useState<SimilarPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    postsApi
      .getSimilar(postId)
      .then((result) => {
        if (active) setMatches(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Similar posts could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [postId]);

  const title = postType === "LOST" ? "Similar found items" : "Similar lost items";

  return (
    <section className="mt-8 border-t border-line pt-7">
      <h2 className="font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink/60">Possible matches based on description, category, location, and time.</p>

      {matches === null && !error ? <p className="py-6 text-sm text-ink/50">Finding similar items…</p> : null}
      {error ? <p className="mt-4 bg-paper p-3 text-sm text-ink/60">Similar items are unavailable right now: {error}</p> : null}
      {matches?.length === 0 ? <p className="py-6 text-sm text-ink/50">No similar active items were found.</p> : null}

      {matches?.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {matches.map((match) => (
            <Link className="border border-line bg-paper p-4 transition hover:border-blueprint hover:bg-white" href={`/posts/${match.post_id}`} key={match.post_id}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-ink">{match.category}</span>
                <span className="font-mono text-xs font-medium text-blueprint">{Math.round(match.similarity_score * 100)}% match</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/70">{truncate(match.description)}</p>
              <p className="mt-3 text-xs text-ink/50">{match.location}</p>
              <p className="font-mono text-xs text-ink/40">{formatDate(match.event_time)}</p>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
