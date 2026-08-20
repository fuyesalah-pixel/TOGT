import { apiUpload } from "./client";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

export type UploadFolder = "packages" | "reviews" | "chat" | "misc";

/** Upload a single file to Cloudflare R2 via the API. Enforces the 10MB limit client-side. */
export function uploadFile(file: File, folder: UploadFolder): Promise<{ url: string }> {
  if (file.size > MAX_UPLOAD_BYTES) {
    return Promise.reject(new Error("File exceeds the 10MB limit"));
  }
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<{ url: string }>(`/uploads?folder=${encodeURIComponent(folder)}`, formData);
}
