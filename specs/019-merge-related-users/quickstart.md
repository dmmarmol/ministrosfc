# Quickstart - Merge Related Users (Spec 019)

## Prerequisites

- Node and npm versions compatible with root `package.json` engines.
- Services running: PostgreSQL and Redis.
- Environment variables configured for CMS and frontend.

## 1) Install and start

```bash
npm install
npm run docker:up
npm run dev:all
```

## 2) Seed baseline data

```bash
npm run seed:import
```

## 3) Core manual verification flow

1. Register a new user from auth flow and verify account is persisted as pending approval.
2. Authenticate as Editor or Admin.
3. Open pending approvals list in admin users section.
4. Verify each row includes: first name, last name, email, submission date, top merge suggestions.
5. Approve without merge and verify status becomes approved.
6. Register another user and approve with merge target selected; verify resulting user is linked to selected orphan player.
7. Register another user and deny with reason; verify user is deleted and decision is audited.
8. Validate post-approval merge from user edit view (`/admin/users/{userId}`).

## 4) Concurrency verification (optimistic lock)

1. Open same pending user in two reviewer sessions.
2. Perform approve action in session A.
3. Submit deny/approve in session B with stale `expectedUpdatedAt`.
4. Confirm API responds with `409 CONFLICT` and explanatory message.

## 5) Notification contract verification

1. Wire workflow to a fake sender implementing `NotificationSender`.
2. Force sender failure in `send`.
3. Ensure workflow calls `sendSafe` and approve/deny operation still returns success.
4. Confirm warning log is emitted.

## 6) Suggested tests to add in implementation phase

- CMS integration tests for pending queue, approve (merge/no-merge), deny, and optimistic lock conflict.
- CMS unit tests for matcher ranking and merge orchestration transaction rules.
- Frontend unit tests for review queue rendering and decision confirmations.
- Frontend route/access tests for `/admin/users/[userId]` editor+ access and page meta enforcement.
