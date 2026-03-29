/**
 * Integration test: Object storage (Cloudinary)
 * Tests the upload flow with mocked Cloudinary SDK
 */
import request from "supertest";
import { createApp } from "../../src/config/server";
import { prisma } from "../../src/config/database";

jest.mock("../../src/middleware/rate-limiter", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  registerLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));
jest.mock("../../src/utils/object-storage", () => ({
  validatePhotoFile: jest.fn(),
  uploadPlayerPhoto: jest
    .fn()
    .mockResolvedValue(
      "https://res.cloudinary.com/ministrosfc/image/upload/v1/players/test-player.jpg",
    ),
  deletePlayerPhoto: jest.fn().mockResolvedValue(undefined),
}));

import { uploadPlayerPhoto } from "../../src/utils/object-storage";

const app = createApp();

describe("Object storage (integration)", () => {
  let adminToken: string;

  const adminEmail = `admin-storage-${Date.now()}@ministrosfc.test`;

  beforeAll(async () => {
    await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "Admin!Stor99",
      firstName: "Admin",
      lastName: "Storage Test",
    });
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN" },
    });
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password: "Admin!Stor99" });
    adminToken = loginRes.body.data.accessToken;
  });

  it("POST /api/v1/players with photo → calls uploadPlayerPhoto", async () => {
    const mockUpload = uploadPlayerPhoto as jest.Mock;
    mockUpload.mockClear();

    // Create a minimal PNG buffer (1x1 white pixel)
    const pngBuffer = Buffer.from([
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a, // PNG signature
      0x00,
      0x00,
      0x00,
      0x0d,
      0x49,
      0x48,
      0x44,
      0x52, // IHDR chunk
      0x00,
      0x00,
      0x00,
      0x01,
      0x00,
      0x00,
      0x00,
      0x01,
      0x08,
      0x02,
      0x00,
      0x00,
      0x00,
      0x90,
      0x77,
      0x53,
      0xde,
      0x00,
      0x00,
      0x00,
      0x0c,
      0x49,
      0x44,
      0x41, // IDAT chunk
      0x54,
      0x08,
      0xd7,
      0x63,
      0xf8,
      0xcf,
      0xc0,
      0x00,
      0x00,
      0x00,
      0x02,
      0x00,
      0x01,
      0xe2,
      0x21,
      0xbc,
      0x33,
      0x00,
      0x00,
      0x00,
      0x00,
      0x49,
      0x45,
      0x4e, // IEND chunk
      0x44,
      0xae,
      0x42,
      0x60,
      0x82,
    ]);

    const res = await request(app)
      .post("/api/v1/players")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("firstName", "Photo")
      .field("lastName", "Player")
      .field("playerType", "REGISTERED")
      .attach("photo", pngBuffer, {
        filename: "test.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(201);
    // uploadPlayerPhoto is called twice: once with a temp ID, then again with the real player ID
    expect(mockUpload).toHaveBeenCalledTimes(2);
    expect(res.body.data.photoUrl).toBe(
      "https://res.cloudinary.com/ministrosfc/image/upload/v1/players/test-player.jpg",
    );
  });

  it("POST /api/v1/players without photo → does NOT call uploadPlayerPhoto", async () => {
    const mockUpload = uploadPlayerPhoto as jest.Mock;
    mockUpload.mockClear();

    const res = await request(app)
      .post("/api/v1/players")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("firstName", "No Photo")
      .field("lastName", "Player")
      .field("jerseyNumber", "33")
      .field("playerType", "REGISTERED");

    expect(res.status).toBe(201);
    expect(mockUpload).not.toHaveBeenCalled();
    expect(res.body.data.photoUrl).toBeNull();
  });
});
