# Research Phase: User-to-Player Promotion Feature

**Date**: March 29, 2026  
**Status**: Complete  
**Purpose**: Resolve technical unknowns before design finalization

---

## Unknown 1: Audit Fields on Player Entity

**Question**: Does the current Player schema include `createdAt`, `createdBy`, `updatedAt`, `updatedBy` fields as required by constitution?

**Investigation Path**:

1. Read `packages/cms/prisma/schema.prisma` → search for `model Player` block
2. Check ProfileService.ts to see which fields are currently handled
3. Verify if audit fields are populated in existing player creation flows

**Impact if Missing**:

- Phase 1 design must include schema migration
- Promotion service must populate createdBy = requesting admin
- Merge operation must set auditFields correctly
- All tests must verify audit trail

**Decision Point**:

- [ ] If audit fields exist → continue to next unknown
- [ ] If missing → add migration task to Phase 2 task list

---

## Unknown 2: Jersey Number Validation Performance

**Question**: How should jersey availability be validated efficiently? Current roster sizes are 30-50 active players per season.

**Investigation Path**:

1. Check if Player has `season` or `year` field to scope validation
2. Review existing jersey conflict logic in game assignment flows
3. Check database indexes on (jerseyNumber, season, status) columns
4. Benchmark current query performance with 100+ player sample

**Impact if Slow**:

- Real-time jersey check endpoint may timeout
- Promotion form experience degrades
- Need to cache available jerseys or improve query

**Decision Point**:

- [ ] If <50ms query time → proceed with real-time validation endpoint
- [ ] If >500ms → implement jersey availability caching layer

---

## Unknown 3: Merge Transaction Safety & Atomicity

**Question**: What's the safest way to ensure atomic GameParticipant FK updates across guest→registered merge?

**Investigation Path**:

1. Review current Prisma transaction patterns in ProfileService.ts or other services
2. Check if project uses Prisma's `$transaction()` wrapper
3. Review existing atomic operations (e.g., game result recording with participant updates)
4. Test Prisma transaction rollback behavior on constraint violations

**Impact if No Pattern**:

- Risk of partial merges (guest deactivated but FK not updated)
- Data inconsistency visible to players
- Need to implement retry/compensation logic

**Decision Point**:

- [ ] If Prisma transactions available and tested → use in merge service
- [ ] If transaction support is spotty → use stored procedures or application-level locking

---

## Unknown 4: Guest Email Handling

**Question**: Do guest players have email field in current schema? How to handle email during merge?

**Investigation Path**:

1. Read Player schema in prisma.schema
2. Check if `contactInfo` embeds/relates email
3. Review any existing guest creation flows to see email handling
4. Check GameParticipant for contact data duplication

**Impact if Guests Have Email**:

- Merge must nullify guest email or link to new user email field
- Risk of email collision (guest "friend@example.com" vs new user email)
- May need email validation in merge endpoint

**Decision Point**:

- [ ] If no email on guests → proceed (no collision risk)
- [ ] If email exists → add email conflict check in merge validation

---

## Unknown 5: Idempotency & Merge Operation Strategy

**Question**: How to make merge operation safely re-runnable (idempotent)?

**Investigation Path**:

1. Check if PayerService or other services use idempotency keys or state tracking
2. Research Prisma upsert patterns for merge scenarios
3. Check existing soft-delete patterns to understand state tracking

**Impact if Not Idempotent**:

- Accidental double-merge creates duplicate Player records
- Admin must manual fix data inconsistencies
- Complex error handling needed

**Decision Point**:

- [ ] Implement merge idempotency via operation ID tracking in audit trail
- [ ] Or use Prisma's `upsert` pattern to prevent duplicates
- [ ] Or add pre-check: if user.playerId exists, return 400 "Already merged"

---

## Unknown 6: Current Auth/Admin Middleware

**Question**: What existing auth middleware protects admin endpoints? Can it be reused for promotion routes?

**Investigation Path**:

1. Review `packages/cms/src/middleware/auth.ts`
2. Check how admin role is verified (role==="ADMIN" or includes ADMIN?)
3. Review existing /api/v1/admin/\* routes for middleware pattern
4. Check how non-admins are rejected (403 vs 401)

**Impact if Different Pattern**:

- May need new middleware for editor + admin (both can promote)
- May need new middleware for specific promotion permission checks

**Decision Point**:

- [ ] If existing admin middleware is sufficient → reuse directly
- [ ] If editors also need access → extend middleware to check role in ["ADMIN", "EDITOR"]

---

## Research Tasks (Execution Order)

1. **[15 min]** Check Player schema for audit fields
2. **[15 min]** Check jersey validation query performance or create test
3. **[20 min]** Review Prisma transaction patterns in codebase
4. **[10 min]** Check guest email handling in Player/ContactInfo schema
5. **[15 min]** Research idempotency approach (operation ID vs upsert vs state check)
6. **[10 min]** Review existing admin middleware

**Total Estimated Time**: ~1.5 hours

---

## Findings

### Finding 1: Audit Fields

- Current state:
  - `Player` includes `createdAt` and `updatedAt`
  - `Player` does **not** include `createdBy` and `updatedBy`
  - `User` and `GameParticipant` follow the same pattern (`createdAt`/`updatedAt` only)
- Recommendation:
  - Add audit fields across entities impacted by this feature first (`Player`, `GameParticipant`), then expand to remaining entities in a separate hardening pass
  - For this feature, at minimum ensure promotion/merge operations populate `createdBy` and `updatedBy` for records they create/update
- Migration needed: [x] Yes [ ] No

### Finding 2: Jersey Validation

- Query performance:
  - No runtime benchmark executed in this phase
  - Existing validation already uses targeted filters: `status=ACTIVE`, `playerType=REGISTERED`, optional `id != excludeId`
  - Current expected scale (30-50 registered players) is low-risk for real-time checks
- Recommendation: [x] Real-time validation [ ] Cached [ ] Deferred
- Additional recommendation:
  - Add DB index optimization for jersey checks (composite index involving `playerType`, `status`, `jerseyNumber`) to future-proof growth
  - Keep the current `GET /profile/player/jersey-availability` pattern for UI pre-validation

### Finding 3: Merge Atomicity

- Current transaction pattern:
  - Project already uses Prisma interactive transactions (`prisma.$transaction(async (tx) => ...)`) in `ProfileService`
  - Bulk import script also uses transaction wrapper with timeout/maxWait options
- Recommended approach:
  - Implement guest->user merge as one interactive transaction containing:
    1. validation reads (guest/user/current links)
    2. player creation/linking
    3. `GameParticipant.playerId` reassignment
    4. guest deactivation
  - Fail fast and rollback entire operation on any conflict/error

### Finding 4: Email Handling

- Do guests have email: [ ] Yes [x] No
- Conflict risk:
  - `Player` has no email field
  - `Contact` has `phone`, `whatsapp`, `emergencyContact`, but no email
  - No email collision risk in merge flow
- Recommendation:
  - Use `User.email` as canonical identity for selecting merge target user

### Finding 5: Idempotency

- Recommended pattern:
  - Use state-based idempotency (no operation key required initially):
    - If `targetUser.playerId` already exists and guest is already inactive or no longer referenced by participants, return success with "already merged" semantic result
    - If guest is active and target user has no player link, execute merge
    - If target user has a different linked player while guest still active, return conflict
  - Keep this deterministic so retries are safe after network failures

### Finding 6: Auth Middleware

- Current pattern:
  - `authenticate` validates JWT and injects `req.user`
  - `requireRole` uses hierarchy (`ADMIN=4`, `EDITOR=3`, `DT=2`, `PLAYER=1`)
  - Existing routes use `requireRole("EDITOR")` to allow Editor+Admin and `requireRole("ADMIN")` for admin-only actions
- Editor access needed: [x] Yes [ ] No
- Recommendation:
  - For self-promotion and guest merge endpoints, use `authenticate + requireRole("EDITOR")`
  - This matches requested access (Admin + Editor) and excludes DT/Player

## Resolved Decisions

1. Promotion/merge feature does not currently exist and must be implemented as new service + routes.
2. No schema support today for `createdBy`/`updatedBy`; migration is required for constitutional compliance.
3. Real-time jersey validation is acceptable at current scale; add composite index for growth.
4. Merge operation should be transaction-based and state-idempotent.
5. No guest-email migration concern exists in current schema.
6. Existing RBAC middleware can be reused with `requireRole("EDITOR")`.

---

## Blockers

🟢 **None** — Research completed. Main implementation dependency is audit-field migration scope decision.

---

## Go/No-Go Decision

**Ready to proceed to Phase 1 Design when**:

- [x] All 6 unknowns researched and documented
- [x] Audit field gap identified (missing `createdBy`/`updatedBy`)
- [x] Transaction safety approach confirmed
- [x] Idempotency pattern selected

## Input Needed From User

Only one decision is needed before implementation starts:

1. Audit field rollout scope
   - Option A: Minimal scope for this feature only (`Player`, `GameParticipant`, and promotion/merge writes)
   - Option B: Full constitutional rollout now (all core entities in one migration)

If no preference is provided, default recommendation is **Option A** to keep delivery focused and reduce migration risk.
