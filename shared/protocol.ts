// Messages exchanged over a lobby's WebSocket. Shared by the PWA and the
// Worker so both sides agree on the shape of every message.

export const MAX_PLAYERS = 8;
export const MAX_NAME_LENGTH = 20;
export const LOBBY_CODE_LENGTH = 4;
// No 0/O, 1/I/L or 5/S so a code read aloud across the table is unambiguous.
export const LOBBY_CODE_ALPHABET = "ABCDEFGHJKMNPQRTUVWXYZ2346789";

export type Gear = 1 | 2 | 3 | 4;
export const GEARS: readonly Gear[] = [1, 2, 3, 4];

// The six car colours of the base game, plus two extras so all 8 players
// in a full lobby can have their own colour.
export const CAR_COLORS = [
  "red",
  "blue",
  "green",
  "yellow",
  "black",
  "white",
  "purple",
  "orange",
] as const;
export type CarColor = (typeof CAR_COLORS)[number];
export const BASE_GAME_COLORS: readonly CarColor[] = CAR_COLORS.slice(0, 6);

export function isCarColor(value: unknown): value is CarColor {
  return CAR_COLORS.includes(value as CarColor);
}

export type Phase = "lobby" | "choosing" | "revealed";

export interface ShiftResult {
  playerId: string;
  name: string;
  color: CarColor;
  from: Gear;
  to: Gear;
  heatCost: number;
}

export interface RevealView {
  round: number;
  results: ShiftResult[];
}

export interface PlayerView {
  id: string;
  name: string;
  color: CarColor;
  gear: Gear;
  connected: boolean;
  // Whether this player takes part in the round being chosen right now.
  inRound: boolean;
  hasChosen: boolean;
}

export interface LobbyView {
  code: string;
  you: string;
  phase: Phase;
  round: number;
  players: PlayerView[];
  // Only your own pick is ever sent before the reveal.
  yourChoice: Gear | null;
  lastReveal: RevealView | null;
}

export type ClientMessage =
  | { type: "join"; playerId: string; name: string; color?: CarColor }
  | { type: "startRound" }
  | { type: "chooseGear"; gear: Gear }
  | { type: "clearChoice" }
  | { type: "spunOut" }
  | { type: "removePlayer"; playerId: string }
  | { type: "leave" };

export type ServerMessage =
  | { type: "state"; lobby: LobbyView }
  | { type: "error"; message: string }
  | { type: "left" };

// Answer to GET /api/lobbies/:code, used before joining to grey out the
// colours other players already have.
export interface LobbySummary {
  code: string;
  playerCount: number;
  takenColors: CarColor[];
}

// Sent as plain text so the Durable Object can answer it without waking up.
export const PING = "ping";
export const PONG = "pong";

export function normalizeLobbyCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, LOBBY_CODE_LENGTH);
}

export function isValidLobbyCode(code: string): boolean {
  return (
    code.length === LOBBY_CODE_LENGTH &&
    [...code].every((c) => LOBBY_CODE_ALPHABET.includes(c))
  );
}

export function normalizeName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
}
