import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function QrCode({
  value,
  size = 200,
}: {
  value: string;
  size?: number;
}) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, {
      type: "svg",
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#16110e", light: "#ffffff" },
    })
      .then((markup) => !cancelled && setSvg(markup))
      .catch(() => !cancelled && setSvg(null));
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div
      role="img"
      aria-label={`QR code for ${value}`}
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        overflow: "hidden",
        background: "#fff",
      }}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
