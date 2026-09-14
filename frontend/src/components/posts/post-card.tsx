import Link from "next/link";

import type { Post } from "@/types/posts";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(new Date(value));
}

export function PostCard({ post }: { post: Post }) {
  const accent = post.post_type === "LOST" ? "border-flag-rust" : "border-flag-amber";

  return (
    <Link
      className={`group block border-t-4 ${accent} border-x border-b border-line bg-white transition hover:-translate-y-0.5 hover:shadow-sm`}
      href={`/posts/${post.id}`}
    >
      {post.image_url ? (
        <img alt="Reported item" className="h-40 w-full object-cover" src={post.image_url} />
      ) : (
        <div className="flex h-40 items-center justify-center bg-paper font-mono text-xs text-ink/40">
          no image
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs font-medium text-ink/60">{post.post_type}</span>
          <span className="text-xs text-ink/50">{post.category}</span>
        </div>
        <p className="mt-2 line-clamp-2 font-medium text-ink group-hover:text-blueprint">{post.description}</p>
        <p className="mt-2 text-sm text-ink/60">{post.location}</p>
        <p className="mt-1 font-mono text-xs text-ink/40">{formatDate(post.event_time)}</p>
      </div>
    </Link>
  );
}
