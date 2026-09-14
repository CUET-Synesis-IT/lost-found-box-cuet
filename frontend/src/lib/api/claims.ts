import { apiRequest } from "./client";
import type { Claim, ClaimPayload } from "@/types/claims";

export const claimsApi = {
  create(payload: ClaimPayload) {
    return apiRequest<Claim>("/api/v1/claims", { method: "POST", body: JSON.stringify(payload) }, true);
  },
  mine() {
    return apiRequest<Claim[]>("/api/v1/claims/my", {}, true);
  },
  forPost(postId: string) {
    return apiRequest<Claim[]>(`/api/v1/posts/${postId}/claims`, {}, true);
  },
  approve(claimId: string) {
    return apiRequest<Claim>(`/api/v1/claims/${claimId}/approve`, { method: "POST" }, true);
  },
  reject(claimId: string) {
    return apiRequest<Claim>(`/api/v1/claims/${claimId}/reject`, { method: "POST" }, true);
  },
};
