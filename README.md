# Heatshift

A PWA for picking gears in secret, for racing board games played around a
table such as _Heat: Pedal to the Metal_. Up to 8 players join a lobby on their
own phones. Anyone can start a round, and everyone picks a gear in secret. When
the last player has picked, all the choices are shown on every phone at once.

## How it plays

- **Joining**: one player taps _Create a lobby_ and gets a 4-letter code with
  a QR code. The others scan it, open the shared link (`/join/CODE`), or type
  the code. Your name is remembered, so next time a link or QR code takes you
  straight in. A refresh or a phone waking up from sleep rejoins as the same
  player.
- **Rounds**: any player can tap _Start round_. Everyone in the lobby when the
  round starts picks a gear. You can change or undo your pick until the last
  player locks in, and then all the picks are shown. A player who joins in the
  middle of a round plays from the next round.
- **Gear rules**: everyone starts in 1st gear. Staying in your gear or
  shifting one gear is free. Shifting two gears costs 1 Heat, which is marked
  on the picker and in the reveal. Gears more than two away can't be picked.
  The app doesn't track Heat cards, so pay the Heat on the board.
  _Spun out? Drop to 1st gear_ puts you back in 1st between rounds.
- **Dropped players**: a player shown as offline can be removed by anyone.
  If everyone else has already picked, removing them reveals the round.
- The screen stays on while you're in a lobby (Wake Lock). Phones buzz when a
  round starts and when the gears are shown.

## Architecture

- `shared/`: the lobby rules (`game.ts`) and the WebSocket message types
  (`protocol.ts`). The PWA and the Worker both use these, and the rules are
  unit-tested in `shared/__tests__`.
- `worker/`: a Cloudflare Worker (Hono).
  - `POST /api/lobbies` creates a lobby and returns its code.
  - `GET /api/lobbies/:code` checks that a lobby exists.
  - `GET /api/lobbies/:code/ws` opens the lobby's WebSocket.
  - Each lobby is one Durable Object (`worker/lobby.ts`) with hibernatable
    WebSockets. State is kept in Durable Object storage. Each socket gets its
    own view of the lobby, so nobody else's pick is sent before the reveal.
    A lobby nobody has used for 12 hours is deleted.
- `src/`: React 18 + Vite PWA. `src/lobby/useLobby.ts` keeps the socket open,
  reconnecting with backoff and on `visibilitychange`/`online`.

## Getting started

    pnpm install
    pnpm worker:dev   # terminal 1: Worker + Durable Objects on :8789
    pnpm dev          # terminal 2: Vite on :5175, proxies /api (incl. WebSockets)

To try it with the built app only, run `pnpm build && pnpm worker:dev` and
open http://localhost:8789.

## Checks

    pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build

## Infrastructure

Heatshift has its own infrastructure and shares none with kinetic or any
other app:

- **Cloudflare Worker** `heatshift`, served at `heatshift.<account>.workers.dev`
  (no custom domain, no routes on another app's zone).
- **Durable Object namespace** `Lobby`, bound only to this Worker. All lobby
  state lives in its storage, and there is no shared KV, D1 or R2.
- **Deploy pipeline**: this repo's own `.github/workflows/deploy.yml`, using
  this repo's own Actions secrets.
- **Local dev ports**: Worker on 8789 (inspector 9230) and Vite on 5175, so it
  can run alongside kinetic (8788/9229/5174).

For full isolation at the account level, create a Cloudflare API token just
for heatshift: _Edit Cloudflare Workers_ permissions, limited to the account
it deploys to. Don't reuse kinetic's token. You can also deploy to a
separate Cloudflare account; just set that account's ID as
`CLOUDFLARE_ACCOUNT_ID`.

## Deploying

    pnpm worker:deploy

Pushing to `main` also runs `.github/workflows/deploy.yml`. It needs the
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets set on this repo
(GitHub Actions secrets are per repo, so kinetic's are not visible here).
The app is served at `heatshift.<account>.workers.dev`. The first deploy
creates the `Lobby` Durable Object class through the `v1` migration in
`wrangler.toml`.
