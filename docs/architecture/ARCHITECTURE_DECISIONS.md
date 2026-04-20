# Architecture Decision Records (ADRs)

**Project**: Ministros FC | **Date**: March 17, 2026

---

## ADR-001: Team References in Games (RelationshipModel)

**Decision Date**: March 17, 2026  
**Status**: ✅ APPROVED

### Context

The team had a relational database background and questioned whether embedding Team objects in Game responses vs. using pure foreign key references would be optimal for the data volume.

**Data Volume Context:**

- Frequency: 1 game per Saturday
- Duration: 8-10 months per year (~40-50 games/year)
- Growth: Single amateur team, minimal scaling needs in MVP phase

### Dilemma

**Option A: Foreign Keys Only**

- Database: Stores `homeTeamId`, `awayTeamId` (minimal storage)
- API Response: Return only IDs, client must fetch Team separately
- Pros: Minimal data transfer, normalized database
- Cons: Extra API calls needed for team details (N+1 query problem), worse UX

**Option B: Embedded Team Objects** (Denormalized)

- Database: Stores `homeTeamId`, `awayTeamId` as FKs
- API Response: Return full Team objects embedded (id, name, shortName, logo)
- Pros: Complete data in single request, better UX, no N+1 problem
- Cons: Data duplication in response layer, slightly larger payloads

### Decision

**✅ Implement Hybrid Approach (Option B with FK Storage)**

```prisma
// Database: Foreign Key relationships (normalized)
model Game {
  homeTeam   Team    @relation("HomeTeam", fields: [homeTeamId], references: [id])
  homeTeamId String
  awayTeam   Team    @relation("AwayTeam", fields: [awayTeamId], references: [id])
  awayTeamId String
}

// API Response: Embedded Team objects (denormalized for convenience)
{
  "homeTeam": {
    "id": "uuid-...",
    "name": "Ministros F.C",
    "shortName": "MFC",
    "logo": "https://..."
  },
  "awayTeam": { ... }
}
```

### Rationale

1. **Data Volume is Negligible**: 40-50 games/year = minimal storage/transfer
2. **Client Experience**: Single API call gets all needed data
3. **Database Integrity**: Foreign keys prevent orphaned/invalid teams
4. **Future-Proof**: Easy to scale to multi-team tournaments without new queries
5. **No Performance Risk**: At 50 games/year, even 1KB extra per response is immeasurable

**Example**: 50 games × 2 KB extra per response = 100 KB/year. No caching issues.

### Trade-offs Accepted

- API response slightly larger (~2-3 KB per game response)
- Team snapshots embedded at create time (if team name changes, old games retain original name)
- Acceptable for MVP phase

### Implementation Status

✅ **Database**: Foreign keys implemented in Prisma schema  
✅ **API**: Response bodies include full Team objects  
✅ **Contracts**: All API contracts reflect embedded Team structure

### Future Consideration

This hybrid approach scales seamlessly to:

- Multi-team tournaments (add Team[] to Tournament)
- Statistics aggregated by team (requires no schema changes)
- Team history/versioning (can snapshot Team state at game time)

---

## ADR-002: Player Photo Structure (AvatarAndGallery)

**Decision Date**: March 17, 2026  
**Status**: ✅ APPROVED

### Context

Player profile system needs flexible photo management supporting:

1. Single main photo for roster display (avatar)
2. Optional photo gallery for additional images
3. Simple management via API

### Dilemma

**Option A: Single Photo Field**

```typescript
photo: string | null; // One URL only
```

- Pros: Simplest implementation
- Cons: Can't support multiple photos; inflexible

**Option B: Separate Avatar + Photos Array**

```typescript
avatar: string | null;        // Main display photo
photos: string[] = [];         // Additional photos (default empty)
```

- Pros: Clear intent (avatar vs. gallery), flexible growth, clean UI presentation
- Cons: Slightly more complex, two fields to manage

### Decision

**✅ Implement Option B: Separate Avatar + Photos Array**

```prisma
model Player {
  avatar  String?      // Main photo for roster, profile cards, etc.
  photos  String[] @default([])  // Gallery of additional photos
}
```

### Rationale

1. **UX Clarity**: Avatar clearly represents "main display", photos are "extras"
2. **Frontend Simplicity**: Components render `avatar` as primary, loop `photos` for gallery
3. **Flexible Growth**: Can add photos without migrating avatar field
4. **Common Pattern**: Matches social media standards (LinkedIn, GitHub, etc.)
5. **Storage Efficient**: Empty array takes minimal space, no null coalescing needed

### Data Format

**ISO 8601 Format Example:**

```json
{
  "id": "player-1",
  "avatar": "https://cdn.example.com/photos/player-1-avatar.jpg",
  "photos": [
    "https://cdn.example.com/photos/player-1-full.jpg",
    "https://cdn.example.com/photos/player-1-action.jpg",
    "https://cdn.example.com/photos/player-1-training.jpg"
  ]
}
```

**Public Response** (no distinction needed, both visible)  
**Authenticated Response** (can manage both via API)

### Implementation Status

✅ **Data Model**: Avatar + photos[] added to Player entity  
✅ **API Contracts**: Player, Game endpoints updated  
✅ **Examples**: All API examples show both fields

---

## ADR-003: Player Date of Birth (ISOFormat)

**Decision Date**: March 17, 2026  
**Status**: ✅ APPROVED

### Context

Need flexible date of birth handling to:

1. Calculate player age (required for some tournaments/leagues)
2. Make it optional (not all players provide)
3. Store in UTC format for consistency

### Dilemma

**Option A: DateTime Field**

```prisma
dateOfBirth: DateTime?;  // Stored as timestamp
```

- Pros: Full precision (time component)
- Cons: Unnecessary precision (only date needed), timezone complexity

**Option B: ISO 8601 Date String**

```prisma
dateOfBirth: String?;  // Format: "YYYY-MM-DD"
```

- Pros: Clean date-only representation, easy to parse, timezone-agnostic
- Cons: String format (minor parsing needed in logic)

### Decision

**✅ Implement Option B: ISO 8601 Date String Format**

```prisma
model Player {
  dateOfBirth  String?  // Format: "YYYY-MM-DD", NULL if not provided
}
```

### Rationale

1. **Clarity**: Date-only format matches what's stored (no time component)
2. **UTC**: No timezone confusion (all dates interpreted on UTC calendar)
3. **Age Calculation**: Easy formula: `age = current_year - birth_year` (with month adjustment)
4. **Flexibility**: Can be NULL without "unknown date" sentinel value
5. **API Readability**: Clients see clean YYYY-MM-DD format
6. **Compatibility**: Works across JavaScript, Python, databases

### Age Calculation Formula

```typescript
function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;

  const [year, month, day] = dateOfBirth.split("-").map(Number);
  const today = new Date();

  let age = today.getFullYear() - year;
  if (
    today.getMonth() < month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() < day)
  ) {
    age--;
  }

  return age;
}
```

### Data Format

**Valid Examples:**

- `"1990-05-15"` — Complete, known birth date
- `null` — Not provided / not public
- `undefined` — Frontend can treat as null

**API Response:**

```json
{
  "id": "player-1",
  "name": "João Silva",
  "dateOfBirth": "1990-05-15", // Public in response (computed at player creation)
  "age": null // Age NOT computed in API (client responsibility for privacy)
}
```

### Privacy Consideration

- `dateOfBirth` stored for internal records (leagues, etc.)
- Age computation done by **client** (not sent by server)
- Prevents age-based discrimination in public statistics

### Implementation Status

✅ **Data Model**: dateOfBirth as ISO 8601 String  
✅ **API Contracts**: All examples show ISO format  
✅ **Validation**: Only allows YYYY-MM-DD format

---

## ADR-004: Team Foreign Key Integrity

**Decision Date**: March 17, 2026  
**Status**: ✅ APPROVED

### Context

Games reference Teams via foreign keys. Need to decide:

- Can teams be deleted if they have games?
- Can teams be deleted if they're marked as `isOurTeam=true`?

### Decision

**✅ Implement Strict Referential Integrity with MVP Constraints**

```prisma
model Game {
  homeTeam   Team @relation(..., onDelete: Restrict)  // Cannot delete
  awayTeam   Team @relation(..., onDelete: Restrict)
}

model Team {
  // MVP Constraint: Exactly one team has isOurTeam=true
  // Attempting to delete Ministros FC returns 403 Forbidden
}
```

### Rationale

1. **Data Integrity**: Games always reference valid teams
2. **History Preservation**: Deleting opponent teams would orphan game records
3. **MVP Safety**: Prevents accidental deletion of "our team"

### Implementation Status

✅ **Database**: onDelete: Restrict on all Team foreign keys  
✅ **API Validation**: DELETE /teams/{id} validates isOurTeam and game count

---

## ADR-005: Statistics Filter Abstraction (`useStatsFilters`)

**Decision Date**: April 19, 2026  
**Status**: ✅ APPROVED

### Context

Statistics pages (`top-scorers`, `players`, `rivals`, `tournaments`, etc.) each needed to read and write URL query parameters as typed filters. Initial implementations used `useQueryParams` directly per page, leading to duplicated filter logic, inconsistent default values, and scattered `PlayerStatus` imports.

### Dilemma

**Option A: Direct `useQueryParams` per page**

- Each page calls `qp.get("playerStatus")` and handles defaults inline
- Pros: Simple, no extra abstraction layer
- Cons: Duplicated logic, no shared type definition, default values drift across pages

**Option B: Shared `useStatsFilters` composable**

- Wraps `useQueryParams`; exposes a typed `StatsFilters` interface and per-key writable computeds with defaults
- Pros: Single source of truth, `PlayerStatus.ACTIVE` default applied once, pages are concise
- Cons: Slight indirection

### Decision

**✅ Implement `useStatsFilters` composable (Option B)**

```ts
// packages/frontend/src/composables/useStatsFilters.ts
export function useStatsFilters() {
  const qp = useQueryParams();

  function makeFilter(key: keyof StatsFilters, defaultValue = "") {
    return computed({
      get: () => qp.get(key) || defaultValue,
      set: (v: string) => qp.set(key, v),
    });
  }

  const playerStatus = makeFilter("playerStatus", PlayerStatus.ACTIVE);
  // ... other filters

  return {
    filters,
    setFilter,
    resetFilters,
    year,
    tournament,
    rivalId,
    playerId,
    playerStatus,
    playgroundId,
  };
}
```

### Consequences

- All statistics pages import **only** `useStatsFilters()` — no direct `useQueryParams` or `PlayerStatus` imports on pages
- `PlayerStatus.ACTIVE` is the default for `playerStatus` when the query param is absent
- Filter components receive writable computeds via `v-model` directly
- New statistics pages or filter keys must be added to `useStatsFilters` first

---

## ADR-006: API Endpoint Auth Boundary (Public List Endpoints)

**Decision Date**: April 19, 2026  
**Status**: ✅ APPROVED

### Context

Filter components (`TournamentFilter`, `PlayerFilter`, `RivalFilter`, `PlaygroundFilter`, `YearFilter`) call backend list endpoints to populate their `<select>` options. These components can appear on both public pages (e.g., `top-scorers`) and admin/member-only pages. The question was whether to auth-protect the list endpoints at the API layer or at the route/page layer.

### Dilemma

**Option A: Auth at the API endpoint level**

- `GET /api/v1/tournaments`, `/teams`, `/playgrounds`, `/statistics/years` all require `authenticate` middleware
- Pros: Defense in depth; no unauthenticated data exposure
- Cons: Filter components on public pages break for unauthenticated users; requires `v-if="authStore.isAuthenticated"` guards on every filter component per page

**Option B: Auth at the route/page level (chosen)**

- List endpoints are **public**; admin-only mutations (POST, PUT, DELETE) remain protected
- Pages and route middleware handle whether authenticated content is shown
- Filter components on public pages always work without additional guards
- Pros: Consistent with standard REST conventions; filter data is non-sensitive (tournament names, playground names)
- Cons: Unauthenticated users can enumerate tournament/playground names via the API

### Decision

**✅ List endpoints are public; auth is enforced at the route/page level (Option B)**

| Endpoint                             | Auth              | Rationale                                                       |
| ------------------------------------ | ----------------- | --------------------------------------------------------------- |
| `GET /api/v1/tournaments`            | Public            | Tournament names are non-sensitive; needed for public filter UI |
| `GET /api/v1/teams`                  | Public            | Team names are non-sensitive; used in rivalry filters           |
| `GET /api/v1/playgrounds`            | Public            | Playground names are non-sensitive                              |
| `GET /api/v1/statistics/years`       | Public            | Needed by `YearFilter` on fully public statistics pages         |
| `GET /api/v1/statistics/top-scorers` | Public            | Stats page is public                                            |
| `POST/PUT/DELETE` on all resources   | **Authenticated** | Mutations always require auth                                   |

### Consequences

- Filter components do not need `v-if="authStore.isAuthenticated"` guards solely to avoid API auth failures
- Authenticated-only features (e.g., showing the `TournamentFilter` only to members) remain a **UX decision** enforced in the template, not an API constraint
- If a list endpoint ever needs to return user-specific data, auth must be added then and the tradeoff reconsidered

---

## Summary Table

| ADR     | Title                                | Decision                          | Status      |
| ------- | ------------------------------------ | --------------------------------- | ----------- |
| ADR-001 | Team Foreign Keys + Embedded Objects | Hybrid (FK + denormalize)         | ✅ APPROVED |
| ADR-002 | Player Photos Structure              | Avatar + Photos Array             | ✅ APPROVED |
| ADR-003 | Date of Birth Format                 | ISO 8601 String YYYY-MM-DD        | ✅ APPROVED |
| ADR-004 | Team Referential Integrity           | Restrict deletion for consistency | ✅ APPROVED |
| ADR-005 | Statistics Filter Abstraction        | `useStatsFilters` composable      | ✅ APPROVED |
| ADR-006 | API Endpoint Auth Boundary           | Public lists, route-level auth    | ✅ APPROVED |

---

**Review Cycle**: Quarterly (next review: June 17, 2026)  
**Last Updated**: April 19, 2026  
**Approved By**: Project Architecture Team
