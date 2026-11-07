// The lobby's rules, kept free of WebSockets and storage so they can be
// unit-tested and run unchanged inside the Durable Object.

import {
  CAR_COLORS,
  GEARS,
  MAX_PLAYERS,
  normalizeName,
  type CarColor,
  type Gear,
  type LobbyView,
  type Phase,
  type RevealView,
} from "./protocol";

export interface PlayerState {
  id: string;
  name: string;
  color: CarColor;
  gear: Gear;
}

export interface LobbyState {
  code: string;
  phase: Phase;
  round: number;
  players: PlayerState[];
  // Players taking part in the round being chosen. Anyone joining mid-round
  // waits for the next one.
  inRound: string[];
  // Secret picks for the current round, keyed by player id.
  choices: Record<string, Gear>;
  lastReveal: RevealView | null;
}

export const STARTING_GEAR: Gear = 1;

export function createLobby(code: string): LobbyState {
  return {
    code,
    phase: "lobby",
    round: 0,
    players: [],
    inRound: [],
    choices: {},
    lastReveal: null,
  };
}

// Heat cost of a shift, or null if the shift isn't allowed. Shifting one
// gear up or down (or staying) is free; skipping a gear costs 1 Heat; more
// than two gears at once is not possible.
export function shiftCost(from: Gear, to: Gear): number | null {
  const distance = Math.abs(to - from);
  if (distance <= 1) return 0;
  if (distance === 2) return 1;
  return null;
}

export function allowedGears(from: Gear): Gear[] {
  return GEARS.filter((gear) => shiftCost(from, gear) !== null);
}

export function isGear(value: unknown): value is Gear {
  return GEARS.includes(value as Gear);
}

// Result: an error message for the player, or null on success.
type Outcome = string | null;

export function joinLobby(
  state: LobbyState,
  playerId: string,
  rawName: string,
  preferredColor?: CarColor,
): Outcome {
  const name = normalizeName(rawName);
  if (!name) return "Enter a name to join.";
  if (!playerId) return "Missing player id.";

  const existing = state.players.find((p) => p.id === playerId);
  if (existing) {
    // Rejoining (refresh, phone woke up): keep gear and round, update name
    // and take the preferred colour if it's still free.
    existing.name = name;
    if (preferredColor && isColorFree(state, preferredColor, playerId)) {
      existing.color = preferredColor;
    }
    return null;
  }
  if (state.players.length >= MAX_PLAYERS) {
    return `This lobby is full (${MAX_PLAYERS} players).`;
  }
  // A taken colour isn't an error: you get the first free one and can
  // change it in the lobby.
  const color =
    preferredColor && isColorFree(state, preferredColor, playerId)
      ? preferredColor
      : firstFreeColor(state);
  state.players.push({ id: playerId, name, color, gear: STARTING_GEAR });
  return null;
}

export function setColor(
  state: LobbyState,
  playerId: string,
  color: CarColor,
): Outcome {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return "You're not in this lobby.";
  if (!isColorFree(state, color, playerId)) {
    return "Another player already has that colour.";
  }
  player.color = color;
  return null;
}

export function takenColors(
  state: LobbyState,
  exceptPlayerId?: string,
): CarColor[] {
  return state.players
    .filter((p) => p.id !== exceptPlayerId)
    .map((p) => p.color);
}

function isColorFree(state: LobbyState, color: CarColor, playerId: string) {
  return !takenColors(state, playerId).includes(color);
}

// There are as many colours as seats, so a joining player always gets one.
function firstFreeColor(state: LobbyState): CarColor {
  const taken = takenColors(state);
  return CAR_COLORS.find((c) => !taken.includes(c)) ?? CAR_COLORS[0];
}

// Lobbies stored before colours existed get one per player.
export function upgradeLobby(state: LobbyState): LobbyState {
  for (const player of state.players) {
    if (!player.color) {
      player.color = firstFreeColor(state);
    }
  }
  return state;
}

export function removePlayer(state: LobbyState, playerId: string): void {
  state.players = state.players.filter((p) => p.id !== playerId);
  state.inRound = state.inRound.filter((id) => id !== playerId);
  delete state.choices[playerId];
  if (state.phase === "choosing") {
    if (state.inRound.length === 0) {
      state.phase = state.lastReveal ? "revealed" : "lobby";
      state.round -= 1;
    } else {
      revealIfComplete(state);
    }
  }
}

export function startRound(state: LobbyState, playerId: string): Outcome {
  if (!isMember(state, playerId)) return "You're not in this lobby.";
  if (state.phase === "choosing") return "A round is already in progress.";
  state.phase = "choosing";
  state.round += 1;
  state.inRound = state.players.map((p) => p.id);
  state.choices = {};
  return null;
}

export function chooseGear(
  state: LobbyState,
  playerId: string,
  gear: Gear,
): Outcome {
  if (state.phase !== "choosing") return "No round is being chosen.";
  if (!state.inRound.includes(playerId)) {
    return "You joined mid-round; you're in from the next round.";
  }
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return "You're not in this lobby.";
  if (!isGear(gear) || shiftCost(player.gear, gear) === null) {
    return `From gear ${player.gear} you can shift to ${allowedGears(player.gear).join(", ")}.`;
  }
  state.choices[playerId] = gear;
  revealIfComplete(state);
  return null;
}

export function clearChoice(state: LobbyState, playerId: string): Outcome {
  if (state.phase !== "choosing") return "Choices are already revealed.";
  delete state.choices[playerId];
  return null;
}

// After a spin-out a car drops to 1st gear.
export function spunOut(state: LobbyState, playerId: string): Outcome {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return "You're not in this lobby.";
  if (state.phase === "choosing" && state.inRound.includes(playerId)) {
    return "Wait for the reveal before changing your gear.";
  }
  player.gear = STARTING_GEAR;
  return null;
}

function revealIfComplete(state: LobbyState): void {
  if (!state.inRound.every((id) => state.choices[id] !== undefined)) return;

  const results = state.inRound.map((id) => {
    const player = state.players.find((p) => p.id === id)!;
    const to = state.choices[id];
    const result = {
      playerId: id,
      name: player.name,
      color: player.color,
      from: player.gear,
      to,
      heatCost: shiftCost(player.gear, to) ?? 0,
    };
    player.gear = to;
    return result;
  });

  state.lastReveal = { round: state.round, results };
  state.phase = "revealed";
  state.inRound = [];
  state.choices = {};
}

export function isMember(state: LobbyState, playerId: string): boolean {
  return state.players.some((p) => p.id === playerId);
}

// What one player is allowed to see: everyone's status, but only their own
// pick until the reveal.
export function viewFor(
  state: LobbyState,
  playerId: string,
  connected: ReadonlySet<string>,
): LobbyView {
  return {
    code: state.code,
    you: playerId,
    phase: state.phase,
    round: state.round,
    players: state.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      gear: p.gear,
      connected: connected.has(p.id),
      inRound: state.inRound.includes(p.id),
      hasChosen: state.choices[p.id] !== undefined,
    })),
    yourChoice: state.choices[playerId] ?? null,
    lastReveal: state.lastReveal,
  };
}
