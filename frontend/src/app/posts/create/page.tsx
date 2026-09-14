"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { PostForm } from "@/components/posts/post-form";
import { postsApi } from "@/lib/api/posts";
import { uploadPostImage } from "@/lib/supabase/storage";

export default function CreatePostPage() {
  const router = useRouter();
  return <main className="mx-auto min-h-screen max-w-2xl px-5 py-10"><Link className="text-sm font-semibold text-cyan-700" href="/posts">Back to all posts</Link><h1 className="mt-5 text-3xl font-bold text-slate-900">Report an item</h1><p className="mt-2 text-slate-600">Provide enough detail to help the CUET community identify it.</p><section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><PostForm submitLabel="Publish post" onSubmit={async (payload, image) => { const post = await postsApi.create(payload); if (image) { const imageUrl = await uploadPostImage(post.id, image); await postsApi.update(post.id, { image_url: imageUrl }); } router.replace(`/posts/${post.id}`); }} /></section></main>;
}
