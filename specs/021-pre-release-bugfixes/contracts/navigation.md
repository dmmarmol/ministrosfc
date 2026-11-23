# Navigation Contract

## Shared `returnUrl` query parameter

Flows that open a nested create/edit route may include `returnUrl` to identify the originating application route. The value is read and written through the frontend's `useQueryParams` abstraction.

### Validation

- Accept only a well-formed same-application path beginning with exactly one `/`.
- Reject missing values, absolute URLs/origins, protocol-relative paths (`//...`), malformed encodings, backslashes, and values that resolve outside the application.
- On rejection or absence, use the fallback explicitly configured by the current flow; never navigate to the browser's referrer or an external destination.
- Preserve an accepted path's own query/hash only when the path remains internal.

### Game → team creation → game

1. Before leaving an unfinished game-create form, save its draft and participant identifiers in tab-scoped session storage.
2. Open team creation with `returnUrl=/admin/games/create`.
3. After successful team creation, save the returned team ID alongside the pending session draft, validate the return path, and navigate back.
4. On return to game creation, restore the draft, select the created team as opponent, and consume the stored draft.
5. Do not submit the game as part of team creation.

### Game save

- Successful create/update: navigate to a valid `returnUrl`; otherwise navigate to `/admin/games`.
- The admin games index must fetch current CMS data when opened after the save.

### Shared back action

The reusable `BackButton` honors a valid `returnUrl`; otherwise it navigates to its provided/configured `to` destination. Main admin back actions use this component rather than duplicate raw back links.
