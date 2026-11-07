import {
  MAX_PLAYERS,
  type LobbyView,
  type PlayerView,
} from "../../shared/protocol";
import { colors, panel } from "../ui/theme";
import { GearBadge } from "./GearBadge";

interface Props {
  lobby: LobbyView;
  onRemove: (player: PlayerView) => void;
}

export function PlayerList({ lobby, onRemove }: Props) {
  const choosing = lobby.phase === "choosing";

  return (
    <section style={panel}>
      <div style={styles.heading}>
        <span>Players</span>
        <span style={{ color: colors.faint }}>
          {lobby.players.length}/{MAX_PLAYERS}
        </span>
      </div>
      <ul style={styles.list}>
        {lobby.players.map((player) => (
          <li key={player.id} style={styles.row}>
            <GearBadge gear={player.gear} />
            <span style={styles.name}>
              {player.name}
              {player.id === lobby.you && (
                <span style={{ color: colors.faint }}> (you)</span>
              )}
            </span>
            {choosing && <ChoiceStatus player={player} />}
            {!player.connected && (
              <>
                <span style={{ ...styles.status, color: colors.faint }}>
                  offline
                </span>
                <button
                  style={styles.remove}
                  aria-label={`Remove ${player.name}`}
                  onClick={() => onRemove(player)}
                >
                  ×
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ChoiceStatus({ player }: { player: PlayerView }) {
  if (!player.inRound) {
    return (
      <span style={{ ...styles.status, color: colors.faint }}>next round</span>
    );
  }
  if (player.hasChosen) {
    return (
      <span style={{ ...styles.status, color: colors.good }}>✓ locked in</span>
    );
  }
  return (
    <span className="pulse" style={{ ...styles.status, color: colors.warn }}>
      choosing…
    </span>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.85rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: colors.muted,
    marginBottom: "0.5rem",
  },
  list: { listStyle: "none", margin: 0, padding: 0 },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.45rem 0",
    borderTop: `1px solid ${colors.raised}`,
  },
  name: {
    flex: 1,
    fontSize: "1.05rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  status: { fontSize: "0.85rem", whiteSpace: "nowrap" },
  remove: {
    background: "none",
    border: "none",
    color: colors.muted,
    fontSize: "1.3rem",
    lineHeight: 1,
    padding: "0 0.25rem",
  },
};
