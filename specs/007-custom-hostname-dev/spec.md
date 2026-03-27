# Feature Specification: Custom Hostname Dev Access

**Feature Branch**: `feat/007-custom-hostname-dev`  
**Created**: 2026-03-25  
**Status**: Draft  
**Input**: User description: "Allow the dev server to be accessible via both `localhost:{PORT}` and `localhost.ministrosfc.com:{PORT}`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Access Frontend via Custom Hostname (Priority: P1)

A developer wants to open the web app in a browser using `localhost.ministrosfc.com:5103` instead of `localhost:5103`. This allows testing behavior that depends on a non-generic hostname (e.g., cookie domain scoping, browser security policies tied to hostname patterns).

**Why this priority**: Without the frontend dev server accepting requests on the custom hostname, the URL resolves locally but the browser receives a refused connection. This is the core of the feature.

**Independent Test**: Start the frontend dev server, navigate to `localhost.ministrosfc.com:5103` in a browser, and verify the application loads fully with no connection errors.

**Acceptance Scenarios**:

1. **Given** the dev server is running and `/etc/hosts` maps `localhost.ministrosfc.com` to `127.0.0.1`, **When** a developer opens `localhost.ministrosfc.com:5103` in a browser, **Then** the application loads successfully with all pages and assets rendering correctly.
2. **Given** the frontend is already accessible at `localhost:5103`, **When** the custom hostname binding is configured, **Then** `localhost:5103` continues to work without any change to the developer's workflow.

---

### User Story 2 - API Calls Succeed from Custom Hostname Origin (Priority: P1)

When a developer uses the frontend via the custom hostname, in-browser API requests to the backend must succeed. Without CORS accepting the custom hostname as an allowed origin, all authenticated or data-fetching requests will be blocked by the browser.

**Why this priority**: Equal priority to Story 1 — loading the frontend is useless if every API call is rejected with a CORS error.

**Independent Test**: Open the app at `localhost.ministrosfc.com:5103`, perform any action that triggers an API call (e.g., log in, load a player list), and verify the request completes without a CORS error in the browser console.

**Acceptance Scenarios**:

1. **Given** the frontend is running at `localhost.ministrosfc.com:5103` and the backend is running, **When** the browser sends an API request, **Then** the backend responds with the appropriate CORS headers permitting the custom hostname origin and the request succeeds.
2. **Given** a developer is simultaneously using `localhost:5103`, **When** that origin sends an API request, **Then** it also succeeds — both origins are permitted at the same time.

---

### User Story 3 - Backend API Accessible via Custom Hostname (Priority: P2)

A developer may wish to call the backend API directly from a REST client or browser using `localhost.ministrosfc.com:5102`. This supports manual testing and tooling that benefits from the production-like hostname.

**Why this priority**: Lower priority because frontend-to-backend communication (Story 2) is more critical. Direct API access via the custom hostname is a convenience for manual testing.

**Independent Test**: Start the backend dev server, send a request to `localhost.ministrosfc.com:5102/api/v1/health`, and verify a valid response is returned.

**Acceptance Scenarios**:

1. **Given** the backend dev server is running, **When** a request is sent to `localhost.ministrosfc.com:5102`, **Then** the server responds normally.
2. **Given** `localhost:5102` is already working, **When** the custom hostname binding is added, **Then** `localhost:5102` continues to respond correctly.

---

### Edge Cases

- What if a developer has **not** added the `/etc/hosts` entry? Requests to `localhost.ministrosfc.com` will fail DNS resolution — this is expected and documented as a prerequisite, not handled by the code.
- What if the custom hostname is accessed over HTTPS? HTTPS is not in scope for this dev configuration; only HTTP is covered.
- What if both dev servers are started independently (not via `dev:all`)? Each must work in isolation — the custom hostname binding must not depend on both servers running simultaneously.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The frontend dev server MUST accept HTTP requests to `localhost.ministrosfc.com:5103`, serving the same application as `localhost:5103`.
- **FR-002**: The backend dev server MUST accept HTTP requests to `localhost.ministrosfc.com:5102`, responding the same as when accessed via `localhost:5102`.
- **FR-003**: The backend MUST allow cross-origin requests from `http://localhost.ministrosfc.com:5103` in addition to the existing `http://localhost:5103` allowlist entry.
- **FR-004**: The CORS allowlist MUST be configurable without modifying source code, using environment variables or local dev configuration files that are not committed to version control.
- **FR-005**: Both `localhost` and `localhost.ministrosfc.com` origins MUST be permitted simultaneously — no switching or toggling required.
- **FR-006**: The single `dev:all` command MUST start both servers with custom hostname support active, requiring no additional steps beyond having the `/etc/hosts` entry in place.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can open `localhost.ministrosfc.com:5103` in a browser and all pages load correctly, with zero connection errors.
- **SC-002**: All API requests made from the browser while using the custom hostname origin complete successfully, with zero CORS-related errors in the browser console.
- **SC-003**: Both `localhost` and `localhost.ministrosfc.com` access points function simultaneously with a single dev server startup command — no restart or config toggle required.
- **SC-004**: The custom hostname configuration requires zero source-code changes to enable or disable — it is fully controlled through environment or local config files.

## Assumptions

- The `/etc/hosts` entry (`127.0.0.1 localhost.ministrosfc.com`) is already present on the developer's machine. This is a prerequisite, not a deliverable of this feature.
- Port numbers remain unchanged: frontend on `5103`, backend on `5102`.
- This configuration applies to the **development environment only**. Production deployments are entirely out of scope.
- Only HTTP (not HTTPS) is covered for the dev environment.
- Developers use a standard modern browser that enforces CORS policies.
- The existing `localhost` behavior must be preserved as a zero-regression constraint.
