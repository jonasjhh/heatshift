import { useEffect, useRef, useState } from "react";
import { shiftCost } from "../../shared/game";
import type {
  CarColor,
  Gear,
  LobbyView,
  Phase,
  PlayerView,
} from "../../shared/protocol";
import { getPlayerId, saveColor } from "../app/identity";
import { GearBadge } from "../components/GearBadge";
import { GearShifter } from "../components/GearShifter";
import { LockedInCard } from "../components/LockedInCard";
import { InvitePanel } from "../components/InvitePanel";
import { PlayerList } from "../components/PlayerList";
import { RevealBoard } from "../components/RevealBoard";
import { useLobby, type LobbyConnection } from "../lobby/useLobby";
import { useWakeLock } from "../lobby/useWakeLock";
import {
  colors,
  help,
  linkButton,
  page,
  pillButton,
  primaryButton,
} from "../ui/theme";

interface Props {
  code: string;
  name: string;
  onExit: (notice: string | null) => void;
}

export function LobbyScreen({ code, name, onExit }: Props) {
  const playerId = getPlayerId();
  const connection = useLobby(code, playerId, name);
  const { lobby, status, error, joined } = connection;
  useWakeLock();
  useBuzzOnPhaseChange(lobby?.phase);

  useEffect(() => {
    if (status === "left") onExit(null);
    if (status === "missing") onExit(`Lobby ${code} doesn't exist anymore.`);
  }, [status, code, onExit]);

  useEffect(() => {
    // Rejected before ever getting in (lobby full, bad name): go back.
    if (error && !joined) onExit(error.message);
  }, [error, joined, onExit]);

  if (!lobby) {
    return (
      <main style={{ ...page, textAlign: "center", paddingTop: "4rem" }}>
        <p className="pulse" style={help}>
          Connecting to lobby {code}…
        </p>
        <button style={linkButton} onClick={() => onExit(null)}>
          Cancel
        </button>
      </main>
    );
  }

  return <Lobby lobby={lobby} connection={connection} onExit={onExit} />;
}

function Lobby({
  lobby,
  connection,
  onExit,
}: {
  lobby: LobbyView;
  connection: LobbyConnection;
  onExit: Props["onExit"];
}) {
  const { send, status } = connection;
  const me = lobby.players.find((p) => p.id === lobby.you);

  const leave = () => {
    if (!window.confirm("Leave this lobby?")) return;
    if (status === "open") send({ type: "leave" });
    else onExit(null);
  };

  const changeColor = (color: CarColor) => {
    saveColor(color);
    send({ type: "setColor", color });
  };

  const remove = (player: PlayerView) => {
    if (window.confirm(`Remove ${player.name} from the lobby?`)) {
      send({ type: "removePlayer", playerId: player.id });
    }
  };

  return (
    <main style={page}>
      <header style={styles.header}>
        <div>
          <div style={styles.brand}>Heatshift</div>
          <div style={styles.subtitle}>
            Lobby <strong style={{ color: colors.text }}>{lobby.code}</strong>
            {lobby.round > 0 && <> · Round {lobby.round}</>}
          </div>
        </div>
        <ConnectionDot status={status} />
        <button style={pillButton} onClick={leave}>
          Leave
        </button>
      </header>

      <ErrorToast connection={connection} />

      <div style={styles.body}>
        {lobby.phase === "lobby" && <WaitingRoom lobby={lobby} send={send} />}
        {lobby.phase === "choosing" && me && (
          <Choosing lobby={lobby} me={me} send={send} />
        )}
        {lobby.phase === "revealed" && me && (
          <Revealed lobby={lobby} me={me} send={send} />
        )}

        <PlayerList
          lobby={lobby}
          onRemove={remove}
          onChangeColor={changeColor}
        />

        {lobby.phase !== "lobby" && (
          <details style={styles.details}>
            <summary style={styles.summary}>Invite more players</summary>
            <div style={{ marginTop: "0.75rem" }}>
              <InvitePanel code={lobby.code} />
            </div>
          </details>
        )}
      </div>
    </main>
  );
}

type Send = LobbyConnection["send"];

function WaitingRoom({ lobby, send }: { lobby: LobbyView; send: Send }) {
  return (
    <>
      <InvitePanel code={lobby.code} />
      <button
        style={primaryButton}
        onClick={() => send({ type: "startRound" })}
      >
        Start round
      </button>
      <p style={{ ...help, textAlign: "center", margin: 0 }}>
        Everyone starts in 1st gear. Anyone can start a round once all racers
        are in.
      </p>
    </>
  );
}

function Choosing({
  lobby,
  me,
  send,
}: {
  lobby: LobbyView;
  me: PlayerView;
  send: Send;
}) {
  if (!me.inRound) {
    return (
      <section style={styles.centered}>
        <h2 style={styles.h2}>Round {lobby.round} in progress</h2>
        <p style={help}>
          You joined mid-round — you're in from the next round, starting in gear{" "}
          {me.gear}.
        </p>
      </section>
    );
  }

  const waitingOn = lobby.players.filter((p) => p.inRound && !p.hasChosen);
  const others = waitingOn.filter((p) => p.id !== me.id);

  return (
    <section style={styles.stack}>
      <div style={styles.centered}>
        <h2 style={styles.h2}>Round {lobby.round}: shift gears</h2>
        <p style={{ ...help, margin: 0 }}>
          You're in <GearBadge gear={me.gear} size={22} /> — pick your new gear
          in secret.
        </p>
      </div>

      {lobby.yourChoice === null ? (
        <>
          <ShiftChooser
            key={lobby.round}
            current={me.gear}
            onLockIn={(gear) => send({ type: "chooseGear", gear })}
          />
        </>
      ) : (
        <>
          <LockedInCard
            choice={lobby.yourChoice}
            onChange={() => send({ type: "clearChoice" })}
          />
          <p style={{ ...help, textAlign: "center", margin: 0 }}>
            {others.length > 0
              ? `Waiting for ${others.map((p) => p.name).join(", ")}.`
              : "Revealing…"}
          </p>
        </>
      )}
    </section>
  );
}

// Move the stick with taps, then lock in. Nothing is sent until you lock
// in, so changing your mind on the shifter is free.
function ShiftChooser({
  current,
  onLockIn,
}: {
  current: Gear;
  onLockIn: (gear: Gear) => void;
}) {
  const [gear, setGear] = useState<Gear>(current);
  const cost = shiftCost(current, gear) ?? 0;
  return (
    <>
      <GearShifter current={current} selected={gear} onSelect={setGear} />
      <button style={primaryButton} onClick={() => onLockIn(gear)}>
        Lock in gear {gear}
        {cost > 0 && ` (+${cost} Heat)`}
      </button>
      <p style={{ ...help, textAlign: "center", margin: 0 }}>
        Shifting 1 gear is free; skipping a gear costs 1 Heat.
      </p>
    </>
  );
}

function Revealed({
  lobby,
  me,
  send,
}: {
  lobby: LobbyView;
  me: PlayerView;
  send: Send;
}) {
  const reveal = lobby.lastReveal;
  return (
    <section style={styles.stack}>
      {reveal && (
        <>
          <h2 style={{ ...styles.h2, textAlign: "center" }}>
            Round {reveal.round} gears
          </h2>
          <RevealBoard reveal={reveal} you={lobby.you} />
        </>
      )}
      <button
        style={primaryButton}
        onClick={() => send({ type: "startRound" })}
      >
        Start round {lobby.round + 1}
      </button>
      {me.gear !== 1 && (
        <button
          style={{ ...linkButton, alignSelf: "center" }}
          onClick={() => {
            if (window.confirm("Spun out? Drop back to 1st gear.")) {
              send({ type: "spunOut" });
            }
          }}
        >
          Spun out? Drop to 1st gear
        </button>
      )}
    </section>
  );
}

function ConnectionDot({ status }: { status: LobbyConnection["status"] }) {
  const online = status === "open";
  return (
    <span
      title={online ? "Connected" : "Reconnecting…"}
      className={online ? undefined : "pulse"}
      style={{
        ...styles.dot,
        background: online ? colors.good : colors.warn,
      }}
    />
  );
}

function ErrorToast({ connection }: { connection: LobbyConnection }) {
  const { error } = connection;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!error) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(timer);
  }, [error]);

  if (!visible || !error) return null;
  return (
    <div role="alert" style={styles.toast}>
      {error.message}
    </div>
  );
}

// A short buzz when a round starts and when the gears are revealed, so a
// phone lying on the table gets noticed.
function useBuzzOnPhaseChange(phase: Phase | undefined) {
  const previous = useRef(phase);
  useEffect(() => {
    if (previous.current && phase && previous.current !== phase) {
      if (phase === "choosing") navigator.vibrate?.(80);
      if (phase === "revealed") navigator.vibrate?.([60, 60, 120]);
    }
    previous.current = phase;
  }, [phase]);
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1rem",
  },
  brand: {
    fontWeight: 900,
    fontStyle: "italic",
    color: colors.accent,
    fontSize: "1.3rem",
  },
  subtitle: { color: colors.muted, fontSize: "0.9rem" },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginLeft: "auto",
    flexShrink: 0,
  },
  body: { display: "flex", flexDirection: "column", gap: "1rem" },
  stack: { display: "flex", flexDirection: "column", gap: "1rem" },
  centered: { textAlign: "center" },
  h2: { margin: "0 0 0.4rem", fontSize: "1.35rem" },
  details: { color: colors.muted },
  summary: { cursor: "pointer", padding: "0.25rem 0" },
  toast: {
    position: "fixed",
    left: "50%",
    bottom: "1.5rem",
    transform: "translateX(-50%)",
    background: colors.raised,
    border: `1px solid ${colors.heat}`,
    color: colors.text,
    padding: "0.6rem 1rem",
    borderRadius: 12,
    zIndex: 1000,
    maxWidth: "90vw",
    boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
  },
};
