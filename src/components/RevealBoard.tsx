import type { RevealView } from "../../shared/protocol";
import { carColors, colors, gearColors } from "../ui/theme";
import { CarDot } from "./CarDot";

interface Props {
  reveal: RevealView;
  you: string;
}

// Every player's new gear, shown at once.
export function RevealBoard({ reveal, you }: Props) {
  return (
    <ul style={styles.grid} aria-label={`Round ${reveal.round} gears`}>
      {reveal.results.map((result) => {
        const color = gearColors[result.to];
        const mine = result.playerId === you;
        return (
          <li
            key={`${reveal.round}-${result.playerId}`}
            className="reveal-card"
            style={{
              ...styles.card,
              borderColor: carColors[result.color].fill,
              boxShadow: mine ? `0 0 0 2px ${colors.text}` : "none",
            }}
          >
            <span style={styles.name}>
              <CarDot color={result.color} size={12} /> {result.name}
              {mine && " (you)"}
            </span>
            <span style={{ ...styles.gear, color }}>{result.to}</span>
            <span style={styles.shift}>
              {describeShift(result.from, result.to)}
            </span>
            {result.heatCost > 0 && (
              <span style={styles.heat}>+{result.heatCost} Heat</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function describeShift(from: number, to: number): string {
  if (from === to) return `stayed in ${to}`;
  return `${from} → ${to}`;
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: "0.75rem",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.2rem",
    padding: "0.75rem 0.5rem",
    borderRadius: 16,
    border: "3px solid",
    background: colors.panel,
    textAlign: "center",
  },
  name: {
    fontWeight: 600,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  gear: { fontSize: "3.4rem", fontWeight: 800, lineHeight: 1.05 },
  shift: { color: colors.muted, fontSize: "0.85rem" },
  heat: {
    marginTop: "0.2rem",
    padding: "0.1rem 0.6rem",
    borderRadius: 999,
    background: colors.heat,
    color: "#fff",
    fontSize: "0.8rem",
    fontWeight: 700,
  },
};
