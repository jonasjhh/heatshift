import { useState } from "react";
import type { Gear } from "../../shared/protocol";
import { colors, gearColors, linkButton, pillButton } from "../ui/theme";

interface Props {
  choice: Gear;
  onChange: () => void;
}

// Shown once your gear is locked in: a face-down card, so nobody glancing
// at your phone can see your pick before the reveal. Hold to peek.
export function LockedInCard({ choice, onChange }: Props) {
  const [peeking, setPeeking] = useState(false);
  const color = gearColors[choice];

  return (
    <div style={styles.wrapper}>
      <div
        aria-live="polite"
        aria-label={
          peeking ? `Your pick: gear ${choice}` : "Your pick is hidden"
        }
        style={{
          ...styles.card,
          borderColor: peeking ? color : colors.border,
          color: peeking ? color : colors.faint,
        }}
      >
        <span style={styles.face}>{peeking ? choice : "?"}</span>
        <span style={styles.caption}>
          {peeking ? "your pick" : "locked in"}
        </span>
      </div>

      <button
        style={{ ...pillButton, ...styles.peek }}
        onPointerDown={() => setPeeking(true)}
        onPointerUp={() => setPeeking(false)}
        onPointerLeave={() => setPeeking(false)}
        onPointerCancel={() => setPeeking(false)}
        onBlur={() => setPeeking(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        Hold to peek
      </button>

      <button style={linkButton} onClick={onChange}>
        Change my pick
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.9rem",
  },
  card: {
    width: "min(60vw, 220px)",
    aspectRatio: "3 / 4",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4rem",
    borderRadius: 24,
    border: "3px solid",
    background: `repeating-linear-gradient(45deg, ${colors.panel} 0 12px, ${colors.raised} 12px 24px)`,
    userSelect: "none",
  },
  face: { fontSize: "5.5rem", fontWeight: 800, lineHeight: 1 },
  caption: {
    fontSize: "0.85rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  peek: {
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTouchCallout: "none",
    touchAction: "none",
  },
};
