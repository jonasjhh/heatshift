import { useState } from "react";
import { joinUrl } from "../app/route";
import { colors, help, panel, pillButton } from "../ui/theme";
import { QrCode } from "./QrCode";

// Everything another player needs to get in: scan the QR code, open the
// shared link, or type the four-letter code on the start screen.
export function InvitePanel({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = joinUrl(code);
  const canShare = typeof navigator.share === "function";

  const share = async () => {
    try {
      await navigator.share({
        title: "Join my Heatshift lobby",
        text: `Join lobby ${code} on Heatshift`,
        url,
      });
    } catch {
      // Share sheet dismissed.
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <section style={{ ...panel, ...styles.wrapper }}>
      <div style={help}>Scan to join, or enter the code</div>
      <div
        style={styles.code}
        aria-label={`Lobby code ${code.split("").join(" ")}`}
      >
        {code}
      </div>
      <QrCode value={url} size={196} />
      <div style={styles.actions}>
        {canShare && (
          <button style={pillButton} onClick={() => void share()}>
            Share link
          </button>
        )}
        <button style={pillButton} onClick={() => void copy()}>
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
    textAlign: "center",
  },
  code: {
    fontSize: "2.6rem",
    fontWeight: 800,
    letterSpacing: "0.35em",
    marginRight: "-0.35em",
    color: colors.accent,
    fontVariantNumeric: "tabular-nums",
  },
  actions: { display: "flex", gap: "0.5rem" },
};
