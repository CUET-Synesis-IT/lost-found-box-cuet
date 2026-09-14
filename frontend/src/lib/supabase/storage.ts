import { LOST_FOUND_IMAGES_BUCKET } from "./constants";
import { getSupabaseBrowserClient } from "./client";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validatePostImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return "Use a JPEG, PNG, or WebP image.";
  if (file.size > MAX_IMAGE_BYTES) return "Image size must be 5 MB or less.";
  return null;
}

function extensionFor(file: File): string {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  return "webp";
}

/** Uploads a validated image below the authenticated owner's Storage path. */
export async function uploadPostImage(postId: string, file: File): Promise<string> {
  const validationError = validatePostImage(file);
  if (validationError) throw new Error(validationError);
  const supabase = getSupabaseBrowserClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("You must log in before uploading an image.");
  const path = `posts/${userData.user.id}/${postId}/${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error: uploadError } = await supabase.storage.from(LOST_FOUND_IMAGES_BUCKET).upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: false });
  if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
  return supabase.storage.from(LOST_FOUND_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}
