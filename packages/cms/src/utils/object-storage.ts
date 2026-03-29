/**
 * Object storage — Cloudinary implementation.
 *
 * Alternative providers (not implemented, kept for reference):
 *   - Cloudflare R2: use @aws-sdk/client-s3 with endpoint = R2 endpoint URL
 *   - Supabase Storage: use @supabase/supabase-js supabase.storage.from(bucket)
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */
import { v2 as cloudinary } from "cloudinary";
import path from "path";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export function validatePhotoFile(file: UploadedFile): void {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error("Photo must be a JPG, PNG, or WebP image");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Photo must be smaller than 5 MB");
  }
}

export async function uploadPhoto(
  file: UploadedFile,
  folder: string,
  entityId: string,
): Promise<string> {
  validatePhotoFile(file);

  const ext =
    path.extname(file.originalname).toLowerCase().replace(".", "") || "jpg";
  const publicId = `${folder}/${entityId}/photo`;

  const cld = getCloudinary();
  const result = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      cld.uploader
        .upload_stream(
          {
            public_id: publicId,
            resource_type: "image",
            format: ext,
            overwrite: true,
          },
          (err, res) => {
            if (err || !res)
              return reject(err ?? new Error("Cloudinary upload failed"));
            resolve(res as { secure_url: string });
          },
        )
        .end(file.buffer);
    },
  );

  return result.secure_url;
}

export async function uploadPlayerPhoto(
  file: UploadedFile,
  playerId: string,
): Promise<string> {
  return uploadPhoto(file, "players", playerId);
}

export async function uploadUserPhoto(
  file: UploadedFile,
  userId: string,
): Promise<string> {
  return uploadPhoto(file, "users", userId);
}

export async function deletePlayerPhoto(photoUrl: string): Promise<void> {
  // Best-effort — do not throw so a missing photo never blocks other operations
  try {
    // Derive the public_id from the URL: everything between /upload/ and the extension
    const match = photoUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (!match || !match[1]) return;
    const publicId = match[1];
    const cld = getCloudinary();
    await cld.uploader.destroy(publicId);
  } catch {
    // Non-critical
  }
}
