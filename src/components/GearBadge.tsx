import type { CarColor, Gear } from "../../shared/protocol";
import { carColors, colors } from "../ui/theme";

interface Props {
  gear: Gear;
  // The player's car colour, so the badge doubles as their car marker.
  color: CarColor;
  size?: number;
}

export function GearBadge({ gear, color, size = 32 }: Props) {
  const { label, fill, ink } = carColors[color];
  return (
    <span
      aria-label={`${label} car, gear ${gear}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size / 4,
        background: fill,
        color: ink,
        // Keeps the black car visible on the dark background.
        boxShadow: `inset 0 0 0 2px ${colors.border}`,
        fontWeight: 800,
        fontSize: size * 0.55,
        flexShrink: 0,
        verticalAlign: "middle",
      }}
    >
      {gear}
    </span>
  );
}
