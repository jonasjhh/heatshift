import { Hono } from "hono";
import {
  LOBBY_CODE_ALPHABET,
  LOBBY_CODE_LENGTH,
  isValidLobbyCode,
  normalizeLobbyCode,
} from "../shared/protocol";
import type { Env } from "./lobby";

export { Lobby } from "./lobby";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) => c.json({ status: "ok" }));

// Hands out a fresh lobby code backed by its own Durable Object.
app.post("/api/lobbies", async (c) => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const stub = c.env.LOBBY.get(c.env.LOBBY.idFromName(code));
    if (await stub.create(code)) return c.json({ code }, 201);
  }
  return c.json({ error: "Could not allocate a lobby code." }, 503);
});

app.get("/api/lobbies/:code", async (c) => {
  const code = normalizeLobbyCode(c.req.param("code"));
  if (!isValidLobbyCode(code)) return c.json({ error: "Invalid code" }, 400);
  const stub = c.env.LOBBY.get(c.env.LOBBY.idFromName(code));
  const summary = await stub.summary(c.req.query("player") ?? null);
  return summary ? c.json(summary) : c.json({ error: "Lobby not found" }, 404);
});

app.get("/api/lobbies/:code/ws", async (c) => {
  const code = normalizeLobbyCode(c.req.param("code"));
  if (!isValidLobbyCode(code)) return c.json({ error: "Invalid code" }, 400);
  const stub = c.env.LOBBY.get(c.env.LOBBY.idFromName(code));
  return stub.fetch(c.req.raw);
});

app.notFound((c) => {
  if (new URL(c.req.url).pathname.startsWith("/api/")) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

function randomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(LOBBY_CODE_LENGTH));
  return Array.from(
    bytes,
    (b) => LOBBY_CODE_ALPHABET[b % LOBBY_CODE_ALPHABET.length],
  ).join("");
}

export default app;
