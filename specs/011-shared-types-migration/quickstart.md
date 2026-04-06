# Quickstart: 011 — Shared Types Migration

## Prerequisites

```bash
# From repo root
node -v   # >= 18
npm -v    # >= 9
```

## Verify current baseline compiles

```bash
# From repo root — should pass on main before this branch
cd packages/shared && npx tsc --noEmit && echo "shared ✓"
cd ../cms    && npx tsc --noEmit && echo "cms ✓"
cd ../frontend && npx tsc --noEmit && echo "frontend ✓"
```

## Implementation order

### Step 1 — Add types to shared

Edit `packages/shared/src/types/api.ts`, add `PlayerProfileResponse` and `UpdatePlayerProfileInput` (see `data-model.md` for exact shapes).

Edit `packages/shared/src/index.ts` — already re-exports `./types` which includes `api.ts`, so no change needed unless types are in a new file.

```bash
cd packages/shared && npx tsc --noEmit   # Must pass before touching other packages
```

### Step 2 — Update CMS ProfileService.ts

1. Add import: `import { PlayerStatus, PlayerType, PlayerProfileResponse, UpdatePlayerProfileInput } from "@ministrosfc/shared";`
2. Annotate `getProfile` return type: `async getProfile(userId: string): Promise<PlayerProfileResponse>`
3. Replace `data` param in `updateProfile` with `data: UpdatePlayerProfileInput`
4. Replace all raw string literals with enum values (see data-model.md table)
5. Remove both `@TODO` comments

```bash
cd packages/cms && npx tsc --noEmit   # Must pass
npm test                              # All existing tests must pass
```

### Step 3 — Update frontend useProfile.ts

1. Add import: `import { type PlayerProfileResponse } from "@ministrosfc/shared";`
2. Delete the `ProfileData` interface declaration (lines 6-40)
3. Replace all `ProfileData` references with `PlayerProfileResponse`

```bash
cd packages/frontend && npx tsc --noEmit   # Must pass
npm test                                    # All existing tests must pass
```

## Verify success criteria

```bash
# SC-001: zero tsc errors across all packages
for pkg in shared cms frontend; do
  echo "=== $pkg ===" && (cd packages/$pkg && npx tsc --noEmit) && echo "✓"
done

# SC-002: zero raw string literals remaining in ProfileService.ts
grep -n '"ACTIVE"\|"INACTIVE"\|"REGISTERED"\|"GUEST"' packages/cms/src/services/ProfileService.ts \
  && echo "FAIL: raw literals remain" || echo "SC-002 ✓"

# SC-003: ProfileData no longer declared in useProfile.ts
grep -n "interface ProfileData" packages/frontend/src/composables/useProfile.ts \
  && echo "FAIL: ProfileData still present" || echo "SC-003 ✓"

# SC-004: @TODO comments removed from ProfileService.ts
grep -n "@TODO.*type\|@TODO.*enforce" packages/cms/src/services/ProfileService.ts \
  && echo "FAIL: @TODO comments remain" || echo "SC-004 ✓"
```
