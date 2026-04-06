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

Edit `packages/shared/src/types/api.ts`, add `PlayerProfileResponse` and `UpdatePlayerProfilePayload` (see `data-model.md` for exact shapes).

Edit `packages/shared/src/index.ts` — already re-exports `./types` which includes `api.ts`, so no change needed unless types are in a new file.

```bash
cd packages/shared && npx tsc --noEmit   # Must pass before touching other packages
```

### Step 2 — Update CMS ProfileService.ts

1. Add import: `import { PlayerStatus, PlayerType, PlayerProfileResponse, UpdatePlayerProfilePayload } from "@ministrosfc/shared";`
2. Annotate `getProfile` return type: `async getProfile(userId: string): Promise<PlayerProfileResponse>`
3. Replace `data` param in `updateProfile` with `data: UpdatePlayerProfilePayload`
4. Replace all raw string literals with enum values (see data-model.md table)
5. Remove both `@TODO` comments

```bash
cd packages/cms && npx tsc --noEmit   # Must pass
npm test                              # All existing tests must pass
```

### Step 3 — Update frontend useProfile.ts and player.vue

**useProfile.ts**:
1. Add import: `import { type PlayerProfileResponse, type UpdatePlayerProfilePayload } from "@ministrosfc/shared";`
2. Delete the `ProfileData` interface declaration (lines 6-40)
3. Replace all 4 `ProfileData` references with `PlayerProfileResponse`
4. Change `updateProfile(data: Record<string, unknown>)` param to `updateProfile(data: UpdatePlayerProfilePayload)`

**player.vue** (orchestrating page — must update alongside useProfile.ts):
1. Add import: `import { PlayerStatus, type UpdatePlayerProfilePayload } from "@ministrosfc/shared";`
2. Change `async function handleSave(data: Record<string, unknown>)` → `handleSave(data: UpdatePlayerProfilePayload)`
3. Change `status: profile.value?.player.status ?? "ACTIVE"` → `?? PlayerStatus.ACTIVE` in `editableProfile` computed

```bash
cd packages/frontend && npx tsc --noEmit   # Must pass
npm test                                    # All existing tests must pass
```

### Step 4 — Update frontend profile components

**ProfileEditForm.vue**:
1. Add import: `import { PlayerStatus, Position } from "@ministrosfc/shared";`
2. Replace `defineProps<{...}>()` with `type Props = { profile: ProfileFields; takenJerseys: number[]; loading: boolean; error: string }` then `const props = defineProps<Props>()`
3. Update `ProfileFields`: `position: Position | ""`, `status: PlayerStatus`
4. Replace `"ACTIVE"` / `"INACTIVE"` string literals in reactive defaults, watch handler, and `isActive` computed
5. Remove `@TODO` comment (line 6)

**ProfileHeader.vue**:
1. Add import: `import { UserRole, PlayerStatus } from "@ministrosfc/shared";`
2. Replace `defineProps<{...}>()` with `type Props = { firstName: string; lastName: string; role: UserRole; status: PlayerStatus; photoUrl: string | null; createdAt: string }` then `const props = defineProps<Props>()`
3. Update `roleBadgeClass` keys to `UserRole.ADMIN`, `UserRole.EDITOR`, `UserRole.DT`, `UserRole.PLAYER`
4. Update `statusBadgeClass`: `props.status === PlayerStatus.ACTIVE`
5. Remove both `@TODO` comments

**InvitedGuestsList.vue**:
1. Create `packages/frontend/src/utils/formatDate.ts` with `export function formatDate(dateString: string, locale?: string): string`
2. Import and use it in `InvitedGuestsList.vue`; remove `@TODO` comment

```bash
cd packages/frontend && npx tsc --noEmit   # Must pass
npm test                                    # All existing tests must pass
```
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

# SC-005: all tests pass
(cd packages/cms && npm test) && (cd packages/frontend && npm test) \
  && echo "SC-005 ✓" || echo "SC-005 FAIL"

# SC-006: zero @TODO comments in components/profile/
grep -rn "@TODO" packages/frontend/src/components/profile/ \
  && echo "SC-006 FAIL: @TODO remains" || echo "SC-006 ✓"
```
