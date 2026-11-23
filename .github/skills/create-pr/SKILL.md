---
name: create-pr
description: "Create a GitHub pull request with a conventional-commit title and a structured description (Summary, Why, Changes, Documentation). Use whenever the user asks to open, create, raise, or draft a pull request / PR, 'push this up for review', or 'PR this branch', even if they don't mention format. The title is `<type>(<main feature>): <description>`; the body has `# Summary`, `## Why`, `## Changes` (bullets) and `## Documentation` only when docs were added or changed."
argument-hint: "Optional: base branch (e.g. main) and/or a hint about the main feature"
---

# Create Pull Request

Open a PR whose title and description tell a reviewer what changed and why, without making them read the diff first. The structure is fixed so every PR in this repo reads the same way.

## 1. Gather context

Run these in parallel and read the results before writing anything:

```bash
git status -sb                      # uncommitted work? upstream set?
git branch --show-current
gh repo view --json defaultBranchRef -q .defaultBranchRef.name
git log --oneline <base>..HEAD      # the commits being proposed
git diff --stat <base>...HEAD       # size and areas touched
```

- **Base branch**: use the one the user names. Otherwise use the repo default from `gh repo view`. If the user's choice differs from the default, still honor it, but mention the difference and what it pulls in (for example, extra commits the base lacks).
- **Uncommitted changes**: stop and ask whether to commit them first (use the `git-commit` skill). A PR that silently omits local work is confusing.
- **Existing PR**: `gh pr list --head <branch>`. If one exists, offer to update its title/body (`gh pr edit`) instead of creating a duplicate.
- Read the specs, task lists or docs the branch touches (`specs/<id>/spec.md`, `tasks.md`, `docs/`). They hold the "why" that commit messages often lack.

## 2. Write the title

Format: `<type>(<main feature>): <description>`

- **type** follows Conventional Commits (`feat`, `fix`, `refactor`, `docs`, `chore`, `perf`, `test`, `build`, `ci`). Pick the type that matches the dominant change, not the first commit. A branch that mostly fixes bugs is `fix`, even if it adds a small helper.
- **scope in parentheses is the main feature developed**, not a package name. Ask: "what would a teammate call this piece of work?" Examples: `(pre-release-bugfixes)`, `(dark-mode)`, `(csv-import-jobs)`, `(user-approval)`. Prefer the feature or spec name over `(frontend)` or `(cms)`, because a PR usually spans packages and the feature is what a reviewer searches for.
- **description**: imperative, lowercase, no trailing period, aim for under 72 characters total. Say the outcome ("fix game save redirect and returnUrl handling"), not the activity ("work on games").
- If the branch carries several unrelated features, ask the user which one is the headline rather than inventing a vague scope.

## 3. Write the description

Use exactly this structure. Keep each section short; the commit log and diff hold the detail.

```markdown
# Summary
One to three sentences: what this PR delivers and its overall effect.

## Why
The motivation: the problem, bug report, spec or user need behind it. Link the spec, issue or QA doc when there is one. Explain why now, or why this approach, if that is not obvious.

## Changes
- Bullet per meaningful change, grouped by area when the list is long (use bold lead-ins like **Frontend:**, **CMS:**, **Shared:**).
- Lead with behavior ("Saving a game returns to a valid internal `returnUrl`"), not file names.
- Call out anything a reviewer must treat carefully: migrations, breaking changes, new env vars, regressions found and fixed along the way.

## Documentation
- Paths of docs added or updated, each with a few words on what it covers.
```

Rules for the sections:

- **`## Documentation` is conditional.** Include it only if the branch adds or changes documentation (files under `docs/`, `specs/`, `README`, `AGENTS.md`, `CHANGELOG`, runbooks, or inline guides). Detect this with `git diff --name-only <base>...HEAD | grep -Ei '\.md$|^docs/|^specs/'`. Omit the heading entirely when nothing qualifies; an empty section is noise.
- **Do not** add other top-level sections (no test plan, screenshots or checklists) unless the user asks. If there is something critical about testing, put it in a `## Changes` bullet.
- Write for someone who has not seen the conversation: no "as discussed", no references to the chat.
- Be accurate about what was verified. If tests were not run or something is known broken, say so in `## Changes` rather than implying it is clean.
- Append any attribution footer the environment requires (for example the "Generated with Claude Code" line) as the last line of the body.

## 4. Create it

1. Show the user the proposed title and body and the base/head branches. Skip the confirmation only if the user already told you to just create it.
2. Push the branch if it has no upstream: `git push -u origin <branch>`. Creating a PR requires the branch on the remote, so a request to open a PR covers this push.
3. Write the body to a temp file (use the session scratchpad, not the repo) and create the PR:

   ```bash
   gh pr create --base <base> --head <branch> --title "<title>" --body-file <file>
   ```

4. Report the PR URL, the base it targets, and the number of commits.

### If `gh` fails

- `Unauthorized ... Enterprise Managed User` or a 403/404 on the repo usually means the **active `gh` account** cannot access this repository. Run `gh auth status`, tell the user which account is active and which others are logged in, and ask them to run `gh auth switch --user <name>` (they can use the `!` prefix to run it in the session). Do not switch accounts yourself: it changes global state.
- If the user prefers not to switch, give them the prepared title and the body file path (or paste the body) so they can open the PR from the browser, plus the compare URL: `https://github.com/<owner>/<repo>/compare/<base>...<branch>`.
- Never retry the same failing command repeatedly; diagnose first.

## Example

Branch: dark mode work plus QA fixes, 23 commits, docs added.

**Title**

```
fix(pre-release-bugfixes): fix game save flow, roster filters and dark mode
```

**Body**

```markdown
# Summary
Delivers the pre-release QA fixes from spec 021: game save navigation, public roster behavior, dashboard cleanup, a dark mode that is legible on every surface, and the removal of the ambiguous "Temporada" competition type.

## Why
Manual QA in the dev environment surfaced bugs that block the first production release (BUGS-10_2026.md, `specs/021-pre-release-bugfixes`). Validating them in a real browser also exposed regressions that are fixed here.

## Changes
- **Frontend:** Saving a game returns to a validated internal `returnUrl` (or `/admin/games`) and the list is fresh; shared `BackButton`.
- **Frontend:** Roster shows status labels and searches across all registered players.
- **Frontend:** Dark mode is readable across public and admin pages, keeps the brand blue, and has an icon-only toggle in both headers.
- **CMS:** Removes `CompetitionType.SEASON`; the migration converts existing rows to `LEAGUE`.
- **Fix:** Editing a game no longer shifts its date by the UTC offset on each save.
- **Fix:** Admin team/playground/tournament forms no longer reload the page before redirecting.

## Documentation
- `docs/guides/MANUAL_QA_CHROME.md`: repeatable browser QA runbook.
- `AGENTS.md`: agent instructions derived from the Copilot instructions.
```
