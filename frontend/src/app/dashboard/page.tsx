"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthControls } from "@/components/auth/auth-controls";
import { claimsApi } from "@/lib/api/claims";
import { postsApi } from "@/lib/api/posts";
import type { Claim } from "@/types/claims";
import type { Post } from "@/types/posts";

function PostRow({ post }: { post: Post }) {
  return (
    <li>
      <Link
        href={`/posts/${post.id}`}
        className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-4 py-3 text-sm hover:border-cyan-500"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{post.description}</p>
          <p className="text-xs text-slate-500">
            {post.category} • {post.location}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          {post.status.replace("_", " ")}
        </span>
      </Link>
    </li>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [myClaims, setMyClaims] = useState<Claim[] | null>(null);
  const [receivedPendingCount, setReceivedPendingCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    postsApi
      .mine()
      .then((allPosts) => {
        setPosts(allPosts);
        // "Claims received" spans every FOUND post I own - fetch each
        // post's claims and count how many are still PENDING.
        const myFoundPosts = allPosts.filter((post) => post.post_type === "FOUND");
        Promise.all(myFoundPosts.map((post) => claimsApi.forPost(post.id).catch(() => [])))
          .then((claimLists) => {
            const pending = claimLists.flat().filter((claim) => claim.status === "PENDING");
            setReceivedPendingCount(pending.length);
          })
          .catch(() => setReceivedPendingCount(0));
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Could not load your posts."));

    claimsApi.mine().then(setMyClaims).catch(() => setMyClaims([]));
  }, []);

  const lostPosts = posts?.filter((p) => p.post_type === "LOST" && p.status !== "RESOLVED") ?? [];
  const foundPosts = posts?.filter((p) => p.post_type === "FOUND" && p.status !== "RESOLVED") ?? [];
  const resolvedPosts = posts?.filter((p) => p.status === "RESOLVED") ?? [];
  const pendingClaimsSubmitted = myClaims?.filter((c) => c.status === "PENDING").length ?? 0;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
        <AuthControls />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/posts" className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">
          Browse posts
        </Link>
        <Link href="/posts/create" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
          Report an item
        </Link>
      </div>

      {error && <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {posts === null && !error && <p className="mt-6 text-sm text-slate-500">Loading your dashboard…</p>}

      {posts !== null && (
        <>
          <Section title={`My lost posts (${lostPosts.length})`}>
            {lostPosts.length === 0 ? (
              <p className="text-sm text-slate-500">No active lost posts.</p>
            ) : (
              <ul className="space-y-2">
                {lostPosts.map((post) => (
                  <PostRow key={post.id} post={post} />
                ))}
              </ul>
            )}
          </Section>

          <Section title={`My found posts (${foundPosts.length})`}>
            {foundPosts.length === 0 ? (
              <p className="text-sm text-slate-500">No active found posts.</p>
            ) : (
              <ul className="space-y-2">
                {foundPosts.map((post) => (
                  <PostRow key={post.id} post={post} />
                ))}
              </ul>
            )}
          </Section>

          <Section title={`My resolved posts (${resolvedPosts.length})`}>
            {resolvedPosts.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing resolved yet.</p>
            ) : (
              <ul className="space-y-2">
                {resolvedPosts.map((post) => (
                  <PostRow key={post.id} post={post} />
                ))}
              </ul>
            )}
          </Section>

          <Section title="Claims">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/claims"
                className="flex-1 min-w-[220px] rounded-md border border-slate-200 px-4 py-3 hover:border-cyan-500"
              >
                <p className="text-sm text-slate-500">My submitted claims</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {myClaims?.length ?? "…"}
                  {pendingClaimsSubmitted > 0 && (
                    <span className="ml-2 text-sm font-normal text-amber-700">{pendingClaimsSubmitted} pending</span>
                  )}
                </p>
              </Link>

              <div className="flex-1 min-w-[220px] rounded-md border border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">Claims received (pending review)</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {receivedPendingCount === null ? "…" : receivedPendingCount}
                </p>
                {receivedPendingCount !== null && receivedPendingCount > 0 && (
                  <p className="mt-1 text-xs text-slate-500">Open one of your found posts above to review.</p>
                )}
              </div>
            </div>
          </Section>
        </>
      )}
    </main>
  );
}
