/**
 * Unit tests: photo storage is optional at launch. Uploading without
 * credentials fails gracefully (503, PHOTO_STORAGE_UNAVAILABLE, Spanish message)
 * and deleting photos becomes a no-op.
 */
import {
  deletePlayerPhoto,
  isPhotoStorageConfigured,
  uploadPhoto,
} from "../../src/utils/object-storage";

const VARS = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const;

const jpeg = {
  buffer: Buffer.from("fake"),
  mimetype: "image/jpeg",
  originalname: "photo.jpg",
  size: 4,
};

describe("photo storage configuration", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of VARS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of VARS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  describe("isPhotoStorageConfigured", () => {
    it("is false when no credential is set", () => {
      expect(isPhotoStorageConfigured({})).toBe(false);
    });

    it("is false when only some credentials are set or they are blank", () => {
      expect(isPhotoStorageConfigured({ CLOUDINARY_CLOUD_NAME: "c" })).toBe(false);
      expect(
        isPhotoStorageConfigured({
          CLOUDINARY_CLOUD_NAME: "c",
          CLOUDINARY_API_KEY: "k",
          CLOUDINARY_API_SECRET: "   ",
        }),
      ).toBe(false);
    });

    it("is true when all three credentials are set", () => {
      expect(
        isPhotoStorageConfigured({
          CLOUDINARY_CLOUD_NAME: "c",
          CLOUDINARY_API_KEY: "k",
          CLOUDINARY_API_SECRET: "s",
        }),
      ).toBe(true);
    });
  });

  describe("when photo storage is not configured", () => {
    it("rejects uploads with a 503 PHOTO_STORAGE_UNAVAILABLE error in Spanish", async () => {
      await expect(uploadPhoto(jpeg, "users", "u1")).rejects.toMatchObject({
        statusCode: 503,
        code: "PHOTO_STORAGE_UNAVAILABLE",
        message: expect.stringMatching(/foto/i),
      });
    });

    it("still validates the file type first", async () => {
      await expect(
        uploadPhoto({ ...jpeg, mimetype: "application/pdf" }, "users", "u1"),
      ).rejects.toThrow(/JPG, PNG o WebP/);
    });

    it("treats deleting a photo as a no-op instead of failing", async () => {
      await expect(
        deletePlayerPhoto("https://res.cloudinary.com/x/image/upload/v1/players/p/photo.jpg"),
      ).resolves.toBeUndefined();
    });
  });
});
