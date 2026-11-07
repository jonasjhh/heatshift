import {
  BASE_GAME_COLORS,
  CAR_COLORS,
  type CarColor,
} from "../../shared/protocol";
import { carColors, colors } from "../ui/theme";

interface Props {
  value: CarColor | null;
  taken?: readonly CarColor[];
  onChange: (color: CarColor) => void;
}

// One swatch per car colour. Colours another player in the lobby already
// has are crossed out.
export function ColorPicker({ value, taken = [], onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Car colour" style={styles.grid}>
      {CAR_COLORS.map((color) => {
        const { label, fill, ink } = carColors[color];
        const isTaken = taken.includes(color);
        const selected = value === color;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${label}${isTaken ? " (taken)" : ""}${
              BASE_GAME_COLORS.includes(color) ? "" : " (extra)"
            }`}
            title={label}
            disabled={isTaken}
            onClick={() => onChange(color)}
            style={{
              ...styles.swatch,
              background: fill,
              color: ink,
              outline: selected ? `3px solid ${colors.accent}` : "none",
              transform: selected ? "scale(1.08)" : "none",
            }}
          >
            {isTaken ? "✕" : selected ? "✓" : ""}
          </button>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    gap: "0.45rem",
  },
  swatch: {
    aspectRatio: "1 / 1",
    width: "100%",
    borderRadius: 999,
    border: `2px solid ${colors.border}`,
    outlineOffset: 2,
    fontWeight: 800,
    fontSize: "0.95rem",
    padding: 0,
    transition: "transform 120ms",
  },
};
