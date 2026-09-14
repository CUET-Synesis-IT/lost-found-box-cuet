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

  useEffect(() => {
    let active = true;
    Promise.all([postsApi.get(params.id), getSupabaseBrowserClient().auth.getUser()])
      .then(([result, userResult]) => {
        if (!userResult.data.user || userResult.data.user.id !== result.user_id) {
          throw new Error("You do not have permission to edit this post.");
        }
        if (active) setPost(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Post could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  if (error) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="border-l-4 border-flag-rust bg-flag-rust-soft/30 p-4 text-ink">{error}</p>
        <Link className="mt-5 inline-block font-medium text-blueprint hover:text-blueprint-deep" href={`/posts/${params.id}`}>
          Back to post
        </Link>
      </main>
    );
  }

  if (!post) return <main className="py-20 text-center text-ink/60">Loading post...</main>;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <Link className="text-sm font-medium text-blueprint hover:text-blueprint-deep" href={`/posts/${post.id}`}>
        Back to post
      </Link>
      <h1 className="mt-5 text-2xl font-semibold text-ink">Edit post</h1>
      <section className="mt-8 border border-line bg-white p-6">
        <PostForm
          post={post}
          submitLabel="Save changes"
          onSubmit={async (payload, image) => {
            const imageUrl = image ? await uploadPostImage(post.id, image) : post.image_url;
            const updated = await postsApi.update(post.id, { ...payload, image_url: imageUrl });
            router.replace(`/posts/${updated.id}`);
          }}
        />
      </section>
    </main>
  );
}
