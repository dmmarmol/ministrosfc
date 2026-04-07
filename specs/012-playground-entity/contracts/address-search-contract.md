# API Contract: Address Search (Nominatim Proxy)

**Base path**: `/api/v1/address`  
**Auth**: None — Nominatim/OSM data is public

---

## GET /api/v1/address/search

Search for real-world addresses using Nominatim (OpenStreetMap). Intended for powering the `AddressAutocompleteInput.vue` frontend component. Results are biased toward Argentina (`countrycodes=ar` by default, overridable via `ADDRESS_SEARCH_COUNTRY` env var).

**Auth**: None required

---

### Query Parameters

| Parameter | Type    | Required | Constraints          | Default | Description                             |
| --------- | ------- | -------- | -------------------- | ------- | --------------------------------------- |
| `q`       | string  | Yes      | 3–200 chars, trimmed | —       | Free-form address query                 |
| `limit`   | integer | No       | 1–10                 | 5       | Maximum number of suggestions to return |

---

### Response 200 — Success

```json
{
  "data": [
    {
      "displayName": "Avenida Corrientes, San Nicolás, Buenos Aires, Argentina",
      "lat": -34.6037,
      "lon": -58.3816,
      "placeId": 204751033
    },
    {
      "displayName": "Avenida Corrientes, Rosario, Santa Fe, Argentina",
      "lat": -32.9587,
      "lon": -60.6927,
      "placeId": 108681845
    }
  ]
}
```

Returns an empty array when Nominatim finds no matching results:

```json
{ "data": [] }
```

---

### Response 400 — Query Too Short

Returned when `q` is present but shorter than 3 characters after trimming.

```json
{
  "code": "QUERY_TOO_SHORT",
  "message": "Query must be at least 3 characters",
  "statusCode": 400
}
```

---

### Response 400 — Query Missing or Invalid

```json
{
  "code": "VALIDATION_ERROR",
  "message": "q is required",
  "statusCode": 400,
  "errors": [{ "field": "q", "message": "Required" }]
}
```

---

### Response 503 — Nominatim Unavailable

If the upstream Nominatim call fails (timeout, non-200 response):

```json
{
  "code": "GEOCODER_UNAVAILABLE",
  "message": "Address search temporarily unavailable",
  "statusCode": 503
}
```

---

## Usage Notes

### Frontend Debounce Contract

The frontend component **MUST** debounce requests by at least 400ms and enforce a minimum query length of 3 characters before calling this endpoint. These constraints must be enforced at the component level — the server validates `q` length but does not rate-limit requests.

### Country Bias

Results are biased to Argentina by default (`countrycodes=ar` forwarded to Nominatim). This makes short queries like "córdoba" or "rosario" return Argentine cities first rather than international matches.

### Attribution

All results are derived from OpenStreetMap data under the ODbL 1.0 license. Any public display of these results MUST include the OSM attribution `© OpenStreetMap contributors`.

### `placeId` Usage

The `placeId` field corresponds to Nominatim's `place_id` (internal integer). It can be used in the `exclude_place_ids` parameter to paginate or skip already-seen results. It is optional — treat its absence gracefully.
