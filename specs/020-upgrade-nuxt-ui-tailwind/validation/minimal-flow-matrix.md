# Minimal Flow Matrix

## Auth

- Flow: login
  - Entry: `/login`
  - Assertion: successful navigation away from login after valid submit
- Flow: register mode
  - Entry: `/login?mode=register`
  - Assertion: register mode headline visible (`Creá tu cuenta`)
- Flow: logout
  - Mode: opt-in (`E2E_ENABLE_LOGOUT_FLOW=1` + valid credentials)
  - Assertion: user can invoke logout action and return to `/login`

## Players

- Flow: list
  - Entry: `/players`
  - Assertion: route loads successfully
- Flow: detail
  - Entry: first `/players/:id` link from list
  - Assertion: navigates to player detail route when fixture data exists

## Admin Create

- Flow: user create
  - Entry: `/admin/users/create`
  - Assertion: route reachable after admin login
- Flow: game create
  - Entry: `/admin/games/create`
  - Assertion: route reachable after admin login
- Flow: player create
  - Entry: `/admin/players/create`
  - Assertion: route reachable after admin login

## Execution Notes

- Admin and authenticated flows are env-dependent and skipped when credentials are absent.
- Baseline gate requires zero failing tests; skipped tests are recorded in evidence.
