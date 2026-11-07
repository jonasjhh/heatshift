import { GEARS, type Gear } from "../../shared/protocol";
import { shiftCost } from "../../shared/game";
import { colors, gearColors } from "../ui/theme";

interface Props {
  current: Gear;
  selected: Gear | null;
  onSelect: (gear: Gear) => void;
}

// The four gears, with the ones out of reach from the current gear greyed
// out and a skipped-gear shift marked with its Heat cost.
export function GearPicker({ current, selected, onSelect }: Props) {
  return (
    <div style={styles.grid} role="radiogroup" aria-label="Choose your gear">
      {GEARS.map((gear) => {
        const cost = shiftCost(current, gear);
        const allowed = cost !== null;
        const isSelected = selected === gear;
        const color = gearColors[gear];
        return (
          <button
            key={gear}
            role="radio"
            aria-checked={isSelected}
            disabled={!allowed}
            onClick={() => onSelect(gear)}
            style={{
              ...styles.gear,
              borderColor: isSelected ? color : colors.border,
              background: isSelected ? color : colors.panel,
              color: isSelected ? colors.background : colors.text,
              boxShadow: isSelected ? `0 0 24px ${color}66` : "none",
            }}
          >
            <span style={styles.number}>{gear}</span>
            <span style={styles.caption}>{caption(current, gear, cost)}</span>
          </button>
        );
      })}
    </div>
  );
}

function caption(current: Gear, gear: Gear, cost: number | null): string {
  if (cost === null) return "out of reach";
  if (gear === current) return "stay";
  const direction = gear > current ? "up" : "down";
  return cost > 0 ? `${direction} 2 · +${cost} Heat` : `${direction} 1`;
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem",
  },
  gear: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.25rem",
    aspectRatio: "1 / 1",
    borderRadius: 20,
    border: "3px solid",
    transition: "background 120ms, box-shadow 120ms",
  },
  number: { fontSize: "3.6rem", fontWeight: 800, lineHeight: 1 },
  caption: { fontSize: "0.85rem", fontWeight: 600, opacity: 0.85 },
};
