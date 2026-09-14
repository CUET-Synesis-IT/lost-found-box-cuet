export const POST_CATEGORIES = [
  "Electronics", "Wallet", "Keys", "ID Card", "Documents", "Bag",
  "Books", "Clothing", "Accessories", "Money", "Other",
] as const;

export type PostType = "LOST" | "FOUND";
export type PostStatus = "ACTIVE" | "CLAIM_PENDING" | "RESOLVED" | "ARCHIVED";

export type Post = {
  id: string;
  user_id: string;
  post_type: PostType;
  category: string;
  description: string;
  location: string;
  event_time: string;
  image_url: string | null;
  status: PostStatus;
  created_at: string;
  updated_at: string;
};

export type PostPayload = {
  post_type: PostType;
  category: string;
  description: string;
  location: string;
  event_time: string;
  image_url?: string | null;
};

export type PostList = {
  items: Post[];
  page: number;
  limit: number;
  total: number;
};
