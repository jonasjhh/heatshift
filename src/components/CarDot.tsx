import type { CarColor } from "../../shared/protocol";
import { carColors, colors } from "../ui/theme";

export function CarDot({
  color,
  size = 14,
}: {
  color: CarColor;
  size?: number;
}) {
  return (
    <span
      aria-label={`${carColors[color].label} car`}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: 999,
        background: carColors[color].fill,
        border: `2px solid ${colors.border}`,
        flexShrink: 0,
        verticalAlign: "middle",
      }}
    />
  );
}
