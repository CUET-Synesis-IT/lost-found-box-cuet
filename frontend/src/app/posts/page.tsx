"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PostCard } from "@/components/posts/post-card";
import { postsApi } from "@/lib/api/posts";
import { POST_CATEGORIES, type PostList, type PostType } from "@/types/posts";

export default function PostsPage() {
  const [data, setData] = useState<PostList | null>(null);
  const [postType, setPostType] = useState<PostType | "">("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    postsApi
      .list({ postType: postType || undefined, category: category || undefined, search: search.trim() || undefined, page })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Posts could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [postType, category, search, page, reloadKey]);

  function resetPage() {
    setPage(1);
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Open reports</h1>
          <p className="mt-1 text-ink/70">Every active lost and found post on campus.</p>
        </div>
        <Link className="bg-blueprint px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blueprint-deep" href="/posts/create">
          Report an item
        </Link>
      </div>

      <section className="mt-6 grid gap-3 border-y border-line py-4 md:grid-cols-3">
        <input
          aria-label="Search posts"
          className="border border-line bg-white p-2.5 text-sm placeholder:text-ink/40 focus:border-blueprint focus:outline-none"
          placeholder="Search description or location"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetPage();
          }}
        />
        <select
          aria-label="Filter by report type"
          className="border border-line bg-white p-2.5 text-sm focus:border-blueprint focus:outline-none"
          value={postType}
          onChange={(e) => {
            setPostType(e.target.value as PostType | "");
            resetPage();
          }}
        >
          <option value="">All report types</option>
          <option value="LOST">Lost</option>
          <option value="FOUND">Found</option>
        </select>
        <select
          aria-label="Filter by category"
          className="border border-line bg-white p-2.5 text-sm focus:border-blueprint focus:outline-none"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            resetPage();
          }}
        >
          <option value="">All categories</option>
          {POST_CATEGORIES.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </section>

      {loading ? <p className="py-14 text-center text-ink/60">Loading posts…</p> : null}

      {error ? (
        <div className="mt-8 border-l-4 border-flag-rust bg-flag-rust-soft/30 p-4 text-ink">
          <p>{error}</p>
          <button className="mt-2 font-semibold underline" onClick={() => setReloadKey((value) => value + 1)}>
            Try again
          </button>
        </div>
      ) : null}

      {!loading && !error && data?.items.length === 0 ? (
        <div className="mt-8 border border-dashed border-line p-12 text-center">
          <h2 className="font-semibold text-ink">No posts found</h2>
          <p className="mt-2 text-ink/70">Try a different search or filter, or report an item.</p>
        </div>
      ) : null}

      {!loading && !error && data?.items.length ? (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              className="border border-line px-4 py-2 text-sm font-medium disabled:opacity-40"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </button>
            <span className="font-mono text-xs text-ink/60">Page {data.page}</span>
            <button
              className="border border-line px-4 py-2 text-sm font-medium disabled:opacity-40"
              disabled={page * data.limit >= data.total}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </main>
  );
}
