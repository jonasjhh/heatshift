import { isCarColor, type CarColor } from "../../shared/protocol";

// Who this device is, remembered across visits so a refresh or a phone that
// went to sleep rejoins the lobby as the same player.

const PLAYER_ID_KEY = "heatshift.playerId";
const NAME_KEY = "heatshift.name";
const LAST_LOBBY_KEY = "heatshift.lastLobby";
const COLOR_KEY = "heatshift.color";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode): identity lasts for this tab only.
  }
}

let sessionPlayerId: string | null = null;

export function getPlayerId(): string {
  const stored = read(PLAYER_ID_KEY);
  if (stored) return stored;
  sessionPlayerId ??= crypto.randomUUID();
  write(PLAYER_ID_KEY, sessionPlayerId);
  return sessionPlayerId;
}

export const getSavedName = () => read(NAME_KEY) ?? "";
export const saveName = (name: string) => write(NAME_KEY, name);

export function getSavedColor(): CarColor | null {
  const color = read(COLOR_KEY);
  return isCarColor(color) ? color : null;
}
export const saveColor = (color: CarColor) => write(COLOR_KEY, color);

export const getLastLobby = () => read(LAST_LOBBY_KEY);
export const saveLastLobby = (code: string | null) =>
  write(LAST_LOBBY_KEY, code);
