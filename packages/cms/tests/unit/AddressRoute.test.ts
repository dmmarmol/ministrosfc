import express from "express";
import request from "supertest";
import { globalErrorHandler } from "../../src/middleware/error-handler";
import { createError } from "../../src/middleware/error-handler";

// Must be mocked before the router is imported
jest.mock("../../src/services/AddressSearchService");
import { AddressSearchService } from "../../src/services/AddressSearchService";
import { addressRouter } from "../../src/routes/address";

const mockSearch = AddressSearchService.search as jest.MockedFunction<
  typeof AddressSearchService.search
>;

const mockSuggestions = [
  { displayName: "Av. Corrientes, Buenos Aires", lat: -34.6037, lon: -58.3816, placeId: 1 },
  { displayName: "Av. Corrientes, Rosario", lat: -32.9587, lon: -60.6927, placeId: 2 },
];

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/address", addressRouter);
  app.use(globalErrorHandler);
  return app;
}

describe("GET /api/v1/address/search", () => {
  let app: express.Application;

  beforeAll(() => {
    app = buildApp();
  });

  afterEach(() => jest.clearAllMocks());

  it("returns 200 with AddressSuggestion[] on valid query", async () => {
    mockSearch.mockResolvedValue(mockSuggestions);

    const res = await request(app).get("/api/v1/address/search?q=Corrientes");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: mockSuggestions });
    expect(mockSearch).toHaveBeenCalledWith("Corrientes", 5);
  });

  it("respects the limit query parameter", async () => {
    mockSearch.mockResolvedValue(mockSuggestions);

    await request(app).get("/api/v1/address/search?q=Corrientes&limit=3");

    expect(mockSearch).toHaveBeenCalledWith("Corrientes", 3);
  });

  it("returns 400 QUERY_TOO_SHORT when q is shorter than 3 chars", async () => {
    const res = await request(app).get("/api/v1/address/search?q=ab");

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("QUERY_TOO_SHORT");
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("returns 400 VALIDATION_ERROR when q is missing", async () => {
    const res = await request(app).get("/api/v1/address/search");

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("returns 503 when service throws GEOCODER_UNAVAILABLE", async () => {
    mockSearch.mockRejectedValue(
      createError("Address search service temporarily unavailable", 503, "GEOCODER_UNAVAILABLE"),
    );

    const res = await request(app).get("/api/v1/address/search?q=Corrientes");

    expect(res.status).toBe(503);
    expect(res.body.code).toBe("GEOCODER_UNAVAILABLE");
  });

  it("returns empty data array when service returns no results", async () => {
    mockSearch.mockResolvedValue([]);

    const res = await request(app).get("/api/v1/address/search?q=Zzzzzz");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [] });
  });
});
