"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { claimsApi } from "@/lib/api/claims";
import { postsApi } from "@/lib/api/posts";
import type { Claim } from "@/types/claims";
import type { Post } from "@/types/posts";

function PostRow({ post }: { post: Post }) {
  const accent = post.post_type === "LOST" ? "border-flag-rust" : "border-flag-amber";
  return (
    <li>
      <Link href={`/posts/${post.id}`} className={`flex items-center justify-between gap-3 border-l-4 ${accent} border-y border-r border-line bg-white px-4 py-3 text-sm hover:bg-paper`}>
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{post.description}</p>
          <p className="text-xs text-ink/50">
            {post.category} · {post.location}
          </p>
        </div>
        <span className="shrink-0 font-mono text-xs text-ink/50">{post.status.replace("_", " ")}</span>
      </Link>
    </li>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-ink/70">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ClaimBadge({ status }: { status: string }) {
  return <span className="font-mono text-xs font-medium text-ink/60">{status}</span>;
}

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);

  const [myClaims, setMyClaims] = useState<Claim[] | null>(null);
  const [myClaimsError, setMyClaimsError] = useState<string | null>(null);

  const [receivedClaims, setReceivedClaims] = useState<Claim[] | null>(null);
  const [receivedError, setReceivedError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  function loadPostsAndReceivedClaims() {
    postsApi
      .mine()
      .then((allPosts) => {
        setPosts(allPosts);
        const myFoundPosts = allPosts.filter((post) => post.post_type === "FOUND");
        return Promise.all(myFoundPosts.map((post) => claimsApi.forPost(post.id).catch(() => [] as Claim[])));
      })
      .then((claimLists) => setReceivedClaims(claimLists.flat()))
      .catch((requestError) => {
        setPostsError(requestError instanceof Error ? requestError.message : "Could not load your posts.");
        setReceivedError("Could not load received claims.");
      });
  }

  useEffect(() => {
    loadPostsAndReceivedClaims();
    claimsApi
      .mine()
      .then(setMyClaims)
      .catch((requestError) => setMyClaimsError(requestError instanceof Error ? requestError.message : "Could not load your claims."));
  }, []);

  async function actOnClaim(claimId: string, action: "approve" | "reject") {
    if (action === "approve") {
      const confirmed = window.confirm("Approve this claim? Both posts will be marked resolved. This cannot be undone.");
      if (!confirmed) return;
    }
    setActingOn(claimId);
    try {
      await (action === "approve" ? claimsApi.approve(claimId) : claimsApi.reject(claimId));
      loadPostsAndReceivedClaims();
    } catch (requestError) {
      setReceivedError(requestError instanceof Error ? requestError.message : "Action failed.");
    } finally {
      setActingOn(null);
    }
  }

  const lostPosts = posts?.filter((p) => p.post_type === "LOST" && p.status !== "RESOLVED") ?? [];
  const foundPosts = posts?.filter((p) => p.post_type === "FOUND" && p.status !== "RESOLVED") ?? [];
  const resolvedPosts = posts?.filter((p) => p.status === "RESOLVED") ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/posts" className="bg-blueprint px-4 py-2 text-sm font-semibold text-white hover:bg-blueprint-deep">
          Browse posts
        </Link>
        <Link href="/posts/create" className="border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-ink/40">
          Report an item
        </Link>
      </div>

      {postsError && <p className="mt-6 border-l-4 border-flag-rust bg-flag-rust-soft/30 p-4 text-sm text-ink">{postsError}</p>}
      {posts === null && !postsError && <p className="mt-6 text-sm text-ink/50">Loading your posts…</p>}

      {posts !== null && (
        <>
          <Section title={`My lost posts (${lostPosts.length})`}>
            {lostPosts.length === 0 ? <p className="text-sm text-ink/50">No active lost posts.</p> : <ul className="space-y-2">{lostPosts.map((post) => <PostRow key={post.id} post={post} />)}</ul>}
          </Section>

          <Section title={`My found posts (${foundPosts.length})`}>
            {foundPosts.length === 0 ? <p className="text-sm text-ink/50">No active found posts.</p> : <ul className="space-y-2">{foundPosts.map((post) => <PostRow key={post.id} post={post} />)}</ul>}
          </Section>

          <Section title={`Resolved posts (${resolvedPosts.length})`}>
            {resolvedPosts.length === 0 ? <p className="text-sm text-ink/50">Nothing resolved yet.</p> : <ul className="space-y-2">{resolvedPosts.map((post) => <PostRow key={post.id} post={post} />)}</ul>}
          </Section>
        </>
      )}

      <Section title={`My submitted claims (${myClaims?.length ?? "…"})`}>
        {myClaimsError && <p className="text-sm text-flag-rust">{myClaimsError}</p>}
        {myClaims === null && !myClaimsError && <p className="text-sm text-ink/50">Loading…</p>}
        {myClaims?.length === 0 && <p className="text-sm text-ink/50">You haven&apos;t claimed any items yet.</p>}
        {myClaims && myClaims.length > 0 && (
          <ul className="space-y-2">
            {myClaims.map((claim) => (
              <li key={claim.id}>
                <Link href={`/posts/${claim.found_post_id}`} className="flex items-center justify-between gap-3 border border-line bg-white px-4 py-3 text-sm hover:bg-paper">
                  <span className="min-w-0 truncate text-ink/80">Using your &ldquo;{claim.related_lost_post.description}&rdquo; post</span>
                  <ClaimBadge status={claim.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Claims received (${receivedClaims?.length ?? "…"})`}>
        {receivedError && <p className="text-sm text-flag-rust">{receivedError}</p>}
        {receivedClaims === null && !receivedError && <p className="text-sm text-ink/50">Loading…</p>}
        {receivedClaims?.length === 0 && <p className="text-sm text-ink/50">No claims on your found posts yet.</p>}
        {receivedClaims && receivedClaims.length > 0 && (
          <ul className="space-y-3">
            {receivedClaims.map((claim) => (
              <li key={claim.id} className="border border-line p-4">
                <div className="flex items-center justify-between">
                  <ClaimBadge status={claim.status} />
                  <Link href={`/posts/${claim.found_post_id}`} className="text-xs font-semibold text-blueprint hover:text-blueprint-deep">
                    View post
                  </Link>
                </div>
                <p className="mt-2 text-sm text-ink/80">
                  <span className="font-medium text-ink">{claim.claimant.email}</span> claims this matches their &ldquo;{claim.related_lost_post.description}&rdquo; post
                </p>
                {claim.status === "PENDING" && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => actOnClaim(claim.id, "approve")} disabled={actingOn === claim.id} className="bg-blueprint px-3 py-1.5 text-sm font-semibold text-white hover:bg-blueprint-deep disabled:opacity-50">
                      {actingOn === claim.id ? "Working…" : "Approve"}
                    </button>
                    <button onClick={() => actOnClaim(claim.id, "reject")} disabled={actingOn === claim.id} className="border border-flag-rust px-3 py-1.5 text-sm font-semibold text-flag-rust disabled:opacity-50">
                      {actingOn === claim.id ? "Working…" : "Reject"}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </main>
  );
}
