# Research: 011 — Shared Types Migration

## Decision 1: Where to place `PlayerProfileResponse` in shared

**Decision**: `packages/shared/src/types/api.ts`

**Rationale**: `api.ts` already holds API-contract shapes (`ApiResponse<T>`, `ErrorResponse`, etc.). `PlayerProfileResponse` is a pure API contract — it is the serialized form that crosses the network boundary between CMS and frontend. It does not belong in `player.ts` (which holds the DB/domain model `Player`) or `user.ts` (which holds `User`). Keeping API contract types together in `api.ts` maintains the existing separation of concerns.

**Alternatives considered**:
- New file `profile.ts` in shared/types — unnecessary for two types; `api.ts` is the right layer for response shapes.
- Inline in `player.ts` — would conflate the DB entity model with the HTTP response projection; violates SRP.

---

## Decision 2: Where to place `UpdatePlayerProfileInput` in shared

**Decision**: `packages/shared/src/types/api.ts` alongside `PlayerProfileResponse`

**Rationale**: Input types (request bodies) are also API contracts. They represent what the client sends in a PATCH request. Placing both the request input and response output for the same endpoint in the same file makes the contract self-contained and easy to locate.

**Alternatives considered**:
- Zod schema in shared — Zod is a CMS-only devDependency and is not listed in `packages/shared/package.json`; the shared package must remain framework-agnostic. The Zod schema in `profile.ts` route file stays in CMS; the TypeScript type in shared is what gets shared.

---

## Decision 3: Should the Zod schema in `routes/profile.ts` derive from the shared type?

**Decision**: No — Zod schema stays in CMS, TypeScript type stays in shared. The two are kept manually in sync.

**Rationale**: `packages/shared` has no Zod dependency. Adding Zod to shared just for schema-first type generation would add a cross-cutting runtime dependency to a package that should remain lightweight. The safe approach for this spec is: define `UpdatePlayerProfileInput` as the canonical TS type in shared, annotate `ProfileService.updateProfile` to use it, and ensure the Zod schema's inferred type is compatible (verifiable at compile time via `satisfies` or explicit type annotation). Full Zod-in-shared integration is a future enhancement.

**Alternatives considered**:
- `z.infer<typeof updateProfileSchema>` exported from shared — requires Zod in shared package; out of scope.

---

## Decision 4: Which exact fields does `PlayerProfileResponse.player` expose?

**Decision**: Match `ProfileService.getProfile` return exactly — no added/removed fields for this spec.

Current fields:
```ts
player: {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  position: string | null;      // Note: Prisma returns raw string, not Position enum
  jerseyNumber: number | null;
  dateOfBirth: Date | null;     // Note: Prisma Date — serialized as string over HTTP
  address: string | null;
  photoUrl: string | null;
  status: string;               // Note: Prisma returns raw string, not PlayerStatus enum
  playerType: string;           // Note: Prisma returns raw string, not PlayerType enum
}
```

In the shared type, `status`, `playerType`, and `position` will be typed with the proper shared enums (`PlayerStatus`, `PlayerType`, `Position`) since these are the correct API contract types. The Prisma runtime values match the enum string values, so no runtime conversion is needed.

**Rationale**: This is where shared enums provide value — the API contract can express `status: PlayerStatus` even though the CMS service currently annotates it as `string`. Once `getProfile` is annotated with `Promise<PlayerProfileResponse>`, TypeScript will verify that `user.player.status` (a Prisma `$Enums.PlayerStatus` string) satisfies `PlayerStatus`.

---

## Decision 5: `dateOfBirth` type in the shared type

**Decision**: `string | null` in `PlayerProfileResponse`

**Rationale**: HTTP responses serialize dates as ISO strings. Prisma returns `Date | null` internally in the service, but `JSON.stringify` in Express converts it to a string before it crosses the network. The frontend already treats it as `string | null` in the existing `ProfileData` interface. The shared type reflects the over-the-wire contract, not the Prisma layer.

---

## Decision 6: `createdAt` type in user shape

**Decision**: `string` in `PlayerProfileResponse.user.createdAt`

**Rationale**: Same as dateOfBirth — serialized as ISO string over HTTP. Consistent with `User` interface in `shared/src/types/user.ts` which already uses `string`.

---

## Unknowns resolved

All NEEDS CLARIFICATION items: **None**. The codebase is fully understood; no external research required.
