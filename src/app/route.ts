import { isValidLobbyCode, normalizeLobbyCode } from "../../shared/protocol";

// The only route is /join/CODE: the link players share, and the URL a
// player stays on while in a lobby so a refresh rejoins it.
const JOIN_PATH = /^\/join\/([^/]+)\/?$/i;

export function codeFromLocation(): string | null {
  const match = JOIN_PATH.exec(window.location.pathname);
  if (!match) return null;
  const code = normalizeLobbyCode(match[1]);
  return isValidLobbyCode(code) ? code : null;
}

export function joinUrl(code: string): string {
  return `${window.location.origin}/join/${code}`;
}

export function setLocationCode(code: string | null) {
  const path = code ? `/join/${code}` : "/";
  if (window.location.pathname !== path) {
    window.history.replaceState(null, "", path);
  }
}
