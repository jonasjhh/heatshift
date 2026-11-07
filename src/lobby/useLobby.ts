import { useCallback, useEffect, useRef, useState } from "react";
import {
  PING,
  PONG,
  type ClientMessage,
  type LobbyView,
  type ServerMessage,
} from "../../shared/protocol";
import { getSavedColor } from "../app/identity";
import { checkLobby, lobbySocketUrl } from "./api";

export type ConnectionStatus =
  "connecting" | "open" | "reconnecting" | "missing" | "left";

export interface LobbyConnection {
  lobby: LobbyView | null;
  status: ConnectionStatus;
  // Latest error from the server, e.g. "This lobby is full".
  error: { message: string; at: number } | null;
  // Whether the server has ever accepted our join; a join error before
  // that (lobby full, bad name) means we're not in the lobby at all.
  joined: boolean;
  send: (message: ClientMessage) => void;
}

const PING_INTERVAL_MS = 20_000;
const MAX_BACKOFF_MS = 10_000;

// Keeps one WebSocket to the lobby open for as long as the screen is shown,
// reconnecting (and rejoining) after drops, sleep or network changes.
export function useLobby(
  code: string,
  playerId: string,
  name: string,
): LobbyConnection {
  const [lobby, setLobby] = useState<LobbyView | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<LobbyConnection["error"]>(null);
  const [joined, setJoined] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let stopped = false;
    let attempt = 0;
    let retryTimer: number | undefined;
    let pingTimer: number | undefined;
    let checking = false;

    const scheduleReconnect = () => {
      if (stopped) return;
      setStatus("reconnecting");
      const delay = Math.min(500 * 2 ** attempt, MAX_BACKOFF_MS);
      attempt += 1;
      retryTimer = window.setTimeout(connect, delay);
    };

    const connect = async () => {
      window.clearTimeout(retryTimer);
      if (stopped || checking || socketRef.current) return;

      checking = true;
      const check = await checkLobby(code, playerId);
      checking = false;
      if (stopped) return;
      if (check.status === "missing") {
        stopped = true;
        setStatus("missing");
        return;
      }

      const ws = new WebSocket(lobbySocketUrl(code));
      socketRef.current = ws;

      ws.onopen = () => {
        attempt = 0;
        ws.send(
          JSON.stringify({
            type: "join",
            playerId,
            name,
            // Read at every (re)join so a colour changed in the lobby
            // sticks after a reconnect.
            color: getSavedColor() ?? undefined,
          } satisfies ClientMessage),
        );
        pingTimer = window.setInterval(() => ws.send(PING), PING_INTERVAL_MS);
      };

      ws.onmessage = (event) => {
        if (event.data === PONG) return;
        const message = JSON.parse(String(event.data)) as ServerMessage;
        if (message.type === "state") {
          setLobby(message.lobby);
          setJoined(true);
          setStatus("open");
        } else if (message.type === "error") {
          setError({ message: message.message, at: Date.now() });
        } else if (message.type === "left") {
          stopped = true;
          setStatus("left");
          ws.close();
        }
      };

      ws.onclose = () => {
        window.clearInterval(pingTimer);
        if (socketRef.current === ws) socketRef.current = null;
        scheduleReconnect();
      };
    };

    // A phone coming back from sleep or a network switch shouldn't have to
    // wait out the backoff.
    const reconnectNow = () => {
      if (document.visibilityState !== "visible" || stopped) return;
      const ws = socketRef.current;
      if (!ws || ws.readyState === WebSocket.CLOSED) {
        attempt = 0;
        void connect();
      } else if (ws.readyState === WebSocket.OPEN) {
        ws.send(PING);
      }
    };

    void connect();
    document.addEventListener("visibilitychange", reconnectNow);
    window.addEventListener("online", reconnectNow);

    return () => {
      stopped = true;
      window.clearTimeout(retryTimer);
      window.clearInterval(pingTimer);
      document.removeEventListener("visibilitychange", reconnectNow);
      window.removeEventListener("online", reconnectNow);
      const ws = socketRef.current;
      socketRef.current = null;
      ws?.close();
    };
  }, [code, playerId, name]);

  const send = useCallback((message: ClientMessage) => {
    const ws = socketRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      setError({
        message: "Not connected — reconnecting…",
        at: Date.now(),
      });
    }
  }, []);

  return { lobby, status, error, joined, send };
}
