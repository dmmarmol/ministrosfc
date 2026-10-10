# Feature Specification: Weather Forecast for Upcoming Game

**Feature Branch**: `017-weather-upcoming-game`
**Created**: 2026-04-09
**Status**: Draft
**Input**: User description: "Introduce a feature to display the weather for the upcoming game. The next game should be highlighted in the public homepage in the Hero block. There needs to be a less important but still visible space for the forecast for that day & time only. Forecast info should be preferably retrieved from a reliable open source weather api. If not possible, try to use google weather api but keep this API consumption as free as a mandatory requirement."

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Visitor sees the Next Game Hero with Weather Forecast (Priority: P1)

A visitor opens the public homepage. The next scheduled game is prominently displayed in a Hero block at the top of the page, showing opponent, date/time, and playground. Below the game info — in a secondary but clearly visible section — the weather forecast for that specific day and scheduled time is shown: weather condition icon, temperature, and a short description (e.g., "Parcialmente nublado, 18 °C").

**Why this priority**: This is the entire feature. Displaying the next game in the Hero and its weather forecast is the complete deliverable.

**Independent Test**: With a future game scheduled, load the public homepage and verify: (1) the Hero block shows the next game's details, (2) a weather section within or adjacent to the Hero shows the forecast for the game's date and time.

**Acceptance Scenarios**:

1. **Given** there is at least one future game, **When** a visitor loads the public homepage, **Then** the Hero block displays the next upcoming game with opponent name, date, time, and playground name.
2. **Given** the Hero block is rendered with a next game, **When** weather data is available, **Then** a weather section shows the forecast for the game's date and scheduled kick-off time: a weather condition icon, temperature in Celsius, and a short condition label (e.g., "Soleado", "Lluvioso").
3. **Given** the weather API returns data, **When** the forecast section renders, **Then** it is visually subordinate to the core game info (e.g., smaller font, secondary styling) — it draws attention without competing with the game headline.
4. **Given** the weather API is unavailable or returns an error, **When** the Hero block renders, **Then** the game info is still shown and the weather section is hidden or replaced with a graceful fallback (e.g., "Pronóstico no disponible").
5. **Given** there are no future games scheduled, **When** the homepage Hero renders, **Then** a placeholder message is shown (e.g., "Próximo partido: por confirmar") and no weather section is displayed.
6. **Given** the next game is more than 16 days away (beyond most free-tier forecast horizons), **When** the weather section renders, **Then** it shows "Pronóstico disponible próximamente" rather than inaccurate or absent data.

---

### Edge Cases

- The game's playground must have geocoded coordinates (lat/lng) for the weather lookup; if coordinates are missing, the weather section is hidden with a graceful message.
- Weather forecast resolution: the API should return hourly or 3-hourly data; select the time slot closest to the game's kick-off hour.
- API rate limit: weather data MUST be cached at the server (CMS) level to avoid hitting rate limits on every page load.
- Timezone: forecast times must be interpreted in Argentina Standard Time (ART, UTC-3) to match the game schedule.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The public homepage Hero block MUST display the next upcoming game (soonest future game by date/time) including: opponent name, date (formatted in Spanish locale), kick-off time, and playground name.
- **FR-002**: The Hero block MUST include a weather forecast section showing the forecast for the game's date and kick-off time: condition icon, temperature (°C), and a short condition label.
- **FR-003**: Weather data MUST be fetched from a free, open-source weather API — preferably Open-Meteo (no API key required, no rate limit for reasonable usage) or Open-Meteo as primary with wttr.in as fallback. Google Weather API MUST only be used if no free alternative is viable.
- **FR-004**: Weather API consumption MUST remain within free tier limits at all times; paid API tiers are not acceptable.
- **FR-005**: Weather data MUST be fetched using the playground's latitude and longitude (geocoded coordinates); games without a linked playground or without coordinates MUST skip the weather section.
- **FR-006**: Weather data MUST be cached at the CMS/server level with a TTL of at least 1 hour to prevent redundant API calls on every page view.
- **FR-007**: If weather data is unavailable (API error, missing coordinates, game > 16 days away), the game Hero MUST still render; the weather section MUST display a graceful fallback message.
- **FR-008**: The forecast time slot selected MUST be the one nearest to the game's kick-off hour, interpreted in Argentina Standard Time (UTC-3).
- **FR-009**: If no future game exists, the Hero block MUST render a placeholder ("Próximo partido: por confirmar") with no weather section.

### Key Entities

- **WeatherForecast** (transient, not persisted): condition icon code, temperature in °C, condition label. Derived at request time from cached API response.
- **Game** (read): uses existing `date`, `time`, `playgroundId` fields.
- **Playground** (read): uses existing `lat`, `lng` coordinates for weather lookup.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The Hero block with weather data loads within 800ms on a standard connection (cache-warmed response).
- **SC-002**: Weather API calls are limited to at most 1 per game per hour through server-side caching regardless of the number of concurrent page views.
- **SC-003**: The weather section shows data for the correct day and the time slot nearest to kick-off (within ±1 hour).
- **SC-004**: Zero cost incurred from weather API usage (free tier only).
- **SC-005**: The Hero renders correctly with no JavaScript errors when weather data is unavailable.

## Assumptions

- Open-Meteo is the primary weather API choice (free, no key, CORS-friendly, hourly resolution up to 16 days). Fallback: wttr.in JSON API.
- Playground geocoordinates are stored from spec 012 (address autocomplete which already calls Nominatim to obtain lat/lng).
- Server-side caching (CMS layer) is used rather than client-side to centralise the TTL and protect the free tier.
- Argentina Standard Time (ART, UTC-3) is used for all time comparisons; no daylight saving offset applies.
