"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { PostForm } from "@/components/posts/post-form";
import { postsApi } from "@/lib/api/posts";
import { uploadPostImage } from "@/lib/supabase/storage";
import { useToast } from "@/components/toast";

export default function CreatePostPage() {
  const router = useRouter();
  const { showToast } = useToast();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <Link className="text-sm font-medium text-blueprint hover:text-blueprint-deep" href="/posts">
        Back to all posts
      </Link>
      <h1 className="mt-5 text-2xl font-semibold text-ink">Report an item</h1>
      <p className="mt-2 text-ink/70">Provide enough detail to help the CUET community identify it.</p>
      <section className="mt-8 border border-line bg-white p-6">
        <PostForm
          submitLabel="Publish post"
          onSubmit={async (payload, image) => {
            try {
              const post = await postsApi.create(payload);
              if (image) {
                const imageUrl = await uploadPostImage(post.id, image);
                await postsApi.update(post.id, { image_url: imageUrl });
              }
              showToast("Post published successfully!", "success");
              router.replace(`/posts/${post.id}`);
            } catch (err) {
              showToast(err instanceof Error ? err.message : "The post could not be saved.", "error");
            }
          }}
        />
      </section>
    </main>
  );
}
