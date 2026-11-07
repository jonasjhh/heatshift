import type { LobbySummary } from "../../shared/protocol";

export async function createLobby(): Promise<string> {
  const response = await fetch("/api/lobbies", { method: "POST" });
  if (!response.ok) throw new Error("Couldn't create a lobby. Try again.");
  const { code } = (await response.json()) as { code: string };
  return code;
}

export type LobbyCheck =
  | { status: "exists"; summary: LobbySummary }
  | { status: "missing" }
  | { status: "unreachable" };

export async function checkLobby(
  code: string,
  playerId: string,
): Promise<LobbyCheck> {
  try {
    const response = await fetch(
      `/api/lobbies/${code}?player=${encodeURIComponent(playerId)}`,
    );
    if (response.ok) {
      return {
        status: "exists",
        summary: (await response.json()) as LobbySummary,
      };
    }
    if (response.status === 404 || response.status === 400) {
      return { status: "missing" };
    }
    return { status: "unreachable" };
  } catch {
    return { status: "unreachable" };
  }
}

export function lobbySocketUrl(code: string): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/lobbies/${code}/ws`;
}
