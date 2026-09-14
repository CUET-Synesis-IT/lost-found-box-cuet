import { apiRequest } from "./client";
import type { Post, PostList, PostPayload, PostStatus, PostType, SimilarPost } from "@/types/posts";

type PostFilters = {
  postType?: PostType;
  category?: string;
  status?: PostStatus;
  search?: string;
  page?: number;
  limit?: number;
};

export const postsApi = {
  list(filters: PostFilters = {}) {
    const params = new URLSearchParams();
    if (filters.postType) params.set("post_type", filters.postType);
    if (filters.category) params.set("category", filters.category);
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    params.set("page", String(filters.page ?? 1));
    params.set("limit", String(filters.limit ?? 12));
    return apiRequest<PostList>(`/api/v1/posts?${params.toString()}`);
  },
  mine() {
    return apiRequest<Post[]>("/api/v1/posts/mine", {}, true);
  },
  get(postId: string) {
    return apiRequest<Post>(`/api/v1/posts/${postId}`);
  },
  getSimilar(postId: string) {
    return apiRequest<SimilarPost[]>(`/api/v1/posts/${postId}/similar?limit=5`);
  },
  create(payload: PostPayload) {
    return apiRequest<Post>("/api/v1/posts", { method: "POST", body: JSON.stringify(payload) }, true);
  },
  update(postId: string, payload: Partial<PostPayload>) {
    return apiRequest<Post>(`/api/v1/posts/${postId}`, { method: "PUT", body: JSON.stringify(payload) }, true);
  },
  remove(postId: string) {
    return apiRequest<void>(`/api/v1/posts/${postId}`, { method: "DELETE" }, true);
  },
};
