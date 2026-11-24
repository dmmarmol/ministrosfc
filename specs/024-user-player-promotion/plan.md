# Implementation Plan: User-to-Player Promotion & Guest Merge

**Branch**: `feat/014-user-player-promotion`  
**Date**: March 28, 2026  
**Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/014-user-player-promotion/spec.md`

---

## Summary

Enable logged-in admins and editors to promote themselves to player status (FR-100), and support merging guest player records into newly-created user accounts when they register (FR-101). No database schema changes required; leverages existing one-to-one User↔Player relationship. Implementation adds 4 REST endpoints and 2 CMS UI sections, with atomic merge operations ensuring zero data loss.

---

## Technical Context

**Language/Version**: Node.js 18+, TypeScript 5.x, Nuxt 4, Vue 3  
**Primary Dependencies**: Express, Prisma ORM, Zod validation, object storage utilities  
**Storage**: PostgreSQL (Prisma managed)  
**Testing**: Jest (unit & integration), Playwright (E2E)  
**Target Platform**: Web (CMS admin dashboard + player dashboard)  
**Project Type**: Web monorepo (Express backend + Nuxt frontend)  
**Performance Goals**: Promotion endpoint <500ms, merge atomic operation <1s  
**Constraints**:

- Zero data loss on guest→user merge (atomic transaction)
- Jersey number validation must prevent conflicts in active season
- All promotion/merge operations require admin authentication
  **Scale/Scope**:
- Estimated 30-50 registered players per team
- Guest players typically 0-10 per game
- Merge operations expected quarterly, not frequent

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### From `.specify/memory/constitution.md`

- **"Use session storage to manage session data such as tokens"** → ✅ N/A for this feature (authentication already handled)
- **"Each record in the database must have: createdAt, createdBy, updatedAt, updatedBy"** → ⚠️ NEEDS IMPLEMENTATION
  - Player records must include these audit fields
  - Merge operation must set createdBy/updatedBy correctly
  - Current Player schema may be missing createdBy/updatedBy

**Gate Status**: ✅ **PASS with note** — Feature does not introduce new constitutional violations, but audit fields must be added to Player record if missing.

---

## Project Structure

### Documentation (this feature)

```text
specs/013-user-player-promotion/
├── spec.md                          # This feature spec (complete)
├── plan.md                          # This file (implementation plan)
├── research.md                      # Phase 0 output (research tasks)
├── data-model.md                    # Phase 1 output (ER diagram, schema)
├── quickstart.md                    # Phase 1 output (dev workflow)
└── contracts/                       # Phase 1 output (API contracts)
    ├── promotion-endpoints.md
    └── merge-endpoints.md
```

### Source Code (repository root)

```text
packages/cms/src/
├── routes/
│   └── promotion.ts                 # NEW: POST /promote-to-player, POST /merge
│   └── admin.ts                     # EXISTING: extend for GET merge candidates
├── services/
│   └── PromotionService.ts          # NEW: promoteUserToPlayer, mergeGuestToUser logic
│   └── PlayerService.ts             # EXISTING: may extend for jersey validation
├── middleware/
│   └── auth.ts                      # EXISTING: verify admin for promotion routes
└── tests/
    └── integration/
        ├── promotion.test.ts        # NEW: integration tests
        └── merge.test.ts            # NEW: merge operation tests

packages/frontend/src/
├── pages/
│   ├── admin/
│   │   └── profile.vue              # EXISTING: extend with promote button + form
│   └── admin/
│       └── players/
│           └── merge.vue            # NEW: merge guest players interface
├── components/
│   └── admin/
│       ├── PromotionForm.vue        # NEW: form for promotion data
│       └── MergeGuestModal.vue      # NEW: modal for merge confirmation
└── composables/
    └── usePromotion.ts              # NEW: API calls for promotion endpoints
    └── useMerge.ts                  # NEW: API calls for merge endpoints
```

---

## Phase 0: Outline & Research

**Status**: To be executed  
**Duration**: ~1-2 days  
**Unknowns to Resolve**:

1. **Audit Fields on Player**: Does current Player schema have createdBy/updatedBy? If not, scope a migration
2. **Jersey Validation Performance**: How to efficiently check jersey conflicts across season?
3. **Merge Transaction Safety**: What's the safest way to ensure atomic GameParticipant FK updates?
4. **Guest Email Handling**: Do guest players have email field? If yes, merge must handle email nullification
5. **Idempotency Pattern**: How to make merge operation safely re-runnable?

**Research Tasks**:

- [ ] Read current Player schema in prisma.schema and ProfileService.ts; verify audit field presence
- [ ] Check existing jersey validation logic in rosters/game assignment; identify performance patterns
- [ ] Review Prisma transaction documentation for atomic multi-table updates
- [ ] Analyze GameParticipant schema to understand FK structure before merge
- [ ] Identify idempotency strategy (e.g., merge operation ID, state tracking)

**Output**: `research.md` with findings + recommendations

---

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete  
**Status**: To be executed  
**Deliverables**:

1. ER diagram showing pre- and post-merge state
2. API endpoint contracts (request/response schemas)
3. Component hierarchy for CMS UI
4. Quickstart dev guide

### 1.1 Data Model (`data-model.md`)

**Entities Modified**:

- **Player** (existing)
  - Verify or add: `createdAt`, `createdBy`, `updatedAt`, `updatedBy`
  - Check: `playerType`, `status`, `invitedById` relationships
  - Confirm: Soft-delete support via status=INACTIVE

- **User** (existing)
  - Relationships: `playerId` (0..1) FK to Player
  - Verify: No other Player links needed

- **GameParticipant** (existing)
  - FK: `playerId` → Player
  - Merge operation will update this FK atomic-ally

**ER Diagram (pre-merge)**:

```
User (admin) ─── playerId: null
    │
    └─ (NO link initially)

Player (guest "Friend of Diego") ─ playerType: GUEST
    │
    ├─ invitedById: Diego's Player
    └─ GameParticipant (3 instances) ─── linked to games
```

**ER Diagram (post-merge)**:

```
User (admin Diego) ─── playerId: new_player_id
    │
    └─ Player (new registered) ─── playerType: REGISTERED
           │
           └─ GameParticipant (3 instances, updated FK) ─── linked to games

Guest Player (formerly "Friend of Diego") ─ status: INACTIVE, archived
```

### 1.2 API Contracts (`contracts/`)

**Endpoint 1: Promotion Status Check**

```
GET /api/v1/admin/users/:userId/promotion-status
Authorization: Bearer admin_token

Response (200):
{
  "canPromote": true,
  "reason": null,
  "jerseyAvailable": ["5", "7", "10"],
  "existingPlayer": null
}

Response (200, already promoted):
{
  "canPromote": false,
  "reason": "User already linked to player",
  "existingPlayer": {
    "id": "uuid",
    "name": "Diego Silva",
    "jerseyNumber": 15,
    "position": "Midfielder"
  }
}
```

**Endpoint 2: Promote to Player**

```
POST /api/v1/admin/users/:userId/promote-to-player
Authorization: Bearer admin_token

Request:
{
  "position": "Midfielder",
  "jerseyNumber": 15,
  "nickname": "Diego",
  "dateOfBirth": "1990-05-15",
  "contactInfo": {
    "phone": "+1234567890",
    "address": "123 Main St"
  }
}

Response (201):
{
  "success": true,
  "player": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Diego Silva",
    "position": "Midfielder",
    "jerseyNumber": 15,
    "nickname": "Diego",
    "playerType": "REGISTERED",
    "status": "ACTIVE",
    "createdAt": "2026-03-28T10:00:00Z",
    "createdBy": "admin_user_id"
  }
}

Response (409):
{
  "success": false,
  "error": "Jersey number 15 already in use by Player [id]"
}
```

**Endpoint 3: List Merge Candidates**

```
GET /api/v1/admin/players/merge-candidates?q=search_term&limit=20
Authorization: Bearer admin_token

Response (200):
{
  "candidates": [
    {
      "id": "guest_player_id",
      "name": "Friend of Diego",
      "guestOf": {
        "id": "parent_player_id",
        "name": "Diego Silva"
      },
      "gameCount": 3,
      "lastPlayedDate": "2026-03-23",
      "status": "ACTIVE",
      "contactInfo": { ... }
    }
  ]
}
```

**Endpoint 4: Merge Guest to User**

```
POST /api/v1/admin/players/:guestPlayerId/merge-into-user
Authorization: Bearer admin_token

Request:
{
  "targetUserId": "new_user_id"
}

Response (200):
{
  "success": true,
  "mergedPlayerId": "new_player_id",
  "gamesMerged": 3,
  "details": {
    "guestPlayer": {
      "id": "old_guest_id",
      "name": "Friend of Diego",
      "status": "INACTIVE"
    },
    "newPlayer": {
      "id": "new_player_id",
      "userId": "new_user_id",
      "name": "Juan Silva",
      "status": "ACTIVE",
      "playerType": "REGISTERED"
    },
    "gameParticipantsUpdated": 3
  }
}

Response (400):
{
  "success": false,
  "error": "Target user [id] already has a player link"
}

Response (409):
{
  "success": false,
  "error": "Merge conflict: Guest player jersey number already in use"
}
```

### 1.3 Component Hierarchy (`quickstart.md` section)

**CMS: Admin Profile Page**

```
AdminProfilePage
├── UserProfileCard
│   ├── Email, Name, Role
│   └── PlayerPromotionSection
│       ├── [If no player] "Promote to Player" button
│       └── [If player exists] PlayerCard + "Edit Player" button
│           └── PromotionFormModal (on button click)
│               ├── PositionSelect
│               ├── JerseyNumberInput (with live validation against endpoint)
│               ├── NicknameInput
│               ├── DateOfBirthPicker
│               ├── ContactInfoSection
│               │   ├── PhoneInput
│               │   └── AddressInput
│               └── [Save] [Cancel] buttons
```

**CMS: Players Management → Merge Tab**

```
PlayersManagementPage
├── Nav: [Active Players] [Guest Players] [Merge Guests]
│   └── MergeGuestsTab (active)
│       ├── SearchBox ("Search by guest name, invitedBy player")
│       ├── ResultsTable
│       │   ├── Col: Guest Name
│       │   ├── Col: Invited By
│       │   ├── Col: Games Count
│       │   ├── Col: Last Played
│       │   └── Col: Action ("Merge to User")
│       └── MergeGuestModal (on action click)
│           ├── GuestInfo (name, games, history)
│           ├── UserSelect (searchable, shows email)
│           ├── ConfirmationText
│           └── [Merge] [Cancel] buttons
```

### 1.4 Quickstart Guide

```bash
# Install and run backend tests
cd packages/cms
npm run test:integration -- tests/integration/promotion.test.ts

# Run CMS dev server
npm run dev

# Navigate to: http://localhost:3001/admin/profile
# Click "Promote to Player" button to see form
```

---

## Phase 2: Task Generation

**Status**: Pending Phase 1 completion  
**Process**: After Phase 1 design is complete, run `/speckit.tasks` to generate dependency-ordered implementation tasks  
**Expected Output**: `tasks.md` with:

- Backend implementation tasks (endpoints, service methods, validation)
- Database tasks (schema verification, audit fields)
- Frontend implementation tasks (components, forms, modals)
- Testing tasks (unit, integration, E2E)
- Docs tasks (API docs, deployment guide)

---

## Phased Implementation Timeline

### Backend (Parallel Streams)

**Stream 1: Promotion Service**

- [ ] Create PromotionService.ts with `promoteUserToPlayer()`
- [ ] Add POST /api/v1/admin/users/:userId/promote-to-player route
- [ ] Add jersey validation logic
- [ ] Add audit field handling (createdBy)
- [ ] Unit tests for promotion logic

**Stream 2: Merge Service**

- [ ] Create PromotionService.mergeGuestToUser() with transaction
- [ ] Add POST /api/v1/admin/players/:guestId/merge-into-user endpoint
- [ ] Add idempotency checks
- [ ] Integration tests for multi-table FK updates
- [ ] Error handling for conflicts

**Stream 3: Support Endpoints**

- [ ] Add GET /api/v1/admin/users/:userId/promotion-status
- [ ] Add GET /api/v1/admin/players/merge-candidates?q=...
- [ ] Add real-time jersey availability check

### Frontend (Parallel)

**Stream 1: Admin Profile Promotion**

- [ ] Create PromotionForm.vue component
- [ ] Create usePromotion.ts composable
- [ ] Extend admin/profile.vue with promotion section
- [ ] Add form validation (position, jersey, DOB)
- [ ] Live jersey availability feedback

**Stream 2: Guest Merge UI**

- [ ] Create MergeGuestModal.vue component
- [ ] Create useMerge.ts composable
- [ ] Add "Merge Guests" tab to players management
- [ ] Search and filter guest players
- [ ] User selection dropdown with email display
- [ ] Confirm merge with success feedback

### Testing

**Unit Tests** (40 tests estimated)

- Promotion validation, state transitions
- Merge atomicity, idempotency
- Jersey conflict detection
- Audit field population

**Integration Tests** (15 tests)

- Full promotion flow (API→DB)
- Full merge flow (guest→registered)
- Concurrent operations safety

**E2E Tests** (8 tests)

- Admin self-promotion happy path
- Guest merge workflow
- Error handling (jersey conflict, invalid user)

---

## Risk Mitigation

| Risk                         | Mitigation                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------- |
| Data loss during merge       | Atomic transaction with rollback; comprehensive integration tests            |
| Jersey conflicts             | Real-time validation endpoint + DB unique constraint                         |
| Concurrent promotions        | Database locks + optimistic concurrency pattern                              |
| Merge not idempotent         | State tracking (e.g., merge operation ID in audit trail)                     |
| Audit field missing          | Research phase identifies gap; schema migration in Phase 0 if needed         |
| Performance on large rosters | Jersey validation uses indexed queries; merge uses optimized FK batch update |

---

## Success Criteria

- ✅ Admin can promote to player in <2 min via UI
- ✅ Guest merge atomic and zero-data-loss
- ✅ All game history preserved post-merge
- ✅ Jersey number conflicts prevented
- ✅ 95%+ test coverage on new services
- ✅ <500ms response time for promotion endpoint
- ✅ <1s merge operation completion

---

## Next Steps

**Recommended Workflow**:

1. Run `/speckit.plan` output → **Phase 0 research** (resolve unknowns)
2. Complete Phase 0 → **Phase 1 design** (finalize contracts + data model)
3. After Phase 1 approved → **Run `/speckit.tasks`** to generate ordered implementation tasks
4. Execute task list → `/speckit.implement` orchestrates backend/frontend/test parallel work

**Immediate Action**:

- [ ] Verify Player schema includes createdBy/updatedBy
- [ ] Run backend tests to ensure stable baseline before merge logic changes
- [ ] Schedule Phase 0 research review with team
