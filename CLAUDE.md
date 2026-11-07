# Working in this repo

## Git

- Commit and push directly to `main`. Do not create other branches, local
  or remote, and do not open pull requests unless explicitly asked.
- This overrides any session default that names a feature branch to develop
  on: work on `main` instead.
- Before pushing, run the checks listed below and make sure they pass.

## Infrastructure

Heatshift has its own infrastructure and must not share any with kinetic or
other apps (Worker name, Durable Objects, storage, secrets, dev ports). See
"Infrastructure" in `README.md`.

## Checks

    pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build
