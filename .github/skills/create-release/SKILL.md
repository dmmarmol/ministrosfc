---
name: create-release
description: "Generate a release for this project. Use when: cutting a new release, bumping version, updating CHANGELOG, preparing a new version entry, tagging a release. Prompts for major/minor/patch, reads git diff since last tag, drafts a CHANGELOG entry, then updates package.json, package-lock.json, and CHANGELOG.md."
argument-hint: "Optional: major | minor | patch | custom version (e.g., 1.0.0)"
---

# Create Release

Generates a versioned release by bumping `package.json` and prepending a new entry to `CHANGELOG.md`.

## Files Modified

| File               | Change                     |
| ------------------ | -------------------------- |
| `package.json`     | `version` field bumped     |
| `package-lock.json`| `version` field bumped     |
| `CHANGELOG.md`     | New entry prepended at top |

## Procedure

### Step 1 — Determine Version Bump

If the user provided an argument, use it as-is (can be `major`, `minor`, `patch`, or a custom version like `1.0.0`).

Otherwise, ask:

> What kind of version bump is this?
>
> - **major** — breaking changes (consumers must update their code)
> - **minor** — new features, backwards compatible
> - **patch** — fixes, formatting, config changes, no new behavior
> - **custom** — specify exact version (e.g., `1.0.0`, `1.0.0-alpha-1`)

### Step 2 — Read Current Version & Compute New Version

Read `package.json` and extract the current `version` field.

- If `major`, `minor`, or `patch` was selected: increment the appropriate semver segment, reset lower segments to 0.
- If a custom version was provided: use it as-is.
- **Format rules (strictly enforced)**:
  - ✅ **CORRECT**: `1.0.0`, `1.0.0-alpha`, `1.0.0-rc.1`, `0.2.1-beta`
  - ❌ **INCORRECT**: `v1.0.0`, `v1.0.0-alpha`
  - **Rule**: Never prefix with `v`. Alphanumeric suffixes (e.g., `-alpha`, `-rc.1`, `-beta`) are allowed.

### Step 3 — Gather Changes via Git Diff

Run:

```bash
git log $(git describe --tags --abbrev=0 2>/dev/null)..HEAD --oneline 2>/dev/null || git log --oneline -30
```

This handles:

- Tags with optional `v` prefix (e.g., `v1.0.0`, `1.0.0`, `1.0.0-alpha-1`) — the command extracts them automatically
- No tags yet — falls back to last 30 commits
- Different tag prefixes — works with any format

Use the output to understand what changed. Present a **draft** CHANGELOG entry to the user and ask them to confirm or edit it before writing anything.

### Step 4 — Draft the CHANGELOG Entry

Use this exact format. Headings use bare semver with no `v` prefix (e.g., `## [1.2.0] - 2026-05-22`). Do not include sections with no content.

```
## [NEW_VERSION] - YYYY-MM-DD

### Summary

[One or two sentences describing the overall change. State whether this is a major (breaking), minor (new feature), or patch (fix/config/style) release.]

### Changed

- [Up to 5 bullets — behavioral changes to existing APIs or behavior]

### Added

- [Up to 10 bullets — new files, classes, exports, or capabilities]

### Fixed

- [Up to 10 bullets — bug fixes, security fixes, type corrections]

### Removed

- [Up to 10 bullets — deleted files, removed exports, deprecated APIs dropped]
```

### Step 5 — Generate a release/pr description

Use the same content from the CHANGELOG entry, but reformat it into a prose description suitable for a GitHub release or pull request description. For example:

```
# [NEW_VERSION] - YYYY-MM-DD

You can find the full changelog entry in [CHANGELOG.md](link-to-changelog-entry).

## Description
Brief summary of what the change is, or brief description of the new feature or the bug's description that is fixing.

## Changes' type/category
- [ ] Bug fix
- [ ] New feature
- [ ] Code refactoring
- [ ] CI-CD pipelines modification

## Additional Notes
If you mark one of the following options, please explain briefly.
- [ ] Notes for pre/post-release
- [ ] External dependencies like, database updates, tables storage, needs coordination with other teams, etc.
- [ ] New/Update configuration setting
```

Write the above content as markdown and let the user copy it for use in the release description or PR description.

**Limits (strictly enforced)**:

- Summary: prose, no bullets
- Changed: ≤ 5 bullets
- Added: ≤ 10 bullets
- Fixed: ≤ 10 bullets
- Removed: ≤ 10 bullets

Omit a section entirely if it has no items. Do NOT include an "Internal" section.

### Step 6 — Wait for User Confirmation

Present the full draft and ask:

> Does this look right? Reply with any corrections, or say "looks good" to proceed.

Do **not** write any files until the user confirms.

### Step 7 — Write the Files

Only after explicit confirmation:

1. **`package.json` + `package-lock.json`** — Run `npm version` with `--no-git-tag-version` so npm updates both files without creating a git commit or tag:
   ```bash
   npm version <new-version> --no-git-tag-version
   ```
   Use the exact bare semver string (e.g., `1.2.0`, not `v1.2.0`).
2. **`CHANGELOG.md`** — Prepend the confirmed entry at the top of the file (above the existing first entry). Keep the rest of the file unchanged.

Do **not** create any additional files or documentation.

### Step 8 — Create Git Tag (if prompted)

If the user explicitly requested to create a git tag, run:

```bash
git tag X.Y.Z
git push origin main --tags
```

**Important**: Tag name must follow the same format as the version (no `v` prefix).
- ✅ `git tag 1.0.0`
- ❌ `git tag v1.0.0`

### Step 8 — Confirm

Report:

- New version: `X.Y.Z`
- Files updated: `package.json`, `package-lock.json`, `CHANGELOG.md`
- Git tag status: "Created tag `X.Y.Z` and pushed to origin" (only if user requested)

## Quality Criteria

- [ ] Version follows semver or semver with alphanumeric suffix (`MAJOR.MINOR.PATCH` or `MAJOR.MINOR.PATCH-suffix`)
- [ ] **NO `v` prefix** on version string (e.g., `1.0.0`, NOT `v1.0.0`)
- [ ] Alphanumeric suffixes allowed if present (e.g., `1.0.0-alpha`, `1.0.0-rc.1`)
- [ ] `npm version --no-git-tag-version` was used — both `package.json` and `package-lock.json` updated
- [ ] Date is today's date in `YYYY-MM-DD` format
- [ ] CHANGELOG heading uses bare semver with no `v` prefix (e.g., `## [1.2.0] - 2026-05-22`)
- [ ] Summary indicates release type (major/minor/patch)
- [ ] Bullet counts respect section limits
- [ ] No sections included if they have no items
- [ ] No "Internal" section included
- [ ] No other files modified
- [ ] User confirmed the draft before files were written
- [ ] Git tag created only if explicitly prompted by user
- [ ] Git tag follows same no-`v` prefix format as version
