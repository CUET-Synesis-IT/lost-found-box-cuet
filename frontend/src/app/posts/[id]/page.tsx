"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { postsApi } from "@/lib/api/posts";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Post } from "@/types/posts";

function formatDate(value: string) { return new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(new Date(value)); }

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { let active = true; Promise.all([postsApi.get(params.id), getSupabaseBrowserClient().auth.getUser()]).then(([result, userResult]) => { if (active) { setPost(result); setCurrentUserId(userResult.data.user?.id ?? null); } }).catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : "Post could not be loaded."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [params.id]);
  async function deletePost() { if (!post || !window.confirm("Delete this post? This cannot be undone.")) return; setDeleting(true); try { await postsApi.remove(post.id); router.replace("/posts"); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Post could not be deleted."); setDeleting(false); } }
  if (loading) return <main className="py-20 text-center text-slate-600">Loading post…</main>;
  if (error || !post) return <main className="mx-auto max-w-xl px-5 py-16 text-center"><p className="rounded-md bg-red-50 p-4 text-red-700">{error ?? "Post not found."}</p><Link className="mt-5 inline-block font-semibold text-cyan-700" href="/posts">Back to posts</Link></main>;
  const isOwner = currentUserId === post.user_id;
  return <main className="mx-auto min-h-screen max-w-4xl px-5 py-10"><Link className="text-sm font-semibold text-cyan-700" href="/posts">← All posts</Link><article className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">{post.image_url ? <img alt="Reported item" className="max-h-96 w-full object-cover" src={post.image_url} /> : null}<div className="p-6 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><span className={`rounded-full px-3 py-1 text-sm font-bold ${post.post_type === "LOST" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{post.post_type}</span><span className="text-sm font-medium text-slate-600">{post.category}</span></div><p className="mt-6 whitespace-pre-wrap text-lg leading-8 text-slate-800">{post.description}</p><dl className="mt-8 grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Location</dt><dd className="mt-1 text-slate-900">{post.location}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Lost/found time</dt><dd className="mt-1 text-slate-900">{formatDate(post.event_time)} BST</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Status</dt><dd className="mt-1 text-slate-900">{post.status.replace("_", " ")}</dd></div></dl>{isOwner ? <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-6"><Link className="rounded-md bg-cyan-700 px-4 py-2 font-semibold text-white" href={`/posts/${post.id}/edit`}>Edit post</Link><button className="rounded-md border border-red-300 px-4 py-2 font-semibold text-red-700 disabled:opacity-60" disabled={deleting} onClick={deletePost}>{deleting ? "Deleting…" : "Delete post"}</button></div> : null}</div></article></main>;
}
