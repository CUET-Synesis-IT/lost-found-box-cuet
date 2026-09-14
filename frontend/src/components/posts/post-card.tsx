import Link from "next/link";

import type { Post } from "@/types/posts";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(new Date(value));
}

export function PostCard({ post }: { post: Post }) {
  return (
    <Link className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-cyan-500 hover:shadow-md" href={`/posts/${post.id}`}>
      {post.image_url ? <img alt="Reported item" className="h-44 w-full object-cover" src={post.image_url} /> : <div className="flex h-44 items-center justify-center bg-slate-100 text-sm text-slate-500">No image provided</div>}
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${post.post_type === "LOST" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{post.post_type}</span>
          <span className="text-xs font-medium text-slate-500">{post.category}</span>
        </div>
        <p className="mt-3 line-clamp-2 font-semibold text-slate-900 group-hover:text-cyan-700">{post.description}</p>
        <p className="mt-2 text-sm text-slate-600">{post.location}</p>
        <p className="mt-1 text-xs text-slate-500">{formatDate(post.event_time)} BST</p>
      </div>
    </Link>
  );
}
