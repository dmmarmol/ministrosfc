import { createError } from "../middleware/error-handler";
import type { AddressSuggestion } from "@ministrosfc/shared";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export const AddressSearchService = {
  async search(query: string, limit = 5): Promise<AddressSuggestion[]> {
    const country = process.env.ADDRESS_SEARCH_COUNTRY ?? "ar";
    const url = `${NOMINATIM_BASE}?q=${encodeURIComponent(query)}&format=json&addressdetails=0&limit=${limit}&countrycodes=${country}`;

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": "ministrosfc/1.0" },
      });
    } catch {
      throw createError(
        "Address search service temporarily unavailable",
        503,
        "GEOCODER_UNAVAILABLE",
      );
    }

    if (!res.ok) {
      throw createError(
        "Address search service temporarily unavailable",
        503,
        "GEOCODER_UNAVAILABLE",
      );
    }

    const results = (await res.json()) as NominatimResult[];

    return results.map((r) => ({
      displayName: r.display_name,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      placeId: r.place_id,
    }));
  },
};
