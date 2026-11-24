---
name: create-release
description: "Generate a release for this project. Use when: cutting a new release, bumping version, updating CHANGELOG, preparing a new version entry, tagging a release. Prompts for major/minor/patch, reads git diff since last tag, drafts a CHANGELOG entry, updates package.json, package-lock.json, and CHANGELOG.md, commits them, and ALWAYS creates the annotated git tag vX.Y.Z on that commit."
argument-hint: "Optional: major | minor | patch | custom version (e.g., 1.0.0)"
---

# Create Release

Generates a versioned release by bumping `package.json`, prepending a new entry to `CHANGELOG.md`, committing both, and tagging the commit. Every release gets a git tag: a version without a tag cannot be found in history, diffed against, or used as the starting point for the next release's changelog (Step 3 reads the last tag).

## Files Modified

| File               | Change                     |
| ------------------ | -------------------------- |
| `package.json`     | `version` field bumped     |
| `package-lock.json`| `version` field bumped     |
| `CHANGELOG.md`     | New entry prepended at top |
| git history        | One `chore(release): X.Y.Z` commit and one annotated tag `vX.Y.Z` on it |

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
  - **Rule**: Never prefix the *version string* (`package.json`, CHANGELOG heading) with `v`. Alphanumeric suffixes (e.g., `-alpha`, `-rc.1`, `-beta`) are allowed. The *git tag* is the one place the `v` prefix is used (see Step 8).

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

### Step 8 — Commit and Create the Git Tag (always)

A release is not complete until it has a tag. Create it every time, without asking, once the user has confirmed the draft in Step 6.

1. **Check the tag does not already exist**: `git tag -l vX.Y.Z`. If it does, stop and report the conflict instead of moving or re-creating it (an existing tag may already be published). Ask the user how to proceed.
2. **Commit the release atomically** so the tag points at the commit that contains the version bump and changelog together:

   ```bash
   git add package.json package-lock.json CHANGELOG.md
   git commit -m "chore(release): X.Y.Z" -m "<one-line summary from the CHANGELOG>"
   ```

   Follow the `git-commit` skill conventions and append any attribution trailer the environment requires. Do not include unrelated files.
3. **Create an annotated tag on that commit**:

   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   ```

   Use an annotated tag (not lightweight): it records who tagged and when, and `git push --follow-tags` only pushes annotated tags.
4. **Tag name format**: `v` + the bare version, to match the existing tags (`v0.12.0`, `v0.13.0`, ...) and the project constitution. The version in files stays bare (`X.Y.Z`); only the tag has the `v`.
   - ✅ `git tag -a v1.0.0 -m "Release v1.0.0"`, `v1.0.0-rc.1`
   - ❌ `git tag 1.0.0` (no prefix), `git tag v1.0.0` (lightweight)
5. **Pushing is a separate, explicit step.** Publishing a tag is outward-facing, so do not push it on your own. Show the user the command and wait for them to say go, or let them run it:

   ```bash
   git push origin <branch> --follow-tags
   ```

   If the release commit is on a feature branch that will be squash-merged, tell the user the tag will point at a commit that is not on `main` after the squash. In that case, recommend re-tagging the squash commit on `main` after the merge (`git tag -a vX.Y.Z <squash-sha> -m "Release vX.Y.Z"`) and offer to do it.

### Step 9 — Confirm

Report:

- New version: `X.Y.Z`
- Files updated: `package.json`, `package-lock.json`, `CHANGELOG.md`
- Release commit: short SHA and message
- Git tag: "Created annotated tag `vX.Y.Z` on `<sha>`" and whether it has been pushed ("not pushed yet" unless the user ran or approved the push)

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
- [ ] No other files modified in the release commit
- [ ] User confirmed the draft before files were written
- [ ] Release changes committed in one `chore(release): X.Y.Z` commit
- [ ] Annotated git tag `vX.Y.Z` created on that commit (always, never skipped)
- [ ] Existing tag of the same name was not overwritten
- [ ] Tag was not pushed without the user's explicit go-ahead
