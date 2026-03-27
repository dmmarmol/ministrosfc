# Research: 015 — User Registration & Sign-In

**Date**: 2026-03-25
**Stack**: Node.js / Express 4 / Prisma 5 / PostgreSQL / Zod v4 / Nuxt 3 / Cloudinary

---

## Topic 1: Google OAuth with Express + google-auth-library

### Decision

Use the **Authorization Code flow** (server-side), not the ID Token / One Tap flow.

### Rationale

1. **Authorization Code flow is more secure for server-rendered apps.** The Nuxt frontend redirects the browser to Google's consent URL. Google redirects back to the CMS backend (`GET /api/v1/auth/google/callback?code=...`). The backend exchanges the code for tokens server-side — the access/ID token never touches the browser.

2. **The project already uses server-issued JWTs** (see `AuthService.generateTokens`). After verifying the Google ID token on the backend, we mint our own JWT + refresh token pair exactly like the existing `login()` and `register()` flows. No new token paradigm needed.

3. **One Tap / ID Token flow** requires posting a Google credential (JWT) from the frontend to the backend. It works but (a) requires embedding the Google client JS SDK in the Nuxt page, (b) has more CSRF surface, and (c) the Authorization Code flow is the officially recommended approach for web apps with a backend.

### Implementation Approach

**Flow:**

```
Frontend                        CMS Backend                         Google
   │                               │                                  │
   │── click "Google Sign-In" ────►│                                  │
   │   (window.location = backend) │                                  │
   │                               │── redirect to Google consent ───►│
   │                               │                                  │
   │                               │◄── callback with ?code= ────────│
   │                               │                                  │
   │                               │── exchange code for tokens ─────►│
   │                               │◄── {id_token, access_token} ────│
   │                               │                                  │
   │                               │── verify id_token ──────────────►│
   │                               │   (google-auth-library)          │
   │                               │                                  │
   │◄── redirect to frontend ─────│                                  │
   │    with JWT in query param    │                                  │
   │    (one-time, short-lived)    │                                  │
```

**Server-side token verification** using `google-auth-library`:

```ts
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI, // e.g. http://localhost:5102/api/v1/auth/google/callback
);

// Step 1: Generate consent URL
const authorizeUrl = client.generateAuthUrl({
  access_type: "offline",
  scope: ["openid", "email", "profile"],
  prompt: "select_account",
});

// Step 2: Exchange code for tokens
const { tokens } = await client.getToken(code);

// Step 3: Verify the ID token
const ticket = await client.verifyIdToken({
  idToken: tokens.id_token!,
  audience: process.env.GOOGLE_CLIENT_ID,
});
const payload = ticket.getPayload()!;
// payload.sub    → Google unique user ID (store as googleSubjectId)
// payload.email  → verified email
// payload.given_name / payload.family_name → first/last name
```

**Account linking logic** (in `AuthService`):

```
1. Look up User by googleSubjectId → found? Sign in.
2. Look up User by email → found? Link googleSubjectId, sign in.
3. Not found → create User (passwordHash: null) + Player, sign in.
```

**Google Cloud Console setup:**

1. Create project or use existing one.
2. APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web application).
3. Authorized redirect URI: `http://localhost:5102/api/v1/auth/google/callback` (dev), plus production URL.
4. Copy Client ID and Client Secret.

**Required environment variables** (add to `.env` and `auth.ts` config):

```
GOOGLE_CLIENT_ID=<from GCP console>
GOOGLE_CLIENT_SECRET=<from GCP console>
GOOGLE_REDIRECT_URI=http://localhost:5102/api/v1/auth/google/callback
```

**Frontend redirect after callback:**
The CMS callback handler mints JWT tokens and redirects to the Nuxt frontend:

```
302 → http://localhost:5103/auth/google/callback?token=<accessToken>&refresh=<refreshToken>
```

The Nuxt page at `/auth/google/callback` reads the query params, stores them in the auth store (same as login), clears the URL, and navigates to the appropriate landing page. The tokens are in the URL fragment only momentarily and consumed immediately.

### Alternatives Considered

| Alternative                    | Why rejected                                                                                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **One Tap / ID Token flow**    | Requires Google JS SDK on frontend, more CSRF surface, not recommended for apps with backends                                                               |
| **Passport.js**                | Adds a large dependency with session-based abstractions; the project uses stateless JWTs — using `google-auth-library` directly is simpler and more aligned |
| **NextAuth / nuxt-auth-utils** | Opinionated full-stack auth frameworks; would conflict with existing custom JWT/Redis auth infrastructure                                                   |

---

## Topic 2: Prisma Migration Strategy for User.name → firstName + lastName

### Decision

Use a **three-step custom SQL migration** within a single Prisma migration folder.

### Rationale

Prisma's `migrate dev` auto-generates SQL that drops `name` and adds `firstName`/`lastName` as separate operations — it cannot backfill data. A custom migration lets us do it atomically.

### Implementation

**Step 1: Update `schema.prisma`**

```prisma
model User {
  // Remove: name String
  firstName    String   @db.VarChar(255)
  lastName     String   @db.VarChar(255)
  // ... rest unchanged
}
```

**Step 2: Generate the migration skeleton, then edit the SQL**

```bash
cd packages/cms
npx prisma migrate dev --create-only --name split_user_name_fields
```

This creates the migration folder but does NOT run it. Edit the generated `migration.sql`:

```sql
-- Step 1: Add new columns (nullable initially so existing rows don't fail)
ALTER TABLE "User" ADD COLUMN "firstName" VARCHAR(255);
ALTER TABLE "User" ADD COLUMN "lastName" VARCHAR(255);

-- Step 2: Backfill data — split on first space
UPDATE "User"
SET
  "firstName" = CASE
    WHEN POSITION(' ' IN "name") > 0
    THEN LEFT("name", POSITION(' ' IN "name") - 1)
    ELSE "name"
  END,
  "lastName" = CASE
    WHEN POSITION(' ' IN "name") > 0
    THEN SUBSTRING("name" FROM POSITION(' ' IN "name") + 1)
    ELSE ''
  END;

-- Step 3: Make columns required after backfill
ALTER TABLE "User" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "lastName" SET NOT NULL;

-- Step 4: Drop old column
ALTER TABLE "User" DROP COLUMN "name";
```

**Step 3: Run the migration**

```bash
npx prisma migrate dev
```

**Why not two separate migrations?**
Single migration = single transaction in PostgreSQL. If backfill fails, everything rolls back. Two migrations risk an intermediate state where `firstName`/`lastName` exist but are null.

### Also apply to Player.name → firstName + lastName

The `Player` model also has a single `name` field. Apply the same pattern in the same migration (or a second migration immediately after) for consistency with the spec's FR-017 and the fact that Player inherits first/last from User.

```sql
ALTER TABLE "Player" ADD COLUMN "firstName" VARCHAR(255);
ALTER TABLE "Player" ADD COLUMN "lastName" VARCHAR(255);

UPDATE "Player"
SET
  "firstName" = CASE
    WHEN POSITION(' ' IN "name") > 0
    THEN LEFT("name", POSITION(' ' IN "name") - 1)
    ELSE "name"
  END,
  "lastName" = CASE
    WHEN POSITION(' ' IN "name") > 0
    THEN SUBSTRING("name" FROM POSITION(' ' IN "name") + 1)
    ELSE ''
  END;

ALTER TABLE "Player" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "Player" ALTER COLUMN "lastName" SET NOT NULL;
ALTER TABLE "Player" DROP COLUMN "name";
```

### Alternatives Considered

| Alternative                   | Why rejected                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------- |
| **Let Prisma auto-generate**  | Auto-gen drops `name` and adds new columns with no backfill — data loss       |
| **Two separate migrations**   | Risk of intermediate state; single transaction is safer                       |
| **App-level backfill script** | Runs outside the migration transaction; can fail leaving schema/data mismatch |

---

## Topic 3: Adding Enum Values to Prisma PostgreSQL Enums

### Decision

Prisma **handles this automatically** — just add `DT` to the `Role` enum in `schema.prisma` and run `migrate dev`.

### Rationale

Since Prisma 4.x, adding a new value to a PostgreSQL enum generates a clean `ALTER TYPE "Role" ADD VALUE 'DT'` statement. This is a non-destructive DDL operation — existing rows are untouched.

### Implementation

```prisma
enum Role {
  ADMIN
  EDITOR
  DT        // ← add this
  PLAYER
}
```

```bash
npx prisma migrate dev --name add_dt_role
```

Generated SQL (auto):

```sql
ALTER TYPE "Role" ADD VALUE 'DT';
```

### Gotchas

1. **Enum ordering doesn't matter in PostgreSQL.** PostgreSQL enums have no implicit ordering used by queries. The app-level `ROLE_HIERARCHY` object in [rbac.ts](packages/cms/src/middleware/rbac.ts) defines the hierarchy — update that to include `DT: 2` and bump `ADMIN: 4, EDITOR: 3`.

2. **Cannot be rolled back in a transaction.** `ALTER TYPE ... ADD VALUE` cannot run inside a transaction in PostgreSQL < 12. Prisma handles this by running enum additions outside the transaction block. On PostgreSQL 12+ (which this project uses), it works in transactions.

3. **No impact on existing data.** Existing rows with `ADMIN`, `EDITOR`, or `PLAYER` are unaffected.

4. **Combine with other schema changes.** This can be in the same migration as the `googleSubjectId` and nullable `passwordHash` changes:

```prisma
model User {
  // ...
  passwordHash    String?           // ← make nullable (Google-only users have no password)
  googleSubjectId String?  @unique  // ← new field
}
```

### Alternatives Considered

| Alternative                        | Why rejected                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Custom SQL migration**           | Unnecessary — Prisma auto-generates the correct `ALTER TYPE` statement                           |
| **Replace enum with string field** | Loses type safety at the database level; enums are the right tool for a fixed small set of roles |

---

## Topic 4: Password Strength Validation with Zod v4

### Decision

Use a **single regex pattern** in a Zod pipe/refine, shared between frontend and backend via the `@ministrosfc/shared` package.

### Rationale

1. **Single regex is simpler and faster** than chained refinements. With chained `.refine()` calls, Zod v4 stops at the first failure — users don't see all failing rules at once. A single regex validates all at once, and we add per-rule feedback via a custom `superRefine`.

2. **Shared schema** ensures frontend and backend validation are identical. The project already has a `packages/shared` workspace package.

### Implementation

```ts
// packages/shared/src/validation/password.ts
import { z } from "zod";

/** Minimum 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character */
const PASSWORD_RULES = [
  { regex: /.{8,}/, message: "Mínimo 8 caracteres" },
  { regex: /[A-Z]/, message: "Al menos una letra mayúscula" },
  { regex: /[a-z]/, message: "Al menos una letra minúscula" },
  { regex: /[0-9]/, message: "Al menos un número" },
  { regex: /[^A-Za-z0-9]/, message: "Al menos un carácter especial (!@#$...)" },
] as const;

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(128, "Máximo 128 caracteres")
  .superRefine((val, ctx) => {
    for (const rule of PASSWORD_RULES) {
      if (!rule.regex.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: rule.message,
        });
      }
    }
  });

export { PASSWORD_RULES };
```

**Backend usage** (in `packages/cms/src/routes/auth.ts`):

```ts
import { passwordSchema } from "@ministrosfc/shared";

const registerSchema = z
  .object({
    email: z.string().email("Email inválido"),
    password: passwordSchema,
    passwordConfirmation: z.string(),
    firstName: z.string().min(1, "Requerido").max(255),
    lastName: z.string().min(1, "Requerido").max(255),
  })
  .refine((d) => d.password === d.passwordConfirmation, {
    message: "Las contraseñas no coinciden",
    path: ["passwordConfirmation"],
  });
```

**Frontend usage** (in the registration form composable):

```ts
import { passwordSchema, PASSWORD_RULES } from "@ministrosfc/shared";

// Real-time per-rule feedback in the UI
const passwordFeedback = computed(() =>
  PASSWORD_RULES.map((r) => ({
    ...r,
    passed: r.regex.test(form.password),
  })),
);
```

### Why `superRefine` over a single regex?

A single all-in-one regex like `/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/` validates all-or-nothing. Using `superRefine` with individual regex checks, we can report **all** failing rules at once — better UX. The schema is still a single Zod field, just with multiple issues.

### Alternatives Considered

| Alternative                        | Why rejected                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Single all-or-nothing regex**    | Users don't know which specific requirement failed                                                 |
| **Chained `.refine()` calls**      | Zod v4 short-circuits on first failure — users see only one error at a time                        |
| **Separate per-field refinements** | More verbose, same outcome as `superRefine` but less clean                                         |
| **zxcvbn library**                 | Overkill for this scale (~50 users); adds a 400KB dependency; explicit rules are clearer for users |

---

## Topic 5: Express Profile Photo Upload — Reusing Cloudinary Pattern

### Decision

**Generalize the existing `uploadPlayerPhoto` into a reusable `uploadPhoto(file, folder, entityId)` function**, keeping `uploadPlayerPhoto` and `deletePlayerPhoto` as thin wrappers for backward compatibility.

### Rationale

The existing [object-storage.ts](packages/cms/src/utils/object-storage.ts) has `uploadPlayerPhoto(file, playerId)` which hardcodes the folder to `players/{id}/photo`. The profile photo upload needs `users/{id}/photo`. Rather than duplicating the function, extract the common logic.

### Implementation

```ts
// packages/cms/src/utils/object-storage.ts

// NEW: Generic upload function
export async function uploadPhoto(
  file: UploadedFile,
  folder: string,
  entityId: string,
): Promise<string> {
  validatePhotoFile(file);

  const ext =
    path.extname(file.originalname).toLowerCase().replace(".", "") || "jpg";
  const publicId = `${folder}/${entityId}/photo`;

  const cld = getCloudinary();
  const result = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      cld.uploader
        .upload_stream(
          {
            public_id: publicId,
            resource_type: "image",
            format: ext,
            overwrite: true,
          },
          (err, res) => {
            if (err || !res)
              return reject(err ?? new Error("Cloudinary upload failed"));
            resolve(res as { secure_url: string });
          },
        )
        .end(file.buffer);
    },
  );
  return result.secure_url;
}

// EXISTING: Keep as backward-compatible wrapper
export async function uploadPlayerPhoto(
  file: UploadedFile,
  playerId: string,
): Promise<string> {
  return uploadPhoto(file, "players", playerId);
}

// NEW: User profile photo upload
export async function uploadUserPhoto(
  file: UploadedFile,
  userId: string,
): Promise<string> {
  return uploadPhoto(file, "users", userId);
}
```

**Profile route usage:**

```ts
// packages/cms/src/routes/profile.ts
router.put(
  "/photo",
  authenticate,
  upload.single("photo"),
  async (req, res, next) => {
    try {
      const file = req.file as UploadedFile;
      const photoUrl = await uploadUserPhoto(file, req.user!.userId);
      // Update both User and linked Player photoUrl
      await ProfileService.updatePhoto(req.user!.userId, photoUrl);
      res.json({ data: { photoUrl } });
    } catch (err) {
      next(err);
    }
  },
);
```

**Delete function** — generalize `deletePlayerPhoto` the same way:

```ts
export async function deletePhoto(photoUrl: string): Promise<void> {
  // ... same implementation as existing deletePlayerPhoto
}
export async function deletePlayerPhoto(photoUrl: string): Promise<void> {
  return deletePhoto(photoUrl);
}
```

### Alternatives Considered

| Alternative                                            | Why rejected                                                         |
| ------------------------------------------------------ | -------------------------------------------------------------------- |
| **Duplicate `uploadPlayerPhoto` as `uploadUserPhoto`** | Code duplication; same logic with different folder string            |
| **Single function with enum parameter**                | Over-engineered; `folder` string parameter is simpler and extensible |
| **Separate util file for user uploads**                | Splits related upload logic across files unnecessarily               |

---

## Summary of Decisions

| #   | Topic                            | Decision                                                                             |
| --- | -------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | Google OAuth flow                | Authorization Code flow via `google-auth-library` `OAuth2Client`                     |
| 2   | User.name → firstName + lastName | Single custom SQL migration: add columns → backfill → set NOT NULL → drop old column |
| 3   | Adding `DT` to Role enum         | Auto-handled by Prisma — just add to schema and `migrate dev`                        |
| 4   | Password strength (Zod v4)       | Shared `passwordSchema` using `superRefine` with per-rule regex checks               |
| 5   | Profile photo upload             | Generalize `uploadPhoto(file, folder, entityId)` in existing `object-storage.ts`     |

## New Dependencies

| Package               | Version | Purpose                                    | Justification                                                               |
| --------------------- | ------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| `google-auth-library` | `^9.x`  | Google OAuth token exchange + verification | Official Google library; no alternative for server-side OAuth code exchange |

No other new dependencies required. Zod v4 is already installed (^4.3.6). Multer and Cloudinary are already in use.
