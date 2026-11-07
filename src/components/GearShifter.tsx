import { GEARS, type Gear } from "../../shared/protocol";
import { shiftCost } from "../../shared/game";
import { colors } from "../ui/theme";

interface Props {
  current: Gear;
  selected: Gear;
  onSelect: (gear: Gear) => void;
}

const ROW = 92;
const HOLE = 72;
const KNOB = 86;
// Gear 4 at the top, like the shifter on the player board.
const ORDER: Gear[] = [...GEARS].reverse();
// Cooldown printed next to the low gears on the board.
const COOLDOWN: Partial<Record<Gear, number>> = { 1: 3, 2: 1 };

// A vertical 4-3-2-1 gate. The gear stick starts in your current gear and
// moves to the gear you tap; gears out of reach are dimmed and a skipped
// gear is marked with its Heat cost.
export function GearShifter({ current, selected, onSelect }: Props) {
  const knobIndex = ORDER.indexOf(selected);

  return (
    <div style={styles.plate}>
      <div style={styles.gate} role="radiogroup" aria-label="Choose your gear">
        <div style={styles.slot} />
        {ORDER.map((gear) => {
          const cost = shiftCost(current, gear);
          const allowed = cost !== null;
          const cooldown = COOLDOWN[gear];
          return (
            <div key={gear} style={styles.row}>
              <span style={styles.left}>
                {cost === 1 && <span style={styles.heat}>+1 Heat</span>}
              </span>
              <button
                role="radio"
                aria-checked={selected === gear}
                aria-label={`Gear ${gear}${cost === 1 ? ", costs 1 Heat" : ""}`}
                disabled={!allowed}
                onClick={() => onSelect(gear)}
                style={{
                  ...styles.hole,
                  // Dim the number, not the hole, so the slot doesn't show
                  // through an unreachable gear.
                  color: allowed ? "#f4f1ec" : "#4a4a4a",
                }}
              >
                {gear}
              </button>
              <span style={styles.right}>
                {cooldown && (
                  <span
                    style={styles.cool}
                    title={`Cooldown ${cooldown} in gear ${gear}`}
                  >
                    ❄ {cooldown}
                  </span>
                )}
              </span>
            </div>
          );
        })}
        <div
          aria-hidden
          style={{
            ...styles.knob,
            transform: `translate(-50%, ${knobIndex * ROW + (ROW - KNOB) / 2}px)`,
          }}
        >
          <span style={styles.knobLabel}>{selected}</span>
        </div>
      </div>
    </div>
  );
}

const metal = [
  "repeating-linear-gradient(100deg, rgba(255,255,255,0.05) 0 2px, rgba(0,0,0,0.05) 2px 5px)",
  "linear-gradient(160deg, #c9cdd1 0%, #8d9296 45%, #b5b9bd 70%, #7b8085 100%)",
].join(", ");

const styles: Record<string, React.CSSProperties> = {
  plate: {
    alignSelf: "center",
    background: metal,
    borderRadius: 14,
    border: "4px solid #0d0d0d",
    boxShadow: "inset 0 0 18px rgba(0,0,0,0.45), 0 6px 18px rgba(0,0,0,0.5)",
    padding: "10px 6px",
  },
  gate: { position: "relative", width: 250 },
  slot: {
    position: "absolute",
    left: "50%",
    top: ROW / 2,
    bottom: ROW / 2,
    width: 16,
    transform: "translateX(-50%)",
    background: "#0d0d0d",
    borderRadius: 4,
  },
  row: {
    position: "relative",
    height: ROW,
    display: "grid",
    gridTemplateColumns: `1fr ${HOLE}px 1fr`,
    alignItems: "center",
    columnGap: 10,
  },
  left: { justifySelf: "end" },
  right: { justifySelf: "start" },
  hole: {
    width: HOLE,
    height: HOLE,
    borderRadius: 999,
    border: "none",
    background: "radial-gradient(circle at 50% 40%, #222 0%, #050505 70%)",
    boxShadow: "inset 0 4px 8px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.4)",
    color: "#f4f1ec",
    fontSize: "2.4rem",
    fontWeight: 800,
    padding: 0,
  },
  heat: {
    background: colors.heat,
    color: "#fff",
    borderRadius: 6,
    padding: "0.15rem 0.4rem",
    fontSize: "0.75rem",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  cool: {
    background: "#2f8fd8",
    color: "#fff",
    borderRadius: 999,
    padding: "0.15rem 0.45rem",
    fontSize: "0.75rem",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  knob: {
    position: "absolute",
    top: 0,
    left: "50%",
    width: KNOB,
    height: KNOB,
    borderRadius: 999,
    pointerEvents: "none",
    background:
      "radial-gradient(circle at 34% 28%, #ffffff 0%, #d9d9d9 6%, #6a6a6a 22%, #262626 48%, #0a0a0a 78%)",
    boxShadow: "0 10px 16px rgba(0,0,0,0.6), inset 0 -6px 10px rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 260ms cubic-bezier(.3,1.4,.5,1)",
  },
  knobLabel: {
    color: colors.accent,
    fontSize: "1.9rem",
    fontWeight: 900,
    textShadow: "0 1px 2px #000",
  },
};
