export async function createLobby(): Promise<string> {
  const response = await fetch("/api/lobbies", { method: "POST" });
  if (!response.ok) throw new Error("Couldn't create a lobby. Try again.");
  const { code } = (await response.json()) as { code: string };
  return code;
}

export type LobbyCheck = "exists" | "missing" | "unreachable";

export async function checkLobby(code: string): Promise<LobbyCheck> {
  try {
    const response = await fetch(`/api/lobbies/${code}`);
    if (response.ok) return "exists";
    if (response.status === 404 || response.status === 400) return "missing";
    return "unreachable";
  } catch {
    return "unreachable";
  }
}

export function lobbySocketUrl(code: string): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/lobbies/${code}/ws`;
}
