export type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type ClaimantInfo = {
  email: string;
};

export type RelatedPostSummary = {
  id: string;
  category: string;
  description: string;
  location: string;
  status: string;
};

export type Claim = {
  id: string;
  found_post_id: string;
  claimant_id: string;
  claimant: ClaimantInfo;
  related_lost_post_id: string;
  related_lost_post: RelatedPostSummary;
  message: string | null;
  status: ClaimStatus;
  created_at: string;
  updated_at: string;
};

export type ClaimPayload = {
  found_post_id: string;
  related_lost_post_id: string;
  message?: string | null;
};
