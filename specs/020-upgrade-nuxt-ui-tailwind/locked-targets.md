# Locked Dependency Targets

Lock date: 2026-04-28 (feature branch creation date)
Resolution timestamp: 2026-04-28
Registry provenance: npm registry via `npm view <pkg> version`

| Dependency  | Locked target version | Source command                 | Recorded by       |
| ----------- | --------------------: | ------------------------------ | ----------------- |
| nuxt        |                 4.4.2 | `npm view nuxt version`        | speckit.implement |
| @nuxt/ui    |                 4.7.1 | `npm view @nuxt/ui version`    | speckit.implement |
| tailwindcss |                 4.2.4 | `npm view tailwindcss version` | speckit.implement |

## Governance

- Targets are immutable for this feature lifecycle (FR-004).
- If incompatibilities appear, staged rollout can change execution order only, not target versions.
