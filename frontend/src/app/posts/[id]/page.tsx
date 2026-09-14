"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { postsApi } from "@/lib/api/posts";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Post } from "@/types/posts";
import { SimilarPosts } from "@/components/posts/similar-posts";
import { ClaimForm } from "@/components/claims/claim-form";
import { ReceivedClaims } from "@/components/claims/received-claims";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
}

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [claimsRefreshKey, setClaimsRefreshKey] = useState(0);
  const [justClaimed, setJustClaimed] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([postsApi.get(params.id), getSupabaseBrowserClient().auth.getUser()])
      .then(([result, userResult]) => {
        if (active) {
          setPost(result);
          setCurrentUserId(userResult.data.user?.id ?? null);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Post could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  async function deletePost() {
    if (!post || !window.confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await postsApi.remove(post.id);
      router.replace("/posts");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Post could not be deleted.");
      setDeleting(false);
    }
  }

  if (loading) return <main className="py-20 text-center text-ink/60">Loading post…</main>;
  if (error || !post) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="border-l-4 border-flag-rust bg-flag-rust-soft/30 p-4 text-ink">{error ?? "Post not found."}</p>
        <Link className="mt-5 inline-block font-medium text-blueprint hover:text-blueprint-deep" href="/posts">
          Back to posts
        </Link>
      </main>
    );
  }

  const isOwner = currentUserId === post.user_id;
  const canClaim = !isOwner && currentUserId && post.post_type === "FOUND" && (post.status === "ACTIVE" || post.status === "CLAIM_PENDING");
  const accent = post.post_type === "LOST" ? "border-flag-rust" : "border-flag-amber";

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link className="text-sm font-medium text-blueprint hover:text-blueprint-deep" href="/posts">
        ← All posts
      </Link>
      <article className={`mt-5 border-t-4 ${accent} border-x border-b border-line bg-white`}>
        {post.image_url ? <img alt="Reported item" className="max-h-96 w-full object-cover" src={post.image_url} /> : null}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-sm font-medium text-ink/60">{post.post_type}</span>
            <span className="text-sm text-ink/50">{post.category}</span>
          </div>

          <p className="mt-6 whitespace-pre-wrap text-lg leading-8 text-ink">{post.description}</p>

          <dl className="mt-8 grid gap-5 border-t border-line pt-6 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-ink/50">Location</dt>
              <dd className="mt-1 text-ink">{post.location}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink/50">Lost/found time</dt>
              <dd className="mt-1 text-ink">{formatDate(post.event_time)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink/50">Status</dt>
              <dd className="mt-1 text-ink">{post.status.replace("_", " ")}</dd>
            </div>
          </dl>

          {isOwner ? (
            <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
              <Link className="bg-blueprint px-4 py-2 text-sm font-semibold text-white hover:bg-blueprint-deep" href={`/posts/${post.id}/edit`}>
                Edit post
              </Link>
              <button
                className="border border-flag-rust px-4 py-2 text-sm font-semibold text-flag-rust disabled:opacity-60"
                disabled={deleting}
                onClick={deletePost}
              >
                {deleting ? "Deleting…" : "Delete post"}
              </button>
            </div>
          ) : null}

          {isOwner && post.post_type === "FOUND" ? (
            <div className="mt-8 border-t border-line pt-6">
              <h2 className="font-semibold text-ink">Claims received</h2>
              <ReceivedClaims
                foundPostId={post.id}
                refreshKey={claimsRefreshKey}
                onDecision={() => {
                  postsApi.get(post.id).then(setPost);
                }}
              />
            </div>
          ) : null}

          {canClaim && !justClaimed ? (
            <div className="border-t border-line pt-6">
              <ClaimForm
                foundPostId={post.id}
                currentUserId={currentUserId}
                onClaimed={() => {
                  setJustClaimed(true);
                  setClaimsRefreshKey((key) => key + 1);
                }}
              />
            </div>
          ) : null}
          {canClaim && justClaimed ? (
            <p className="mt-4 border-l-4 border-flag-amber bg-flag-amber-soft/30 p-4 text-sm text-ink">
              Claim submitted. The finder will review it -{" "}
              <Link href="/claims" className="font-semibold underline">
                view your claims
              </Link>
              .
            </p>
          ) : null}

          <SimilarPosts postId={post.id} postType={post.post_type} />
        </div>
      </article>
    </main>
  );
}
