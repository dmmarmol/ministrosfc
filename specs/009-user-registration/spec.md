# Feature Specification: User Registration & Sign-In

**Feature Branch**: `feat/009-user-registration`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "Allow user registration through the /login screen. Add a Sign In button and allow sign in by registering an email or by using Google"

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Email Registration (Priority: P1)

A new visitor arrives at the `/login` page and wants to create an account. They see two options: a traditional email/password form and a "Sign in with Google" button. They choose email registration, fill in their email and a password, and submit the form. The system creates their account, signs them in, and redirects them to the appropriate landing page based on their role.

**Why this priority**: Email registration is the foundational sign-up path — it works for all users regardless of whether they have a Google account, and it reuses the existing authentication infrastructure (JWT tokens, password hashing).

**Independent Test**: Can be fully tested by navigating to `/login`, clicking "Registrarse" (Sign Up), filling in valid email + password, and submitting. The user lands on the authenticated area and can log out and back in.

**Acceptance Scenarios**:

1. **Given** a visitor on the `/login` page, **When** they click the "Registrarse" link/button, **Then** a registration form is displayed with firstName, lastName, email, password, and password confirmation fields.
2. **Given** the registration form is visible, **When** the visitor enters a valid email and matching passwords that meet strength requirements, **Then** a new account is created and the user is automatically signed in and redirected.
3. **Given** the registration form is visible, **When** the visitor enters an email already associated with an existing account, **Then** a clear error message is shown: "Este correo ya está registrado" (This email is already registered).
4. **Given** the registration form is visible, **When** the visitor enters a password that does not meet strength requirements, **Then** the form shows validation feedback indicating the requirement (minimum 8 characters, at least one uppercase letter, one number, and one special character).
5. **Given** the registration form is visible, **When** the password and confirmation fields do not match, **Then** the form shows a validation error before submission.

---

### User Story 2 — Google Sign-In (Priority: P2)

A new or returning visitor on the `/login` page clicks "Iniciar sesión con Google" (Sign in with Google). They are redirected to Google's consent screen, authorize the app, and are redirected back. If they already have an account linked to that Google email, they are signed in. If not, a new account is automatically created and they are signed in.

**Why this priority**: Google sign-in reduces friction — no password to remember — but depends on external OAuth configuration and is a secondary path to the core email registration.

**Independent Test**: Can be fully tested by clicking the Google button on `/login`, completing the Google consent flow, and verifying the user lands on the authenticated area with their Google profile name/email visible.

**Acceptance Scenarios**:

1. **Given** a visitor on the `/login` page, **When** they click "Iniciar sesión con Google", **Then** they are redirected to Google's OAuth consent screen.
2. **Given** a visitor completes Google consent, **When** Google redirects back to the application, **Then** the system creates a new account (if none exists for that Google email) and signs the user in.
3. **Given** a visitor who previously registered via Google, **When** they click "Iniciar sesión con Google" again, **Then** they are signed into their existing account without creating a duplicate.
4. **Given** a visitor who previously registered via email with the same email address as their Google account, **When** they click "Iniciar sesión con Google", **Then** their existing account is linked to Google and they are signed in (account merging by email).
5. **Given** a visitor on Google's consent screen, **When** they cancel or deny authorization, **Then** they are returned to the `/login` page with an informational message.

---

### User Story 3 — Updated Login Page Layout (Priority: P1)

The existing `/login` page currently shows only an email/password sign-in form. It must be updated to include both sign-in and sign-up flows, plus the Google button, in a clear and intuitive layout. The page should toggle between "Sign In" and "Sign Up" modes.

**Why this priority**: The UI is the entry point for both US1 and US2 — without the updated layout, neither registration path is accessible to users.

**Independent Test**: Can be tested by loading `/login` and verifying: (a) email/password login still works as before, (b) a toggle/link switches to registration mode, (c) the Google sign-in button is visible in both modes.

**Acceptance Scenarios**:

1. **Given** a visitor on the `/login` page, **When** the page loads, **Then** the default view shows the existing email/password sign-in form with a "¿No tenés cuenta? Registrate" link and a "Iniciar sesión con Google" button.
2. **Given** a visitor viewing the sign-in form, **When** they click "Registrate", **Then** the form switches to registration mode showing firstName, lastName, email, password, and password confirmation fields, plus a "¿Ya tenés cuenta? Iniciá sesión" link to switch back.
3. **Given** a visitor in registration mode, **When** they click "Iniciá sesión", **Then** the form switches back to sign-in mode.
4. **Given** either sign-in or registration mode, **When** the page is displayed, **Then** the "Iniciar sesión con Google" button is always visible and accessible.

---

### Edge Cases

- What happens when a user registers via Google and later tries to log in via email/password with the same email? → They must set a password first (via a "set password" prompt or password-reset flow) to enable email login.
- What happens when Google's OAuth service is temporarily unavailable? → The Google button shows a disabled state or error toast; email registration remains functional.
- What happens when a user submits the registration form with JavaScript disabled? → The form gracefully degrades; server-side validation catches invalid input and re-renders with error messages.
- What happens when a registration attempt occurs during a network interruption? → The UI shows a "No se pudo conectar. Intentá de nuevo." message without losing form input.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The `/login` page MUST display both sign-in and sign-up forms, toggled by a link/button.
- **FR-002**: The registration form MUST collect firstName, lastName, email, password, and password confirmation.
- **FR-003**: Passwords MUST meet minimum strength requirements: at least 8 characters, one uppercase letter, one number, and one special character.
- **FR-004**: The system MUST validate that password and confirmation match before submission.
- **FR-005**: The system MUST reject registration if the email is already associated with an existing account, displaying a user-friendly error message.
- **FR-006**: Upon successful email registration, the system MUST automatically sign the user in and redirect to their role-appropriate landing page.
- **FR-007**: New accounts created via email registration MUST be assigned the PLAYER role by default.
- **FR-008**: The `/login` page MUST display a "Iniciar sesión con Google" button that initiates the Google OAuth flow.
- **FR-009**: When a user authenticates via Google for the first time, the system MUST create a new account using the Google profile's email and display name.
- **FR-010**: When a user authenticates via Google and an account with that email already exists, the system MUST link the Google identity to the existing account and sign them in.
- **FR-011**: The system MUST handle Google OAuth errors (user cancels, network failure) gracefully, returning the user to `/login` with an appropriate message.
- **FR-012**: Existing email/password login functionality MUST continue to work without regression.
- **FR-013**: All registration and sign-in form labels and messages MUST be in Spanish (matching the existing UI language).
- **FR-014**: The registration form MUST validate email format before submission.
- **FR-015**: Upon successful registration, the system MUST automatically create a Player record linked to the new User, with status=ACTIVE and firstName/lastName copied from the User.
- **FR-016**: Deactivated players (Player.status=INACTIVE) MUST still be able to log in and edit their own profile data. They MUST be excluded from game participation, roster selection, and active-player features.
- **FR-017**: The User model MUST replace the single `name` field with `firstName` and `lastName` fields. All existing references to `name` must be migrated.
- **FR-018**: ADMIN users MUST be able to promote a PLAYER to DT, EDITOR, or ADMIN; promote a DT to EDITOR or ADMIN; and promote an EDITOR to ADMIN.
- **FR-019**: ADMIN users MUST be able to demote EDITOR users to DT or PLAYER, and demote DT users to PLAYER. ADMINs MUST NOT be able to demote other ADMIN users.
- **FR-020**: ADMIN and EDITOR users MUST be able to deactivate (set Player.status=INACTIVE) players. Deactivation is a soft-disable, not deletion.
- **FR-021**: Only ADMIN users MUST be able to hard-delete Player records.
- **FR-022**: Role changes MUST be accessible from an admin user-management UI, not from the user's own profile.
- **FR-023**: The User.role enum MUST be extended with a new DT (Director Técnico / Coach) role. Role hierarchy: ADMIN (4) > EDITOR (3) > DT (2) > PLAYER (1).
- **FR-024**: DT users MUST be able to edit upcoming game tactics: set player positions and starting/bench status for game participants.
- **FR-025**: DT users MUST be able to add a guest player from the game edit screen.
- **FR-026**: The profile page MUST display a "Invitados" (Guests) section listing GUEST players that this user invited, with the guest's name, game opponent, date, and a link to the game.
- **FR-027**: Profile photo uploads MUST be stored in S3-compatible storage, consistent with the existing `Player.photoUrl` pattern. The uploaded image replaces the previous URL.
- **FR-028**: The profile page MUST allow users to edit: profile picture, firstName, lastName, birthdate, address, position, jersey number, and phone number.
- **FR-029**: When editing jersey number, the system MUST validate availability among ACTIVE REGISTERED players and display a tooltip listing already-assigned numbers.
- **FR-030**: The right side of the profile page MUST display a black football jersey SVG showing the selected jersey number and the user's lastName above it. Jersey colors MUST be configurable via CSS/Tailwind classes. This is cosmetic only.

### Key Entities

- **User**: Existing entity. Replace `name` (single string) with `firstName` and `lastName` fields. Gains an optional Google identity link (Google subject ID) and an optional password (users who register via Google may not have a password initially). Key attributes: email (unique), firstName, lastName, role (ADMIN/EDITOR/DT/PLAYER), password hash (nullable), Google subject identifier (nullable).
- **Player**: Existing entity. A Player record is automatically created and linked to the User upon successful registration. The Player inherits firstName/lastName from the User. Player.status starts as ACTIVE. A deactivated Player (status=INACTIVE) can still log in and edit their profile but is excluded from game participation, roster selection, and other active-player features. The profile page shows a list of GUEST players this user invited ("Friend of" history) with game & date.

## Clarifications

### Session 2026-03-25

- Q: When a guest self-registers and gets the PLAYER role, should a Player record be auto-created? → A: Yes, auto-create Player record on registration (profile fields editable immediately).
- Q: Can deactivated players still log in and edit their profile? → A: Yes. Deactivated (INACTIVE) players can authenticate and edit profile data, but are excluded from game participation and roster features. The role remains PLAYER; deactivation is a Player.status flag, not a role change.
- Q: Should role management (promote/demote) be in this spec or a separate one? → A: Include in this spec (015). Admin can promote PLAYER→DT→EDITOR→ADMIN, demote EDITOR→DT/PLAYER, DT→PLAYER, but cannot demote other ADMINs.
- Q: What does the "Friend of" section on the profile show? → A: Guest players that I invited — list of GUEST players this user brought to matches, with guest name, game, and date.
- Q: Should a DT (Director Técnico / Coach) role be added? → A: Yes. New role in hierarchy: ADMIN > EDITOR > DT > PLAYER. DT can edit upcoming game tactics (positions, starting/bench) and add guest players from the game edit screen. Full tactics editing UI is a future spec.
- Q: Where should uploaded profile photos be stored? → A: S3-compatible storage, consistent with existing Player.photoUrl pattern.
- Q: What fields should the registration form collect? → A: Email + password + firstName + lastName (minimum for a usable Player record). Position, jersey number, etc. are set later on the profile page.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A new user can complete email registration and reach the authenticated area in under 60 seconds.
- **SC-002**: A new user can complete Google sign-in and reach the authenticated area in under 30 seconds (excluding Google consent screen time).
- **SC-003**: 95% of registration attempts with valid data succeed on the first try.
- **SC-004**: Existing email/password login flows continue to work with zero regressions (all current login tests pass).
- **SC-005**: Duplicate email registration attempts are rejected 100% of the time with a clear error message.

## Assumptions

- The application's UI language is Spanish (Argentine dialect). All new labels, buttons, and error messages follow this convention.
- New self-registered users receive the PLAYER role by default. Promotion to DT, EDITOR, or ADMIN requires an existing Admin to change the role.
- Google OAuth requires a Google Cloud project with OAuth 2.0 credentials configured. The client ID and secret will be provided via environment variables.
- Password reset / "forgot password" functionality is out of scope for this feature. It may be addressed in a future spec.
- Email verification (confirming ownership of the email address) is out of scope for this feature. It may be addressed in a future spec.

## Out of Scope

- Password reset / forgot password flow
- Email verification / confirmation emails
- Social sign-in providers other than Google (e.g., Facebook, Apple)
- Admin-initiated user creation (already exists separately)
- Two-factor authentication (2FA)
