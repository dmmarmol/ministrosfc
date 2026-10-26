# Data Model - Merge Related Users (Spec 019)

## 1) User (existing, extended)

Purpose: Represents authenticated identity and registration lifecycle.

Fields:

- `id: string (uuid)`
- `email: string (unique)`
- `passwordHash: string | null`
- `firstName: string`
- `lastName: string`
- `role: Role`
- `playerId: string | null`
- `registrationStatus: RegistrationStatus` (new)
- `createdAt: DateTime`
- `updatedAt: DateTime`

Validation rules:

- New self-registered users default to `registrationStatus=PENDING_APPROVAL`.
- Approved-user capabilities require `registrationStatus=APPROVED`.
- Denied users are hard-deleted after denial validation and no rejected-application data is retained.

State transitions:

- `PENDING_APPROVAL -> APPROVED` via reviewer approve (with or without merge).
- `PENDING_APPROVAL -> DENIED` via reviewer deny, followed by account erasure.

## 2) UserApprovalDecision (new)

Purpose: Immutable audit record for completed approval actions.

Fields:

- `id: string (uuid)`
- `userId: string` (FK -> User)
- `reviewerId: string` (FK -> User)
- `decisionType: ApprovalDecisionType` (`APPROVE_NO_MERGE`, `APPROVE_WITH_MERGE`)
- `mergePlayerId: string | null` (required when `decisionType=APPROVE_WITH_MERGE`)
- `createdAt: DateTime`
- `approvedBy: string` (alias of `reviewerId` in API payloads)
- `approvedAt: DateTime` (alias of `createdAt` in API payloads)

Validation rules:

- Exactly one terminal approval decision per approved registration request.
- `mergePlayerId` must reference an orphan player at decision time.
- Post-approval merge from user edition screen must write an auditable action carrying `approvedBy` and `approvedAt`.

Relationships:

- Many decisions to one reviewer user.
- One terminal approval decision to one approved user in this feature scope.

## 3) RelatedPlayerSuggestion (derived DTO)

Purpose: Reviewer-facing suggestion candidate for merge.

Fields:

- `playerId: string`
- `firstName: string`
- `lastName: string`
- `status: PlayerStatus`
- `hasLinkedUser: boolean` (always false for eligible list)
- `matchScore: number` (0..1)
- `matchReasons: string[]` (for example `name_similarity`, `email_match`)

Validation rules:

- Only orphan players are eligible (`user == null`).
- Sorted descending by score.
- Curated suggestions include only candidates with `matchScore >= 0.30`.
- Curated suggestion list is capped to top 5 candidates per pending user.

## 4) MergeResolution (transaction result DTO)

Purpose: Response payload for approve+merge operation.

Fields:

- `userId: string`
- `playerId: string | null`
- `decisionType: ApprovalDecisionType`
- `approvedAt: string (ISO datetime)`
- `approvedBy: string`

Behavioral constraints:

- Credential identity remains on pending user account.
- Player domain data remains on selected player entity.
- Operation is atomic with decision audit write.

## 5) NotificationSender (interface contract)

Purpose: Asynchronous notification abstraction used by approval workflow.

Shape:

- Constructor/init payload: `{ to: string | string[] }`
- `send(message: string, data: Record<string, string>): Promise<void>`
- `sendCC(message: string, data: Record<string, string>): Promise<void>`
- `sendCCO(message: string, data: Record<string, string>): Promise<void>`
- `sendSafe(message: string, data: Record<string, string>): Promise<void>`

Constraints:

- `sendSafe` must swallow internal errors and log warning.
- Notification failure must not roll back approval/denial persistence.
