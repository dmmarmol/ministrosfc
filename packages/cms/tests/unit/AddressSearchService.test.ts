import { AddressSearchService } from "../../src/services/AddressSearchService";

const mockFetch = jest.fn();
global.fetch = mockFetch;

const nominatimResult = [
  {
    place_id: 204751033,
    display_name: "Avenida Corrientes, Buenos Aires, Argentina",
    lat: "-34.6037",
    lon: "-58.3816",
  },
  {
    place_id: 108681845,
    display_name: "Avenida Corrientes, Rosario, Santa Fe, Argentina",
    lat: "-32.9587",
    lon: "-60.6927",
  },
];

function mockNominatimOk(results = nominatimResult) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => results,
  });
}

function mockNominatimError() {
  mockFetch.mockRejectedValueOnce(new Error("Network error"));
}

function mockNominatimNonOk() {
  mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
}

describe("AddressSearchService", () => {
  afterEach(() => jest.clearAllMocks());

  it("maps Nominatim results to AddressSuggestion[]", async () => {
    mockNominatimOk();
    const results = await AddressSearchService.search("Corrientes");

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      displayName: "Avenida Corrientes, Buenos Aires, Argentina",
      lat: -34.6037,
      lon: -58.3816,
      placeId: 204751033,
    });
  });

  it("parses Nominatim string lat/lon fields into numbers", async () => {
    mockNominatimOk([
      { place_id: 1, display_name: "Test", lat: "-12.345", lon: "67.890" },
    ]);
    const results = await AddressSearchService.search("Test");

    expect(typeof results[0]!.lat).toBe("number");
    expect(typeof results[0]!.lon).toBe("number");
    expect(results[0]!.lat).toBe(-12.345);
    expect(results[0]!.lon).toBe(67.89);
  });

  it("passes countrycodes=ar in the upstream URL by default", async () => {
    mockNominatimOk([]);
    await AddressSearchService.search("Corrientes");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("countrycodes=ar");
  });

  it("respects the limit parameter (default 5)", async () => {
    mockNominatimOk([]);
    await AddressSearchService.search("Test");
    const defaultUrl = mockFetch.mock.calls[0][0] as string;
    expect(defaultUrl).toContain("limit=5");

    mockNominatimOk([]);
    await AddressSearchService.search("Test", 10);
    const customUrl = mockFetch.mock.calls[1][0] as string;
    expect(customUrl).toContain("limit=10");
  });

  it("throws GEOCODER_UNAVAILABLE (503) when fetch rejects", async () => {
    mockNominatimError();
    await expect(
      AddressSearchService.search("Corrientes"),
    ).rejects.toMatchObject({
      statusCode: 503,
      code: "GEOCODER_UNAVAILABLE",
    });
  });

  it("throws GEOCODER_UNAVAILABLE (503) when upstream returns non-2xx", async () => {
    mockNominatimNonOk();
    await expect(
      AddressSearchService.search("Corrientes"),
    ).rejects.toMatchObject({
      statusCode: 503,
      code: "GEOCODER_UNAVAILABLE",
    });
  });

  it("returns empty array when Nominatim returns no results", async () => {
    mockNominatimOk([]);
    const results = await AddressSearchService.search("Zzzzz");
    expect(results).toEqual([]);
  });
});
