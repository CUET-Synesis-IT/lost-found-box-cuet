"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { PostForm } from "@/components/posts/post-form";
import { postsApi } from "@/lib/api/posts";

export default function CreatePostPage() {
  const router = useRouter();
  return <main className="mx-auto min-h-screen max-w-2xl px-5 py-10"><Link className="text-sm font-semibold text-cyan-700" href="/posts">← All posts</Link><h1 className="mt-5 text-3xl font-bold text-slate-900">Report an item</h1><p className="mt-2 text-slate-600">Provide enough detail to help the CUET community identify it.</p><section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><PostForm submitLabel="Publish post" onSubmit={async (payload) => { const post = await postsApi.create(payload); router.replace(`/posts/${post.id}`); }} /></section></main>;
}
