# Feature Specification: Merge Related Users

**Feature Branch**: `019-merge-related-users`  
**Created**: 2026-04-24  
**Status**: Refined  
**Input**: User description: "New registrations require Admin/Editor approval. During approval, reviewers should get a curated list of related pre-existing players and merge data before approving. Email delivery is out of scope, but an interface contract for notifications is required."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Registration Waits for Approval (Priority: P1)

As a newly registered user, I submit my sign-up and remain in a pending state until an Admin or Editor approves or denies my request.

**Why this priority**: Controlled onboarding is the core governance requirement and protects data quality before public opening.

**Independent Test**: Create a new account and verify the account cannot use approved-user capabilities until a reviewer decision is recorded.

**Acceptance Scenarios**:

1. **Given** a person completes sign-up, **When** registration is saved, **Then** the account is marked as pending and cannot access player-authorized actions.
2. **Given** a pending user attempts to continue into approved-only app areas, **When** authorization is checked, **Then** access is denied with a clear pending-status message.
3. **Given** a pending user has not been reviewed yet, **When** an Admin or Editor checks the review queue, **Then** the user appears with enough profile details to review.

---

### User Story 2 - Admin/Editor Approves or Denies with Related-Match Review (Priority: P1)

As an Admin or Editor, I can approve or deny pending sign-ups and, before approval, I am prompted with a curated list of related existing players that may represent the same person.

**Why this priority**: The organization already has pre-populated player data, so preventing duplicate identities is essential for clean records.

**Independent Test**: Add a pending user and existing similar players; verify reviewers can see suggested matches, select a merge target, and complete approve/deny decisions.

**Acceptance Scenarios**:

1. **Given** a pending user exists, **When** a reviewer opens the request, **Then** the system shows suggested related players ordered by match confidence.
2. **Given** suggested related players are shown, **When** a reviewer selects one, **Then** the reviewer can approve and merge in a single confirmed action.
3. **Given** no suitable related player exists, **When** a reviewer approves without merge, **Then** approval still succeeds and user activation is completed as a standalone identity. The reviewer can later link the user to a player from the user edition screen at `/admin/users/{userId}`.
4. **Given** a pending user should not be admitted, **When** a reviewer denies the request, **Then** a denial reason is required in the confirmation flow, the user account is permanently erased from the system, and rejected-application data is not retained. The person may only re-enter the system by completing sign-up again.

---

### User Story 3 - Merged Identity Preserves User Credentials and Player History (Priority: P2)

As an Admin or Editor, when I merge a pending user with a pre-existing player, the resulting identity keeps user account credentials while preserving all relevant player data.

**Why this priority**: Merge correctness determines long-term data integrity for player records and sign-in identity.

**Independent Test**: Approve a pending user with merge selected, then verify resulting profile has user-owned account fields and retained player domain data.

**Acceptance Scenarios**:

1. **Given** a pending user is merged with an existing player, **When** merge completes, **Then** the resulting identity is an active user-player with user `firstName`, `lastName`, `email`, and `password` prevailing.
2. **Given** player-specific attributes already exist on the matched player, **When** merge completes, **Then** player domain attributes are preserved and attached to the merged identity.
3. **Given** merge is approved, **When** records are persisted, **Then** duplicate active identities for the same person are not left behind.

---

### User Story 4 - Notification Contract Is Ready for Future Email Service (Priority: P3)

As a developer, I need a notification service interface contract so approval/denial confirmation can be integrated later without redesigning user-approval flows.

**Why this priority**: Email delivery is out of current scope, but the approval workflow must expose a stable interface for future implementation.

**Independent Test**: Verify the approval workflow can call the contract methods with the expected payload shape and supports substitution by a future concrete provider.

**Acceptance Scenarios**:

1. **Given** a notification sender is initialized, **When** it is created, **Then** it accepts `{ to: string | string[] }` as the initialization payload.
2. **Given** approval workflow events occur, **When** notifications are triggered, **Then** the interface supports `.send(message: string, data: Record<string, string>)`.
3. **Given** CC or BCC delivery is required by policy later, **When** the workflow calls those methods, **Then** `.sendCC(...)` and `.sendCCO(...)` are available with the same message/data contract.

### Edge Cases

- A pending user has no related-player suggestions above the matching threshold: reviewer proceeds with approve-without-merge or deny.
- A pending user matches multiple players with similar confidence and reviewer changes decision before confirmation: reviewer can switch selection before confirming.
- A pending user email already exists in an approved account: blocked at sign-up level; not a merge-flow concern.
- A reviewer starts merge review while another reviewer approves or denies the same request concurrently: the second reviewer's submission MUST be rejected if a decision is already recorded (optimistic lock).
- Merge target player record has incomplete data while pending user has richer profile values: user-supplied credential fields prevail; other player domain fields are preserved as-is.
- **[RESOLVED] A reviewer approves without merge and later discovers the user should have been merged**: reviewer navigates to `/admin/users/{userId}` in the Admin panel (Usuarios nav, Admin & Editor only) and performs the merge from the user edition screen.
- **[RESOLVED] A pending user attempts to change email or profile data before review**: not possible — pending users cannot log in until a reviewer approves their request.
- **[RESOLVED] Merge target has archived/inactive player status**: the list of available merge targets includes players of ALL statuses (active and inactive).
- **[RESOLVED] Notification contract call fails during approve/deny flow**: approval or denial is persisted and the operation succeeds regardless of notification failure; failure is logged as a warning.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST create new sign-ups in a `PENDING_APPROVAL` state by default.
- **FR-002**: System MUST prevent pending users from accessing approved-user functionality until a reviewer decision is made.
- **FR-003**: System MUST provide Admin and Editor roles with a review queue of pending user requests. Each entry in the queue MUST display: full name, email address, submission date, and up to the top 5 match suggestions for that user.
- **FR-004**: System MUST allow Admin and Editor reviewers to approve or deny pending requests.
- **FR-005**: System MUST present a curated list of related existing players during pending-user review. Matching MUST rank candidates by: (1) `firstName` + `lastName` similarity first, then (2) `email` match if available. The curated suggestion list MUST include ONLY players not currently linked to any user account (orphan players) and MUST include only candidates with `matchScore >= 0.30`. Reviewers MUST also be able to manually search the full orphan-player directory to find a merge target that was not surfaced automatically.
- **FR-006**: System MUST allow reviewers to approve with merge, approve without merge, or deny the request.
- **FR-007**: System MUST require an explicit reviewer confirmation before executing a merge action, using a dedicated confirmation modal that clearly states the selected merge target and consequence.
- **FR-008**: When merge is approved, system MUST produce one resulting active user-player identity and avoid duplicate active identities for the same person.
- **FR-009**: During merge, user account fields `firstName`, `lastName`, `email`, and `password` from the pending user MUST prevail over corresponding values in the pre-existing player-linked identity.
- **FR-010**: During merge, player-domain data from the pre-existing player record MUST be preserved and attached to the resulting approved identity.
- **FR-011**: System MUST keep an auditable record of approval decisions (approve/approve+merge), reviewer identity, and timestamp. Post-approval merge actions from `/admin/users/{userId}` MUST also be audited with `approvedBy` and `approvedAt`.
- **FR-012**: Denial decisions MUST require a reviewer-provided reason in the denial request, then permanently erase the user account from the system without retaining rejected-application data. A denied person may reapply only by completing a new sign-up.
- **FR-017**: System MUST reject any approve/deny submission if a decision has already been recorded for the same pending request (optimistic lock). The concurrent reviewer MUST receive an explicit conflict error.
- **FR-018**: System MUST expose a user edition screen at `/admin/users/{userId}` accessible only to Admin and Editor roles, containing editable fields for `firstName`, `lastName`, and `email`, plus the same merge-player UI used in the pending-approval flow. This allows post-approval merge linking to be performed at any time.
- **FR-013**: System MUST expose a notification service interface contract for approval-flow notifications even if actual email delivery is not implemented in this feature.
- **FR-014**: The notification contract MUST support initialization with an object containing `{ to: string | string[] }`.
- **FR-015**: The notification contract MUST provide the following async methods, all returning `Promise<void>`: `.send(message: string, data: Record<string, string>)`, `.sendCC(message: string, data: Record<string, string>)`, and `.sendCCO(message: string, data: Record<string, string>)`.
- **FR-016**: The notification contract MUST additionally provide `.sendSafe(message: string, data: Record<string, string>): Promise<void>` — a variant that internally catches and suppresses rejection (logs a warning), enabling fire-and-forget usage in approval flows where notification failure must not block the operation. The contract SHOULD support extensibility for template-based sending and delivery-result reporting without breaking existing approval flow consumers.

### Key Entities _(include if feature involves data)_

- **Pending Registration Request**: A newly created user account awaiting reviewer decision; includes identity data, submission timestamp, and current decision status.
- **Reviewer Decision**: The approval or denial action taken by an Admin or Editor, including outcome, reason, actor, and audit timestamp.
- **Related Player Suggestion**: A candidate existing player record presented to the reviewer with match evidence and confidence rank.
- **Merge Resolution**: The resulting unified identity after approval+merge, including prevailing user credential fields and preserved player-domain attributes.
- **Notification Sender Contract**: An interface abstraction used by approval flow to request outbound messages without tying to a specific provider.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of newly registered users enter a pending state and remain blocked from approved-only actions until reviewer decision.
- **SC-002**: There is no mandatory time limit for reviewing pending registrations. Queue age visibility (submission date) is surfaced in FR-003 to support operational SLA decisions.
- **SC-003**: At least 90% of reviewer-confirmed merge candidates result in a merged identity with no duplicate active user-player records, with automated integration assertions that each successful merge leaves exactly one active user linked to the selected player.
- **SC-004**: 100% of approval decisions (approve/approve+merge) include reviewer identity, decision type, and timestamp in audit records.
- **SC-005**: For all approval-flow notification attempts, the workflow can invoke the notification contract methods successfully without dependency on a concrete email provider.

## Assumptions

- Existing player data has already been seeded before public onboarding opens.
- Matching criteria are configurable by product/operations and can be refined without changing the approval flow contract.
- Email transport implementation is explicitly out of scope for this feature; only contract exposure and approval-flow integration points are in scope.
