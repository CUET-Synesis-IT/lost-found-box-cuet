"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PostForm } from "@/components/posts/post-form";
import { postsApi } from "@/lib/api/posts";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadPostImage } from "@/lib/supabase/storage";
import type { Post } from "@/types/posts";

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { let active = true; Promise.all([postsApi.get(params.id), getSupabaseBrowserClient().auth.getUser()]).then(([result, userResult]) => { if (!userResult.data.user || userResult.data.user.id !== result.user_id) throw new Error("You do not have permission to edit this post."); if (active) setPost(result); }).catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : "Post could not be loaded."); }); return () => { active = false; }; }, [params.id]);
  if (error) return <main className="mx-auto max-w-xl px-5 py-16 text-center"><p className="rounded-md bg-red-50 p-4 text-red-700">{error}</p><Link className="mt-5 inline-block font-semibold text-cyan-700" href={`/posts/${params.id}`}>Back to post</Link></main>;
  if (!post) return <main className="py-20 text-center text-slate-600">Loading post...</main>;
  return <main className="mx-auto min-h-screen max-w-2xl px-5 py-10"><Link className="text-sm font-semibold text-cyan-700" href={`/posts/${post.id}`}>Back to post</Link><h1 className="mt-5 text-3xl font-bold text-slate-900">Edit post</h1><section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><PostForm post={post} submitLabel="Save changes" onSubmit={async (payload, image) => { const imageUrl = image ? await uploadPostImage(post.id, image) : post.image_url; const updated = await postsApi.update(post.id, { ...payload, image_url: imageUrl }); router.replace(`/posts/${updated.id}`); }} /></section></main>;
}
