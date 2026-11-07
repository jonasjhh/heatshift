import { DurableObject } from "cloudflare:workers";
import {
  chooseGear,
  clearChoice,
  createLobby,
  isGear,
  isMember,
  joinLobby,
  removePlayer,
  spunOut,
  startRound,
  viewFor,
  type LobbyState,
} from "../shared/game";
import {
  PING,
  PONG,
  type ClientMessage,
  type ServerMessage,
} from "../shared/protocol";

export interface Env {
  ASSETS: Fetcher;
  LOBBY: DurableObjectNamespace<Lobby>;
}

const STATE_KEY = "state";
// A lobby nobody has touched for this long is deleted.
const IDLE_LIFETIME_MS = 12 * 60 * 60 * 1000;

interface Attachment {
  playerId: string | null;
}

// One instance per lobby code. Uses hibernatable WebSockets, so the lobby
// state lives in storage and is reloaded whenever the object wakes up.
export class Lobby extends DurableObject<Env> {
  private state: LobbyState | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair(PING, PONG),
    );
    void this.ctx.blockConcurrencyWhile(async () => {
      this.state = (await this.ctx.storage.get<LobbyState>(STATE_KEY)) ?? null;
    });
  }

  // Called by the Worker when a new lobby code is handed out. Returns false
  // if the code is already in use so the Worker can pick another one.
  async create(code: string): Promise<boolean> {
    if (this.state) return false;
    this.state = createLobby(code);
    await this.save();
    return true;
  }

  async exists(): Promise<boolean> {
    return this.state !== null;
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected a WebSocket upgrade", { status: 426 });
    }
    if (!this.state) {
      return new Response("Lobby not found", { status: 404 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ playerId: null } satisfies Attachment);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    const state = this.state;
    if (!state || typeof raw !== "string") return;

    let message: ClientMessage;
    try {
      message = JSON.parse(raw) as ClientMessage;
    } catch {
      return send(ws, { type: "error", message: "Malformed message." });
    }

    const attachment = ws.deserializeAttachment() as Attachment;

    if (message.type === "join") {
      const error = joinLobby(state, String(message.playerId), message.name);
      if (error) return send(ws, { type: "error", message: error });
      ws.serializeAttachment({
        playerId: message.playerId,
      } satisfies Attachment);
      return this.commit();
    }

    const playerId = attachment.playerId;
    if (!playerId || !isMember(state, playerId)) {
      return send(ws, { type: "error", message: "Join the lobby first." });
    }

    let error: string | null = null;
    switch (message.type) {
      case "startRound":
        error = startRound(state, playerId);
        break;
      case "chooseGear":
        error = isGear(message.gear)
          ? chooseGear(state, playerId, message.gear)
          : "Pick a gear from 1 to 4.";
        break;
      case "clearChoice":
        error = clearChoice(state, playerId);
        break;
      case "spunOut":
        error = spunOut(state, playerId);
        break;
      case "removePlayer":
        // Only players who have dropped off can be removed by others, so
        // nobody gets kicked from a phone they're holding.
        if (this.connectedPlayers().has(message.playerId)) {
          error = "That player is still connected.";
        } else {
          removePlayer(state, message.playerId);
        }
        break;
      case "leave":
        removePlayer(state, playerId);
        for (const socket of this.ctx.getWebSockets()) {
          const a = socket.deserializeAttachment() as Attachment;
          if (a.playerId === playerId) {
            socket.serializeAttachment({ playerId: null } satisfies Attachment);
            send(socket, { type: "left" });
          }
        }
        break;
      default:
        error = "Unknown message.";
    }

    if (error) return send(ws, { type: "error", message: error });
    await this.commit();
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    try {
      ws.close(code, reason);
    } catch {
      // Already closed.
    }
    this.broadcast(ws);
  }

  async webSocketError(ws: WebSocket) {
    this.broadcast(ws);
  }

  async alarm() {
    // Every change pushes the alarm back, so firing means the lobby is idle.
    for (const ws of this.ctx.getWebSockets()) ws.close(1000, "Lobby expired");
    await this.ctx.storage.deleteAll();
    this.state = null;
  }

  private async commit() {
    await this.save();
    this.broadcast();
  }

  private async save() {
    await this.ctx.storage.put(STATE_KEY, this.state);
    await this.ctx.storage.setAlarm(Date.now() + IDLE_LIFETIME_MS);
  }

  private connectedPlayers(except?: WebSocket): Set<string> {
    const ids = new Set<string>();
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except) continue;
      const { playerId } = ws.deserializeAttachment() as Attachment;
      if (playerId) ids.add(playerId);
    }
    return ids;
  }

  // Sends every socket its own view: other players' picks stay hidden until
  // everyone has chosen.
  private broadcast(closing?: WebSocket) {
    const state = this.state;
    if (!state) return;
    const connected = this.connectedPlayers(closing);
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === closing) continue;
      const { playerId } = ws.deserializeAttachment() as Attachment;
      if (!playerId || !isMember(state, playerId)) continue;
      send(ws, { type: "state", lobby: viewFor(state, playerId, connected) });
    }
  }
}

function send(ws: WebSocket, message: ServerMessage) {
  try {
    ws.send(JSON.stringify(message));
  } catch {
    // The socket closed in the meantime; its close handler cleans up.
  }
}
