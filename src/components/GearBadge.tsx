import type { Gear } from "../../shared/protocol";
import { colors, gearColors } from "../ui/theme";

export function GearBadge({ gear, size = 32 }: { gear: Gear; size?: number }) {
  return (
    <span
      aria-label={`Gear ${gear}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size / 4,
        background: gearColors[gear],
        color: colors.background,
        fontWeight: 800,
        fontSize: size * 0.55,
        flexShrink: 0,
      }}
    >
      {gear}
    </span>
  );
}
