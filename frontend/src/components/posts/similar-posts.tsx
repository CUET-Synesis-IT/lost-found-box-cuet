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
    postsApi.getSimilar(postId)
      .then((result) => { if (active) setMatches(result); })
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : "Similar posts could not be loaded."); });
    return () => { active = false; };
  }, [postId]);

  const title = postType === "LOST" ? "Similar Found Items" : "Similar Lost Items";
  return <section className="mt-8 border-t border-slate-200 pt-7">
    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
    <p className="mt-1 text-sm text-slate-500">Possible matches based on description, category, location, and time.</p>
    {matches === null && !error ? <p className="py-6 text-sm text-slate-500">Finding similar items…</p> : null}
    {error ? <p className="mt-4 rounded-md bg-slate-100 p-3 text-sm text-slate-600">Similar items are unavailable right now: {error}</p> : null}
    {matches?.length === 0 ? <p className="py-6 text-sm text-slate-500">No similar active items were found.</p> : null}
    {matches?.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {matches.map((match) => <Link className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-500 hover:bg-white" href={`/posts/${match.post_id}`} key={match.post_id}>
        <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-slate-800">{match.category}</span><span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-bold text-cyan-800">{Math.round(match.similarity_score * 100)}% match</span></div>
        <p className="mt-3 text-sm leading-6 text-slate-700">{truncate(match.description)}</p>
        <p className="mt-3 text-xs text-slate-500">{match.location} · {formatDate(match.event_time)} BST</p>
      </Link>)}
    </div> : null}
  </section>;
}
