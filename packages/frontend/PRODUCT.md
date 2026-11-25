# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: the club's own squad players, on their phones.** They open the site around matchdays: to see the next fixture, confirm they are playing, bring friends as guests, and look up results and their own stats afterward. Mobile is the main device, not a fallback.

Other audiences, confirmed from the codebase and README but secondary for design decisions:
- Public fans and families browsing roster, schedule and results without an account.
- Admins, editors and the DT (coach) who manage games, rosters, opponents, playgrounds, tournaments and users, mostly on desktop through the admin panel.

## Product Purpose

Ministros FC is the home of one specific amateur football club: roster and player profiles, fixtures and results, game signups with guest invitations, tournaments, and an admin CMS behind them. Success means players find and confirm their next game in seconds and the club's record of games and players keeps accumulating in one place instead of in chat threads and spreadsheets.

## Positioning

Its lasting value is the **stats and history archive**: a durable record of players, games, rivals and tournaments since 2023, with per-player career stats, stats by rival, by tournament and by year. A generic team-management app or a chat group does not hold this club's own history.

## Operating Context

- Signups happen close to kickoff, usually from a link shared in the team's chat, on a phone.
- Signed-in roles are Admin, Editor, DT and Player; guests invited by a player are not app users.
- Games move through scheduled, in progress, completed and cancelled states; results and stats derive from completed games.
- The public site is server-rendered; admin and signup flows require authentication and use a `returnUrl` to come back to where the user started.

## Capabilities and Constraints

- Web app built with Nuxt 4, Vue 3 and Nuxt UI on Tailwind v4, with a separate Nest.js API and a shared types package. The redesign keeps this stack.
- All user-facing copy is in Spanish and must stay in Spanish.
- Existing routes, data, permissions and behavior are preserved by any visual work.
- Deployed on Fly.io (frontend app in region `gru`).
- Undecided: whether a dark theme ships. A dormant dark token set exists but is not active.

## Brand Commitments

- The club name is **Ministros FC**, and "Desde 2023" (since 2023) is part of its identity.
- The real crest is a **black circle with white lines on it**. The maintainer has the file but it is not in the repository yet; it is to be supplied. Until then the interface uses an "M" monogram placeholder.

## Evidence on Hand

- Real data lives in the app database (players, games, opponents, tournaments); a `data/` directory exists at the repo root.
- No real crest or logo asset is in the repository. Do not invent or redraw one; wait for the maintainer's file.
- No testimonials, press or sponsor material exists. Do not fabricate any.

## Product Principles

1. **Players first, phone first.** Every decision is judged on how fast a squad player on a phone completes the next signup or finds a result.
2. **The archive is the product.** Stats and history deserve clear structure and permanence; the interface should make accumulated records feel worth keeping.
3. **One club, not a platform.** The site is the identity of Ministros FC specifically, not a generic team-management tool.
4. **Spanish, plain and short.** Copy stays direct and Spanish; labels must fit narrow screens.
5. **Admin work stays efficient.** Management screens favor speed and consistency over expression.
