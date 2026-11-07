import { useState } from "react";
import {
  MAX_PLAYERS,
  type CarColor,
  type LobbyView,
  type PlayerView,
} from "../../shared/protocol";
import { CarDot } from "./CarDot";
import { ColorPicker } from "./ColorPicker";
import { colors, panel } from "../ui/theme";
import { GearBadge } from "./GearBadge";

interface Props {
  lobby: LobbyView;
  onRemove: (player: PlayerView) => void;
  onChangeColor: (color: CarColor) => void;
}

export function PlayerList({ lobby, onRemove, onChangeColor }: Props) {
  const choosing = lobby.phase === "choosing";
  const [editingColor, setEditingColor] = useState(false);
  const me = lobby.players.find((p) => p.id === lobby.you);
  const othersColors = lobby.players
    .filter((p) => p.id !== lobby.you)
    .map((p) => p.color);

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
            {player.id === lobby.you ? (
              <button
                style={styles.dotButton}
                aria-label="Change your car colour"
                onClick={() => setEditingColor((v) => !v)}
              >
                <CarDot color={player.color} size={22} />
              </button>
            ) : (
              <CarDot color={player.color} size={22} />
            )}
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
      {me && (
        <div style={styles.colorEdit}>
          {editingColor ? (
            <ColorPicker
              value={me.color}
              taken={othersColors}
              onChange={(color) => {
                onChangeColor(color);
                setEditingColor(false);
              }}
            />
          ) : (
            <button
              style={styles.changeColor}
              onClick={() => setEditingColor(true)}
            >
              Change my colour
            </button>
          )}
        </div>
      )}
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
  dotButton: {
    background: "none",
    border: "none",
    padding: 0,
    display: "inline-flex",
  },
  colorEdit: {
    marginTop: "0.6rem",
    paddingTop: "0.6rem",
    borderTop: `1px solid ${colors.raised}`,
  },
  changeColor: {
    background: "none",
    border: "none",
    color: colors.accent,
    fontSize: "0.9rem",
    padding: 0,
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
