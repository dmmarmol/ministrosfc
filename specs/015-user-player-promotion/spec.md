# Feature Specification: User-to-Player Promotion & Guest Merge

**Feature Branch**: `feat/015-user-player-promotion`  
**Created**: March 28, 2026  
**Status**: Draft  
**References**: None (new feature)

---

## Overview

Enable logged-in users (Admin, Editor, Player) to become registered players and support merging of guest player records into newly-created user accounts. This addresses two key gaps:

1. **Self-Promotion**: Admins and editors can promote themselves to player status, allowing them to participate in games while maintaining their admin/editor roles
2. **Guest-to-User Conversion**: When a guest player (invited friend) later creates their own user account, admin can merge their historical game participation from guest records into the new registered player account

---

## Problem Statement

### Current State

- A `User` record with `role="Admin"` or `role="Editor"` cannot play games (no linked Player)
- A guest player invited to games has no User account; if they later create one, their game history is orphaned
- No admin mechanism to link a User to a Player or convert guest participation to registered participation

### Desired State

- Admins and editors can create a Player profile for themselves
- Guest players in the system have a clear path to become registered players without losing history
- Admins can merge guest player records into new User accounts (e.g., "Friend of Diego" → "Diego Silva" user account)

---

## Functional Requirements

### FR-100: Admin/Editor Self-Promotion to Player

**Acceptance Criteria**:

1. **Given** an admin/editor is viewing their own profile in the CMS, **When** they click "Promote to Player", **Then** a form appears with fields for player-specific data (position, jersey number, nickname, date of birth, contact info)
2. **Given** an admin has filled in the player promotion form, **When** they click "Create Player Profile", **Then**:
   - A new Player record is created with `playerType="REGISTERED"`
   - The User.playerId is updated to link to the new Player
   - User.role remains unchanged (Admin/Editor status preserved)
   - The admin now appears in rosters and can participate in games
3. **Given** an admin has already promoted to player, **When** they visit their profile, **Then** they see their player info and can edit it (position, jersey, etc.) without re-promotion
4. **Given** an admin is promoting to player, **When** the page loads, **Then** jersey number availability is checked and conflicts are prevented (can't reuse active player jerseys in current season)
5. **Given** an admin promotes to player, **When** a game assignment is made, **Then** the admin can confirm participation and bring guests like a regular player

**Technical Notes**:

- Promotion is unidirectional; cannot "demote" (archive player instead)
- If an admin changes role from Admin→Player, they can then access player features
- User.role remains separate from Player existence; User.role=Admin + Player.id set is a valid state

---

### FR-101: Guest-to-User Merge

**Acceptance Criteria**:

1. **Given** a guest player ("Friend of [Player Name]") exists in the system with game history, **When** an admin views the guest player record, **Then** they see an option "This guest has a user account now"
2. **Given** admin clicks the merge option, **When** they search for and select the corresponding User, **Then** a dialog shows:
   - Guest player name and game history (X games since [date])
   - New user email and name
   - Proposed merge: "Link all guest participation to registered player"
3. **Given** admin confirms the merge, **When** the operation completes, **Then**:
   - A new Player record is created for the User (if not exist) with data from the guest player record
   - All GameParticipant records referencing the guest player are updated to reference the new registered player
   - The guest player record is marked INACTIVE
   - User.playerId is set to the new Player.id
4. **Given** a merge operation completes, **When** the registered player views their game history, **Then** they see all games (both guest and currently registered)
5. **Given** multiple guests invited by the same player try to merge, **When** the first completes, **Then** subsequent merges for related guests work correctly without data loss

**Technical Notes**:

- Merge is idempotent; re-merging same guest returns success with no duplicate records
- Contact info is preserved from most recent guest participation
- invitedById relationships are preserved for historical traceability
- The operation is atomic; if any step fails, entire merge is rolled back

---

### FR-102: Prevent Invalid Self-Promotion States

**Acceptance Criteria**:

1. **Given** an editor views their profile and clicks "Promote to Player", **When** required fields are missing, **Then** the form shows validation errors
2. **Given** an admin submits promotion with a jersey number already used by same position in active season, **When** they click save, **Then** an error prevents the save with message "Jersey number [X] already used by [Player Name]"
3. **Given** a Player role user (non-admin/editor) views their profile, **When** they look for promotion option, **Then** no promotion option appears (already a player)
4. **Given** an admin successfully promotes to player and later their role is changed to Player, **When** they log in, **Then** they can no longer access admin/editor functions (role-based access enforced)

---

## User Scenarios & Testing

### User Story 7 - Admin Self-Promotion to Participate in Games (Priority: P2)

An admin who manages the team also wants to play in games. They promote themselves to player status while retaining admin access to manage rosters and games. Later, guest friends create user accounts and the admin merges their game history.

**Why this priority**: Team leads often both manage and participate. Unblocks real-world workflow where admin + player roles overlap. P2 because core admin functions work without this.

**Independent Test**: Can be fully tested by admin promoting to player, appearing in game rosters, confirming participation, then merging a guest player's history into a new user account.

**Acceptance Scenarios**:

1. **Given** admin "Diego" is logged into CMS, **When** they navigate to their profile and click "Promote to Player", **Then** a form appears for position, jersey, DOB, contact
2. **Given** Diego fills form with position="Midfielder", jersey=15, and submits, **When** the form saves, **Then**:
   - Diego now appears in the "Active Players" roster
   - An API call to GET /api/v1/profile/player returns their player data
   - Diego can still access /admin (admin role preserved)
3. **Given** Diego is now a player, **When** an upcoming game is created, **Then** Diego can be manually assigned or can confirm participation and bring guests "Juan" and "Carlos"
4. **Given** Juan later creates a user account with email juan@example.com, **When** admin views Juan's guest record and clicks "User account created", **Then** they can search for and select "juan@example.com"
5. **Given** admin confirms the merge for Juan, **When** the operation completes, **Then**:
   - Juan's new Player record shows all games (both as guest and registered)
   - Juan can now log in and see their full game history
   - The guest record "Friend of Diego - Juan's game" is archived
6. **Given** Juan is now registered, **When** Juan logs in and navigates to /profile/player, **Then** they see all their games and stats (including games played as guest)

---

### Edge Cases

- **Multiple admins promoting simultaneously**: Both should succeed; jersey number validation prevents conflicts
- **Admin → Player → Admin role change**: Final role is Admin, player link persists but admin cannot access player features through admin UI (separate endpoint)
- **Guest with long history (20+ games)**: Merge operation completes successfully with all game records updated atomically
- **Duplicate merge attempt**: Idempotent; if user was already merged, re-merge returns success with no change
- **Guest invited by multiple players**: Guest is merged once; invitedById tracks original inviter
- **Admin deletes a guest player after merge**: Guest cannot be deleted if user account exists; must deactivate instead

---

## Data Model Implications

### Current User-Player Relationship

```prisma
model User {
  id        String    @id @default(uuid())
  playerId  String?   @unique  // One-to-one: User → Player
  player    Player?   @relation(fields: [playerId], references: [id], onDelete: SetNull)
}

model Player {
  id        String  @id @default(uuid())
  user      User?   @relation(fields: [user.playerId], references: [id])
  // User has playerId fk, so Player doesn't need reverse
}
```

### Post-Feature Data Model

**No schema changes needed**, but conceptual changes:

1. `User.playerId` can point to either:
   - A Player with `playerType="REGISTERED"` created via promotion
   - A Player with `playerType="REGISTERED"` created via guest merge
   - `null` if user hasn't promoted yet (editors, some admins)

2. One User can have only one Player linked (still 1:1)

3. Multiple Users cannot reference same Player (unique constraint on Player.id in User table)

4. Guest players have `playerType="GUEST"` and no linked User (or null user after cleanup)

5. After guest merge, the guest record becomes inactive; the new registered player is active

### No Database Migration Needed

- Schema already supports unlinked Users (playerId=null)
- Schema already supports REGISTERED players without users (guest parents who later get users)
- Guest-to-registered conversion simply creates new Player and updates GameParticipant FKs

---

## Implementation Approach

### Phase 1: Backend Endpoints

1. **POST /api/v1/admin/users/:userId/promote-to-player**
   - Input: { position, jerseyNumber, nickname, dateOfBirth, contactInfo }
   - Output: { success: true, player: { id, jerseyNumber, ... } }
   - Validates: jersey not in use for other active players in season
   - Creates: Player record with playerType=REGISTERED, links to User

2. **GET /api/v1/admin/players/merge-candidates?q=search_term**
   - Returns: Array of guest players matching criteria
   - Each entry: { playerId, name, guestOf, gameCount, lastPlayedDate }

3. **POST /api/v1/admin/players/:guestPlayerId/merge-into-user**
   - Input: { targetUserId }
   - Output: { success: true, mergedPlayerId, gamesMerged: 5 }
   - Operation:
     1. Validate guest player exists and targetUser exists but has no player
     2. Create new Player for targetUser with guest data
     3. Update GameParticipant records (guest FK → new registered FK)
     4. Deactivate guest player
     5. Update User.playerId
   - Atomic: rollback if any step fails

4. **GET /api/v1/admin/users/:userId/promotion-status**
   - Returns: { canPromote: boolean, reason?: string, existingPlayer?: { id, ... } }
   - Validation: Check jersey availability, role eligibility

### Phase 2: Frontend Pages

1. **CMS: Admin Profile Page Enhancement**
   - New "Player Profile" card showing:
     - If no player: Button "Promote to Player"
     - If player exists: Player info with "Edit" button
   - Promotion form modal:
     - Position dropdown (Goalkeeper, Defender, Midfielder, Forward)
     - Jersey number input (with real-time validation against /promotion-status endpoint)
     - Nickname input (optional)
     - Date of birth picker
     - Contact info fields (phone, address)
   - Save button → POST /api/v1/admin/users/me/promote-to-player

2. **CMS: Player Management → Merge Guest Players**
   - New section in player manage page
   - Search box: "Find guest players to merge"
   - Results table:
     - Guest name, games count, invitedBy, lastPlayedDate
     - Action button: "Merge to User Account"
   - Merge modal:
     - Shows guest info + game history (list of games)
     - Dropdown: "Select corresponding user account" (searchable, shows email)
     - Confirmation: "Merge [guest name] as registered player for [user email]?"
   - POST /api/v1/admin/players/:guestId/merge-into-user

### Phase 3: Frontend Pages (Player View)

1. **Player Profile: Game History Clarity**
   - "Games Played: X" shows all games (both guest-era and registered-era)
   - Optional: Badge/note "Played as guest of [Player Name]" for historical games if needed for clarity

---

## Testing Strategy

### Unit Tests

1. **ProfileService.promoteUserToPlayer(userId, playerData)**
   - Should create Player with REGISTERED type
   - Should update User.playerId
   - Should validate jersey not in use
   - Should reject if user already has player link

2. **ProfileService.mergeGuestToUser(guestPlayerId, userId)**
   - Should create new Player for user
   - Should update all GameParticipant records
   - Should deactivate guest player
   - Should be idempotent (re-run returns same result)

### Integration Tests

1. **Promotion Flow**
   - Admin calls promotion endpoint with valid data
   - Verify: User.playerId updated, Player created, appears in roster API
   - Verify: Admin can confirm game participation

2. **Merge Flow**
   - Guest player exists with 3 games
   - User account created for guest
   - Admin calls merge endpoint
   - Verify: GameParticipant records updated, user can see all games, guest record deactivated

3. **Jersey Validation**
   - Multiple admins try to promote with same jersey
   - First succeeds, second fails with validation error

4. **Concurrent Operations**
   - Admin promotes while guest merge is in progress
   - Both should complete without data corruption

### E2E Tests (Frontend)

1. **Admin Self-Promotion**
   - Login as admin
   - Navigate to profile
   - Click "Promote to Player"
   - Fill form, submit
   - Verify: Player card shows as promoted, can edit player info

2. **Guest Merge**
   - Login as admin
   - Navigate to Players → Merge Guests
   - Search for guest player
   - Click "Merge to User Account"
   - Select user from dropdown
   - Confirm merge
   - Verify: Success message, guest player hidden, new user can log in and see games

---

## Constraints & Assumptions

1. **No email confirmation needed** for promotion (admin account is already authenticated)
2. **Jersey numbers are per-season** (current season only for validation)
3. **Merge is one-way**: Cannot un-merge a guest; if mistake, must delete new player record and restore guest
4. **Admin role cannot be removed** via promotion (role and player status are independent)
5. **Guest player email is null** (no email for guests, so no collision risk in merge)

---

## Success Metrics

- ✅ Admins can promote to player in <2 minutes via CMS
- ✅ Guest player merge completes in <1 second (atomic transaction)
- ✅ Zero data loss from guest→user conversion
- ✅ All game history preserved and accessible post-merge
- ✅ No jersey conflicts or duplicate player records
