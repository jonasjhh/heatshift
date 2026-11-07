# Heatshift

**Secret gear shifts for up to 8 racers, revealed all at once.**

Heatshift is a phone app (a PWA) for the gear-shift step of the racing board
game _Heat: Pedal to the Metal_. Everyone at the table opens it on their own
phone, joins the same lobby, and picks a gear in secret. When the last
player locks in, every phone shows every player's gear at the same moment.

Live at **https://heatshift.jonasjhh-8b7.workers.dev**

> Heatshift is an unofficial fan-made companion. It isn't affiliated with or
> endorsed by the publishers of _Heat: Pedal to the Metal_. You still need
> the game to play: the app only handles choosing gears.

## Background

In _Heat_, every round starts with all players **shifting gears at the same
time**. Each player secretly decides how far up or down their gearbox to
move, and that gear decides how many cards they play and how fast their car
can go. A good shift depends on not knowing what the others chose. Will the
car beside you take the corner fast, or brake and let you through?

At the table, a fair simultaneous shift is harder than it sounds:

- Players wait to see what the others do before moving their own gear
  marker.
- Someone moves too early and gives their plan away, or changes their mind
  after seeing another player's gear.
- With many players, nobody is sure who has already shifted and who is
  still thinking.

Heatshift moves this one step onto the players' phones. Each player locks in
a gear privately. Nobody, not even the app on another phone, can see a pick
before everyone has chosen. Then all gears are revealed together. Everything
else (cards, the track, Heat, Stress, cooldown) stays on the board.

## How it works at the table

### 1. Join a lobby

- One player enters their name, picks a car colour and taps
  **Create a lobby**. The app shows a 4-letter lobby code and a QR code.
- Everyone else scans the QR code, opens the shared link (`/join/CODE`), or
  types the code on the start screen. They enter a name, pick a colour and
  join.
- **Car colours** are the six from the base game (red, blue, green, yellow,
  black, white), plus purple and orange so every player in a full lobby of 8
  has their own colour. A colour that's already taken in the lobby is crossed
  out. The colour is chosen **only before joining** and stays the same for
  the whole session.
- A lobby holds up to **8 players**. A 9th player is told the lobby is full.
- Your name and colour are remembered on your phone, so next time a link or
  QR code takes you straight in. If you refresh, or your phone sleeps and
  wakes up, you rejoin as the same player, with your gear and colour kept.

### 2. Start a round

Any player can tap **Start round** once everyone is in. Everyone in the lobby
at that moment takes part. A player who joins in the middle of a round sits
it out and plays from the next one.

### 3. Shift in secret

Each phone shows a shifter like the one on the player board: a vertical
4-3-2-1 gate with a **gear stick** sitting in your current gear.

- Tap a gear to move the stick there. Moving the stick sends nothing to the
  other players.
- The app follows _Heat_'s shifting rules:
  - everyone starts the race in **1st gear**;
  - staying in your gear, or shifting **one** gear up or down, is free;
  - shifting **two** gears costs **1 Heat**, shown by a red **+1 Heat** tag
    on that gear;
  - gears more than two away are dimmed and can't be picked.
- Gears 1 and 2 also show their cooldown (❄ 3 and ❄ 1), as on the board.
- Tap **Lock in gear N** to commit. The shifter is then replaced by a
  face-down **"?"** card, so nobody glancing at your phone can see your
  choice.
  - **Hold to peek** shows your gear only while you hold the button.
  - **Change my pick** takes your pick back and opens the shifter again, as
    long as the round hasn't been revealed yet.
- The player list shows who has **locked in** and who is still **choosing**,
  but never what anyone picked.

### 4. Reveal

When the last player locks in, every phone shows all gears at once: one card
per player in their car colour, with the new gear, the shift (for example
`1 → 3`) and **+1 Heat** where a gear was skipped. Phones buzz on the reveal
and when a new round starts.

Then everyone plays their cards on the board as normal, and any player taps
**Start round N** for the next shift.

### Other situations

- **Spin-out**: after a spin-out your car drops to 1st gear.
  **Spun out? Drop to 1st gear** sets your gear to 1 between rounds.
- **Lost connection**: a player whose phone drops off shows as _offline_. They
  rejoin automatically when the phone comes back. If they've really left,
  anyone can remove them. When the remaining players have all locked in,
  removing the last undecided player reveals the round.
- **Leaving**: **Leave** removes you from the lobby.
- The screen stays on while you're in a lobby, because a sleeping phone loses
  its connection.

### What the app doesn't do

- It doesn't track your Heat cards. It shows when a shift costs Heat, but
  you pay it on the board, and the app can't know whether your engine still
  has Heat to spend.
- It doesn't track cards, speed, the track or race positions.
- Lobbies aren't saved for later. A lobby nobody has used for 12 hours is
  deleted.

## Fairness and privacy

- Picks are checked on the server, not just on the phone. A gear out of reach
  is rejected, and a new round can't start while one is running.
- Before the reveal, the server only ever sends you **your own** pick. The
  other phones learn only whether you have locked in, not your gear. A
  modified app or a look at the network traffic can't reveal a pick early.
- There are no accounts. Each phone gets a random player ID stored on the
  device. Lobby data (names, colours, gears) exists only while the lobby does.

## Architecture

```
phones (React PWA)  ──WebSocket──▶  Cloudflare Worker (Hono)
                                       │
                                       └─▶ one Durable Object per lobby
                                           (players, round, picks, sockets)
```

- `shared/`: the parts both sides use.
  - `game.ts` holds the lobby and gear rules: joining, colours, rounds,
    shifting, the reveal, and each player's own view of the lobby.
  - `protocol.ts` defines the WebSocket messages and constants.
  - The rules are unit-tested in `shared/__tests__`.
- `worker/`: the Cloudflare Worker.
  - `POST /api/lobbies` creates a lobby and returns its code.
  - `GET /api/lobbies/:code` reports whether the lobby exists, how many
    players it has and which colours are taken.
  - `GET /api/lobbies/:code/ws` opens the lobby's WebSocket.
  - `worker/lobby.ts` is the `Lobby` Durable Object. It uses hibernatable
    WebSockets, keeps state in Durable Object storage, sends each socket its
    own view of the lobby, and deletes the lobby after 12 hours without use.
- `src/`: the React 18 + Vite PWA.
  - `screens/` holds the start screen and the lobby screen.
  - `components/` holds the shifter, the locked-in card, the reveal board,
    the player list, the colour picker and the invite panel with QR code.
  - `lobby/useLobby.ts` keeps the WebSocket open, reconnecting with backoff,
    when the phone wakes up and when the network comes back.
  - `lobby/useWakeLock.ts` keeps the screen on.
- The PWA can be installed to the home screen. A service worker caches the
  app itself; `/api` requests always go to the Worker.

## Development

    pnpm install
    pnpm worker:dev   # terminal 1: Worker + Durable Objects on :8789
    pnpm dev          # terminal 2: Vite on :5175, proxies /api (incl. WebSockets)

To try it with the built app only, run `pnpm build && pnpm worker:dev` and
open http://localhost:8789. Open it in several browser windows, or private
windows, to play as several players.

Checks (run them before every push):

    pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build

Work goes straight to `main`, without other branches (see `CLAUDE.md`).

## Infrastructure

Heatshift has its own infrastructure and shares none with kinetic or any
other app:

- **Cloudflare Worker** `heatshift`, served at `heatshift.<account>.workers.dev`
  (no custom domain and no routes).
- **Durable Object namespace** `Lobby`, bound only to this Worker. All lobby
  state lives in its storage. There is no KV, D1 or R2.
- **Deploy pipeline**: this repo's own `.github/workflows/deploy.yml`, using
  this repo's own Actions secrets.
- **Local dev ports**: Worker on 8789 (inspector 9230) and Vite on 5175, so it
  can run alongside kinetic (8788/9229/5174).

## Deploying

Every push to `main` deploys automatically through
`.github/workflows/deploy.yml`. To deploy by hand:

    pnpm worker:deploy

The workflow needs two repository secrets (Settings → Secrets and variables →
Actions):

- `CLOUDFLARE_API_TOKEN`: a token used only for heatshift. It needs just one
  permission, **Account → Workers Scripts → Edit**, limited to the account
  it deploys to.
- `CLOUDFLARE_ACCOUNT_ID`: the ID of that Cloudflare account.

The first deploy created the `Lobby` Durable Object class through the `v1`
migration in `wrangler.toml`.
